import { GAME_CONFIG } from "../config.js";

export const HIGH_SCORES_STORAGE_KEY = "viking-raid-sentry-high-scores";

export function createHighScoreEntry(state, now = new Date()) {
  return {
    score: state.score,
    defeatedShips: state.defeatedShipCount ?? 0,
    survivedWaves: Math.max(0, state.wave - 1),
    reachedWave: state.wave,
    createdAt: now.toISOString()
  };
}

export function insertHighScore(entries, entry, config = GAME_CONFIG) {
  return [...entries, entry]
    .filter(isHighScoreEntry)
    .sort((first, second) => second.score - first.score || second.defeatedShips - first.defeatedShips)
    .slice(0, config.SCORE.HIGH_SCORE_LIMIT);
}

export function loadHighScores(storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(HIGH_SCORES_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isHighScoreEntry) : [];
  } catch {
    return [];
  }
}

export function saveHighScores(entries, storage = window.localStorage) {
  try {
    storage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

function isHighScoreEntry(entry) {
  return (
    entry &&
    Number.isFinite(entry.score) &&
    Number.isFinite(entry.defeatedShips) &&
    Number.isFinite(entry.survivedWaves) &&
    Number.isFinite(entry.reachedWave) &&
    typeof entry.createdAt === "string"
  );
}
