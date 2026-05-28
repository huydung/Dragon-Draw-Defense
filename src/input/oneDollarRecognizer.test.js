import { describe, expect, test } from "vitest";
import { OneDollarRecognizer } from "./oneDollarRecognizer.js";

describe("$1 gesture recognizer integration", () => {
  test("recognizes configured Wind, Earth, and Fire glyphs", () => {
    const recognizer = new OneDollarRecognizer();

    expect(recognizer.recognize(toPoints([[0, 0], [50, 100], [100, 0]])).name).toBe("Wind");
    expect(recognizer.recognize(toPoints([[0, 50], [100, 50]])).name).toBe("Earth");
    expect(recognizer.recognize(toPoints([[10, 90], [50, 10], [90, 90], [10, 90]])).name).toBe("Fire");
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
