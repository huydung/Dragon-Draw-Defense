import { describe, expect, test } from "vitest";
import { GAME_CONFIG } from "../config.js";
import { OneDollarRecognizer } from "./oneDollarRecognizer.js";

describe("$1 gesture recognizer integration", () => {
  test("recognizes all configured elemental glyph templates", () => {
    const recognizer = new OneDollarRecognizer();

    for (const [name, points] of Object.entries(recognizer.config.GESTURES.TEMPLATES)) {
      const result = recognizer.recognize(toPoints(points));
      expect(result.name).toBe(name);
      expect(result.accepted).toBe(true);
      expect(result.candidates[0].name).toBe(name);
    }
  });

  test("limits recognition to requested candidate names", () => {
    const recognizer = new OneDollarRecognizer();
    const result = recognizer.recognize(toPoints(recognizer.config.GESTURES.TEMPLATES.Fire), ["Wind", "Water"]);

    expect(["Wind", "Water"]).toContain(result.name);
    expect(result.candidates.every((candidate) => ["Wind", "Water"].includes(candidate.name))).toBe(true);
  });

  test("rejects ambiguous gestures when top candidates are too close", () => {
    const recognizer = new OneDollarRecognizer({
      ...GAME_CONFIG,
      GESTURES: {
        ...GAME_CONFIG.GESTURES,
        TEMPLATES: {
          First: [
            [10, 10],
            [90, 90]
          ],
          Second: [
            [10, 10],
            [90, 90]
          ]
        }
      }
    });
    const result = recognizer.recognize(toPoints([[10, 10], [90, 90]]));

    expect(result.accepted).toBe(false);
    expect(result.ambiguous).toBe(true);
  });

  test("rejects chaotic scribbles below the acceptance threshold", () => {
    const recognizer = new OneDollarRecognizer();
    const result = recognizer.recognize(
      toPoints([
        [10, 10],
        [90, 20],
        [20, 85],
        [75, 70],
        [30, 30],
        [95, 92],
        [5, 60]
      ])
    );

    expect(result.accepted).toBe(false);
  });
});

function toPoints(points) {
  return points.map(([x, y]) => ({ x, y }));
}
