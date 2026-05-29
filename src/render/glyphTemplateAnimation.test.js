import { describe, expect, test } from "vitest";
import { createAnimatedTemplatePath, getTemplateBounds, scaleTemplatePoint } from "./glyphTemplateAnimation.js";

describe("glyph template animation helpers", () => {
  test("scales templates into the target rectangle while preserving aspect ratio", () => {
    const bounds = getTemplateBounds([
      [0, 0],
      [100, 50]
    ]);
    const point = scaleTemplatePoint([100, 50], bounds, { x: 10, y: 20, width: 80, height: 80 });

    expect(point).toEqual({ x: 90, y: 80 });
  });

  test("reveals completed and partial segments in drawing order", () => {
    const path = createAnimatedTemplatePath(
      [
        [0, 0],
        [10, 0],
        [10, 10]
      ],
      0.75
    );

    expect(path.completedSegments).toEqual([{ from: [0, 0], to: [10, 0] }]);
    expect(path.partialSegment).toEqual({ from: [10, 0], to: [10, 5] });
    expect(path.revealedPointCount).toBe(2);
  });

  test("returns a fully completed path at full progress", () => {
    const path = createAnimatedTemplatePath(
      [
        [0, 0],
        [10, 0],
        [10, 10]
      ],
      1
    );

    expect(path.completedSegments).toHaveLength(2);
    expect(path.partialSegment).toBeNull();
    expect(path.revealedPointCount).toBe(3);
  });
});
