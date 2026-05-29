import { GAME_CONFIG } from "../config.js";
import { calculateShipSpeed, handleShipBreach } from "./gameRules.js";
import { selectWaveElements } from "./waveElements.js";

export function createInitialGameState(config = GAME_CONFIG, rng = Math.random, nowMs = 0) {
  return createWaveState(
    {
      health: config.HEALTH.INITIAL_HEALTH,
      score: 0,
      defeatedShipCount: 0,
      lasers: [],
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
    nextState = applyBreaches(nextState, nowMs, config);

    if (!nextState.gameOver && isWaveCleared(nextState)) {
      nextState = createWaveState(nextState, nextState.wave + 1, nowMs, rng, config);
    }
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
  if (wave === 1) {
    return config.WAVES.WAVE_1_SHIP_COUNT;
  }

  if (wave === 2) {
    return config.WAVES.WAVE_2_SHIP_COUNT;
  }

  return config.WAVES.WAVE_3_SHIP_COUNT + (wave - 3) * config.WAVES.WAVE_AFTER_3_SHIP_INCREMENT;
}

function createWaveState(baseState, wave, nowMs, rng, config) {
  const activeElements = selectWaveElements(wave, rng, config);
  const shipCount = getWaveShipCount(wave, config);
  const shipSpeed = calculateShipSpeed(wave, config);

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
    transitionUntilMs: nowMs + config.WAVES.WAVE_TRANSITION_DELAY_MS,
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
      nextSpawnAtMs: nowMs + randomBetween(config.WAVES.MIN_SPAWN_INTERVAL_MS, config.WAVES.MAX_SPAWN_INTERVAL_MS, rng)
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

function applyBreaches(state, nowMs, config) {
  let nextState = state;
  const breachedShipIds = state.ships
    .filter((ship) => ship.active && ship.x <= config.PLAYFIELD.DAMAGE_PERIMETER_X)
    .map((ship) => ship.id);

  for (const shipId of breachedShipIds) {
    nextState = handleShipBreach(nextState, config);
    nextState = {
      ...nextState,
      resolvedShipCount: nextState.resolvedShipCount + 1,
      damageFlashUntilMs: nowMs + config.RENDER.DAMAGE_FLASH_DURATION_MS,
      ships: nextState.ships.map((ship) => (ship.id === shipId ? { ...ship, active: false, breached: true } : ship))
    };
  }

  return nextState;
}

function isWaveCleared(state) {
  return state.spawnedShipCount >= state.waveShipCount && state.resolvedShipCount >= state.waveShipCount;
}

function randomBetween(min, max, rng) {
  return min + (max - min) * rng();
}
