import { describe, expect, test } from "vitest";
import {
  addShape,
  createDefaultShapeName,
  createRecognizerConfig,
  createSandboxState,
  deleteSelectedShape,
  appendSelectedPoint,
  deleteSelectedPoint,
  parsePointsJson,
  renameShape,
  simplifyStrokeToTemplate,
  updateSelectedPoint,
  updateSelectedShape
} from "./sandboxState.js";

describe("sandbox shape state", () => {
  test("loads templates from config and creates recognizer config copies", () => {
    const state = createSandboxState();
    const recognizerConfig = createRecognizerConfig(state.templates);

    expect(Object.keys(state.templates)).toContain("Wind");
    expect(recognizerConfig.GESTURES.TEMPLATES).not.toBe(state.templates);
  });

  test("supports add, rename, update, and delete CRUD flow", () => {
    let state = createSandboxState();
    const name = createDefaultShapeName(state.templates);

    state = addShape(state, name, [[0, 0], [10, 10]]);
    expect(state.templates[name]).toEqual([
      [0, 0],
      [10, 10]
    ]);

    state = renameShape(state, "TestShape");
    expect(state.templates.TestShape).toBeDefined();
    expect(state.templates[name]).toBeUndefined();

    state = updateSelectedShape(state, [[1.234, 9.876], [20, 30]]);
    expect(state.templates.TestShape[0]).toEqual([1.23, 9.88]);

    state = deleteSelectedShape(state);
    expect(state.templates.TestShape).toBeUndefined();
  });

  test("parses points JSON and rejects invalid shape payloads", () => {
    expect(parsePointsJson("[[1,2],[3,4]]")).toEqual([
      [1, 2],
      [3, 4]
    ]);
    expect(() => parsePointsJson("[[1,2]]")).toThrow(/at least/);
  });

  test("supports direct point editing on the selected shape", () => {
    let state = createSandboxState();
    state = appendSelectedPoint(state, [25.555, 75.444]);

    expect(state.templates[state.selectedName].at(-1)).toEqual([25.56, 75.44]);

    const editedIndex = state.templates[state.selectedName].length - 1;
    state = updateSelectedPoint(state, editedIndex, [10, 90]);
    expect(state.templates[state.selectedName][editedIndex]).toEqual([10, 90]);

    state = deleteSelectedPoint(state, editedIndex);
    expect(state.templates[state.selectedName].some(([x, y]) => x === 10 && y === 90)).toBe(false);
  });

  test("simplifies raw freehand strokes into compact template anchors", () => {
    const stroke = Array.from({ length: 80 }, (_, index) => ({
      x: index,
      y: index < 40 ? index : 80 - index
    }));
    const simplified = simplifyStrokeToTemplate(stroke, 4);

    expect(simplified.length).toBeLessThanOrEqual(4);
    simplified.forEach(([x, y]) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
    });
  });
});
