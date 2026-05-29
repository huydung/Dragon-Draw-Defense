import { GAME_CONFIG } from "../config.js";

export function calculateScore(wave, hasPrecisionBonus, config = GAME_CONFIG) {
  const waveScore = config.SCORE.BASE_SCORE_PER_KILL * wave;
  return hasPrecisionBonus ? waveScore + config.SCORE.PRECISION_BONUS_SCORE : waveScore;
}

export function calculateShipSpeed(wave, config = GAME_CONFIG) {
  return config.WAVES.BASE_SHIP_SPEED * (1 + config.WAVES.SPEED_GROWTH_MULTIPLIER) ** (wave - 1);
}

export function handleShipBreach(state, config = GAME_CONFIG) {
  const nextHealth = Math.max(0, state.health - 1);
  const nextState = {
    ...state,
    health: nextHealth,
    gameOver: nextHealth === 0
  };

  console.log(
    `[STATE:DAMAGE] Ship breached boundary. HP decremented. Current HP: ${nextState.health}/${config.HEALTH.INITIAL_HEALTH}.`
  );

  return nextState;
}

export function isPrecisionGesture(score, config = GAME_CONFIG) {
  return score >= config.GESTURES.GESTURE_PRECISION_THRESHOLD;
}
