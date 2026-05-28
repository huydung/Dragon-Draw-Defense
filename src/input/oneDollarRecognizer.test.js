import { describe, expect, test } from "vitest";
import { OneDollarRecognizer } from "./oneDollarRecognizer.js";

describe("$1 gesture recognizer integration", () => {
  test("recognizes all configured elemental glyph templates", () => {
    const recognizer = new OneDollarRecognizer();

    for (const [name, points] of Object.entries(recognizer.config.GESTURES.TEMPLATES)) {
      expect(recognizer.recognize(toPoints(points)).name).toBe(name);
    }
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
