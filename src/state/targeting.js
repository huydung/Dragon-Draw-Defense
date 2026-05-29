import { GAME_CONFIG } from "../config.js";
import { calculateScore, isPrecisionGesture } from "./gameRules.js";
import { createInitialGameState } from "./gameLoop.js";

export function createInitialState(config = GAME_CONFIG, rng = Math.random) {
  return createInitialGameState(config, rng, 0);
}

export function findClosestMatchingShip(ships, weakness) {
  return ships
    .filter((ship) => ship.active && ship.weakness === weakness)
    .sort((firstShip, secondShip) => firstShip.x - secondShip.x)[0];
}

export function applyGlyphStrike(state, gesture, nowMs, config = GAME_CONFIG) {
  const target = findClosestMatchingShip(state.ships, gesture.name);

  if (!target) {
    return {
      ...state,
      feedback: {
        kind: "miss",
        text: `${gesture.name} matched, no target`,
        untilMs: nowMs + config.RENDER.FEEDBACK_DURATION_MS
      }
    };
  }

  const precision = isPrecisionGesture(gesture.score, config);
  const scoreGain = calculateScore(state.wave, precision, config);
  const activeDragonIndex = state.activeElements?.indexOf(gesture.name) ?? -1;
  const dragonPosition =
    activeDragonIndex >= 0
      ? config.PLAYFIELD.ACTIVE_DRAGON_POSITIONS[activeDragonIndex]
      : config.PLAYFIELD.DRAGON_POSITIONS[gesture.name];

  console.log(
    `[STATE:KILL] ${gesture.name} strike cleared ${target.id}. Score +${scoreGain}. Precision bonus: ${precision}.`
  );

  return {
    ...state,
    score: state.score + scoreGain,
    defeatedShipCount: (state.defeatedShipCount ?? 0) + 1,
    resolvedShipCount: (state.resolvedShipCount ?? 0) + 1,
    ships: state.ships.map((ship) => (ship.id === target.id ? { ...ship, active: false } : ship)),
    lasers: [
      ...state.lasers,
      {
        id: `${target.id}-${nowMs}`,
        from: dragonPosition,
        to: { x: target.x, y: target.y },
        color: config.ELEMENTS[gesture.name].color,
        expiresAtMs: nowMs + config.RENDER.LASER_DURATION_MS
      }
    ],
    explosions: [
      ...(state.explosions ?? []),
      {
        id: `${target.id}-explosion-${nowMs}`,
        x: target.x,
        y: target.y,
        color: config.ELEMENTS[gesture.name].color,
        sparks: createExplosionSparks(`${target.id}-${nowMs}`, config.RENDER.EXPLOSION_PARTICLE_COUNT),
        createdAtMs: nowMs,
        expiresAtMs: nowMs + config.RENDER.EXPLOSION_DURATION_MS
      }
    ],
    feedback: {
      kind: "hit",
      text: `${gesture.name} strike +${scoreGain}`,
      untilMs: nowMs + config.RENDER.FEEDBACK_DURATION_MS
    }
  };
}

export function pruneTransientState(state, nowMs) {
  return {
    ...state,
    lasers: state.lasers.filter((laser) => laser.expiresAtMs > nowMs),
    explosions: (state.explosions ?? []).filter((explosion) => explosion.expiresAtMs > nowMs),
    feedback: state.feedback?.untilMs > nowMs ? state.feedback : null
  };
}

function createExplosionSparks(seed, configuredCount) {
  const count = Math.min(8, Math.max(4, Math.round(configuredCount / 4)));

  return Array.from({ length: count }, (_, index) => {
    const hash = hashValue(`${seed}-${index}`);
    return {
      angle: ((hash % 6283) / 1000) % (Math.PI * 2),
      distanceScale: 0.55 + ((hash >>> 4) % 45) / 100,
      size: 9 + ((hash >>> 9) % 7),
      spin: ((hash >>> 13) % 2 === 0 ? -1 : 1) * (0.4 + ((hash >>> 16) % 40) / 100)
    };
  });
}

function hashValue(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}
