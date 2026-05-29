import { describe, expect, test } from "vitest";
import { createHighScoreEntry, insertHighScore, loadHighScores, saveHighScores } from "./highScores.js";

describe("local high scores", () => {
  test("creates an end-game entry from current survival state", () => {
    const entry = createHighScoreEntry(
      {
        score: 14150,
        defeatedShipCount: 42,
        wave: 6
      },
      new Date("2026-05-29T00:00:00.000Z")
    );

    expect(entry).toEqual({
      score: 14150,
      defeatedShips: 42,
      survivedWaves: 5,
      reachedWave: 6,
      createdAt: "2026-05-29T00:00:00.000Z"
    });
  });

  test("keeps the highest scores first and respects the configured limit", () => {
    const entries = insertHighScore(
      [
        highScore(1200, 8),
        highScore(3000, 18),
        highScore(900, 7)
      ],
      highScore(3000, 20),
      { SCORE: { HIGH_SCORE_LIMIT: 3 } }
    );

    expect(entries.map((entry) => [entry.score, entry.defeatedShips])).toEqual([
      [3000, 20],
      [3000, 18],
      [1200, 8]
    ]);
  });

  test("loads valid entries and ignores malformed storage", () => {
    const storage = createStorage();
    saveHighScores([highScore(500, 3)], storage);

    expect(loadHighScores(storage)).toHaveLength(1);

    storage.setItem("viking-raid-sentry-high-scores", "{");
    expect(loadHighScores(storage)).toEqual([]);
  });
});

function highScore(score, defeatedShips) {
  return {
    score,
    defeatedShips,
    survivedWaves: 1,
    reachedWave: 2,
    createdAt: "2026-05-29T00:00:00.000Z"
  };
}

function createStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    }
  };
}
