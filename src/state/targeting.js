import { GAME_CONFIG } from "../config.js";
import { calculateScore, isPrecisionGesture } from "./gameRules.js";

export function createInitialState(config = GAME_CONFIG) {
  return {
    health: config.HEALTH.INITIAL_HEALTH,
    wave: 1,
    score: 0,
    ships: config.PLAYFIELD.STATIC_SHIPS.map((ship) => ({ ...ship, active: true })),
    lasers: [],
    feedback: null,
    gameOver: false
  };
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
  const dragonIndex = config.ELEMENTS[gesture.name].dragonIndex;
  const dragonY = config.PLAYFIELD.DRAGON_Y_POSITIONS[dragonIndex];

  console.log(
    `[STATE:KILL] ${gesture.name} strike cleared ${target.id}. Score +${scoreGain}. Precision bonus: ${precision}.`
  );

  return {
    ...state,
    score: state.score + scoreGain,
    ships: state.ships.map((ship) => (ship.id === target.id ? { ...ship, active: false } : ship)),
    lasers: [
      ...state.lasers,
      {
        id: `${target.id}-${nowMs}`,
        from: { x: config.PLAYFIELD.DRAGON_X, y: dragonY },
        to: { x: target.x, y: target.y },
        color: config.ELEMENTS[gesture.name].color,
        expiresAtMs: nowMs + config.RENDER.LASER_DURATION_MS
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
    feedback: state.feedback?.untilMs > nowMs ? state.feedback : null
  };
}
