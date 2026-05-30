import { GAME_CONFIG } from "../config.js";
import { calculateShipSpeed, handleShipBreach } from "./gameRules.js";
import { selectWaveElements } from "./waveElements.js";

export function createInitialGameState(config = GAME_CONFIG, rng = Math.random, nowMs = 0) {
  return createWaveState(
    {
      health: config.HEALTH.INITIAL_HEALTH,
      score: 0,
      defeatedShipCount: 0,
      islandHitCount: 0,
      islandFires: [],
      dockedShips: [],
      lasers: [],
      explosions: [],
      feedback: null,
      gameOver: false
    },
    1,
    nowMs,
    rng,
    config
  );
}

export function advanceGameState(state, nowMs, rng = Math.random, config = GAME_CONFIG) {
  if (state.gameOver) {
    return {
      ...state,
      lastUpdateMs: nowMs
    };
  }

  let nextState = { ...state };
  const elapsedSeconds = Math.min((nowMs - state.lastUpdateMs) / 1000, config.UI.MAX_DELTA_SECONDS);

  if (nextState.phase === "transition") {
    if (nowMs >= nextState.transitionUntilMs) {
      console.log(`[STATE:SPAWN] Wave ${nextState.wave} active. Ship speed: ${nextState.shipSpeed.toFixed(1)} px/s.`);
      nextState = {
        ...nextState,
        phase: "active",
        nextSpawnAtMs: nowMs
      };
    }
  }

  if (nextState.phase === "active") {
    nextState = spawnDueShips(nextState, nowMs, rng, config);
    nextState = moveShips(nextState, elapsedSeconds);
    nextState = applyBreaches(nextState, nowMs, config, rng);

    if (!nextState.gameOver && isWaveCleared(nextState)) {
      nextState = {
        ...nextState,
        phase: "cleared",
        waveClearedUntilMs: nowMs + config.WAVES.WAVE_CLEAR_VFX_DELAY_MS
      };
    }
  }

  if (nextState.phase === "cleared" && nowMs >= nextState.waveClearedUntilMs) {
    nextState = createWaveState(nextState, nextState.wave + 1, nowMs, rng, config);
  }

  return {
    ...nextState,
    lastUpdateMs: nowMs
  };
}

export function restartGame(nowMs, rng = Math.random, config = GAME_CONFIG) {
  return createInitialGameState(config, rng, nowMs);
}

export function getWaveShipCount(wave, config = GAME_CONFIG) {
  return config.WAVES.BASE_SHIP_COUNT + (wave - 1) * config.WAVES.SHIP_COUNT_INCREMENT;
}

export function getWaveSpawnInterval(wave, config = GAME_CONFIG) {
  const intervalScale = config.WAVES.SPAWN_INTERVAL_DECAY ** (wave - 1);
  return {
    min: Math.max(config.WAVES.MIN_SPAWN_INTERVAL_FLOOR_MS, config.WAVES.BASE_MIN_SPAWN_INTERVAL_MS * intervalScale),
    max: Math.max(config.WAVES.MAX_SPAWN_INTERVAL_FLOOR_MS, config.WAVES.BASE_MAX_SPAWN_INTERVAL_MS * intervalScale)
  };
}

function createWaveState(baseState, wave, nowMs, rng, config) {
  const activeElements = selectWaveElements(wave, rng, config);
  const shipCount = getWaveShipCount(wave, config);
  const shipSpeed = calculateShipSpeed(wave, config);
  const spawnInterval = getWaveSpawnInterval(wave, config);

  console.log(`[STATE:SPAWN] Wave ${wave} queued with ${shipCount} ships.`);

  return {
    ...baseState,
    wave,
    activeElements,
    ships: [],
    phase: "transition",
    spawnedShipCount: 0,
    resolvedShipCount: 0,
    waveShipCount: shipCount,
    shipSpeed,
    spawnInterval,
    transitionUntilMs: nowMs + config.WAVES.WAVE_TRANSITION_DELAY_MS,
    waveClearedUntilMs: 0,
    nextSpawnAtMs: nowMs + config.WAVES.WAVE_TRANSITION_DELAY_MS,
    damageFlashUntilMs: baseState.damageFlashUntilMs ?? 0,
    lastUpdateMs: nowMs
  };
}

function spawnDueShips(state, nowMs, rng, config) {
  let nextState = { ...state };

  while (nextState.spawnedShipCount < nextState.waveShipCount && nowMs >= nextState.nextSpawnAtMs) {
    const weakness = nextState.activeElements[nextState.spawnedShipCount % nextState.activeElements.length];
    const y = randomBetween(config.PLAYFIELD.SHIP_MIN_Y, config.PLAYFIELD.SHIP_MAX_Y, rng);
    const shipNumber = nextState.spawnedShipCount + 1;
    const variantIndex = (shipNumber - 1) % config.RENDER.SHIP_VARIANT_PATHS.length;
    const ship = {
      id: `wave-${nextState.wave}-ship-${shipNumber}`,
      x: config.PLAYFIELD.SHIP_SPAWN_X,
      y,
      weakness,
      variantIndex,
      speed: nextState.shipSpeed,
      active: true
    };

    console.log(`[STATE:SPAWN] Spawned ${ship.id} (${weakness}) at y=${y.toFixed(1)}.`);

    nextState = {
      ...nextState,
      spawnedShipCount: shipNumber,
      ships: [...nextState.ships, ship],
      nextSpawnAtMs: nowMs + randomBetween(nextState.spawnInterval.min, nextState.spawnInterval.max, rng)
    };
  }

  return nextState;
}

function moveShips(state, elapsedSeconds) {
  return {
    ...state,
    ships: state.ships.map((ship) =>
      ship.active
        ? {
            ...ship,
            x: ship.x - ship.speed * elapsedSeconds
          }
        : ship
    )
  };
}

function applyBreaches(state, nowMs, config, rng) {
  let nextState = state;
  const breachedShipIds = state.ships
    .filter((ship) => ship.active && ship.x <= config.PLAYFIELD.DAMAGE_PERIMETER_X)
    .map((ship) => ship.id);

  for (const shipId of breachedShipIds) {
    if (nextState.gameOver) {
      break;
    }

    const breachedShip = nextState.ships.find((ship) => ship.id === shipId);
    nextState = handleShipBreach(nextState, config);
    const islandHitCount = (nextState.islandHitCount ?? 0) + 1;
    const dockedShip = createDockedShip(breachedShip);
    nextState = {
      ...nextState,
      islandHitCount,
      islandFires: [...(nextState.islandFires ?? []), ...createIslandFires(islandHitCount, rng)],
      dockedShips: dockedShip ? [...(nextState.dockedShips ?? []), dockedShip] : (nextState.dockedShips ?? []),
      resolvedShipCount: nextState.resolvedShipCount + 1,
      damageFlashUntilMs: nowMs + config.RENDER.DAMAGE_FLASH_DURATION_MS,
      gameOverDialogAtMs: nextState.gameOver ? nowMs + config.RENDER.GAME_OVER_REVEAL_DELAY_MS : 0,
      ships: nextState.ships.map((ship) => (ship.id === shipId ? { ...ship, active: false, breached: true } : ship))
    };
  }

  if (nextState.gameOver) {
    nextState = freezeRemainingShips(nextState);
  }

  return nextState;
}

function isWaveCleared(state) {
  return state.spawnedShipCount >= state.waveShipCount && state.resolvedShipCount >= state.waveShipCount;
}

function randomBetween(min, max, rng) {
  return min + (max - min) * rng();
}

function createIslandFires(islandHitCount, rng) {
  const fireCount = islandHitCount * 2;
  return Array.from({ length: fireCount }, (_, index) => ({
    x: randomBetween(14, 132, rng),
    y: randomBetween(72, 432, rng),
    size: randomBetween(38, 56, rng),
    rotation: randomBetween(-0.22, 0.22, rng),
    variantIndex: index % 2
  }));
}

function freezeRemainingShips(state) {
  const hasRemaining = state.ships.some((ship) => ship.active);
  if (!hasRemaining) return state;
  return {
    ...state,
    ships: state.ships.map((ship) => (ship.active ? { ...ship, active: false, frozen: true } : ship))
  };
}

function createDockedShip(ship) {
  if (!ship) {
    return null;
  }

  return {
    ...ship,
    id: `${ship.id}-docked`,
    speed: 0,
    active: false,
    breached: true,
    docked: true
  };
}
