import { describe, expect, test } from "vitest";
import {
  addShape,
  createDefaultShapeName,
  createRecognizerConfig,
  createSandboxState,
  deleteSelectedShape,
  parsePointsJson,
  renameShape,
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

    state = renameShape(state, "Water");
    expect(state.templates.Water).toBeDefined();
    expect(state.templates[name]).toBeUndefined();

    state = updateSelectedShape(state, [[1.234, 9.876], [20, 30]]);
    expect(state.templates.Water[0]).toEqual([1.23, 9.88]);

    state = deleteSelectedShape(state);
    expect(state.templates.Water).toBeUndefined();
  });

  test("parses points JSON and rejects invalid shape payloads", () => {
    expect(parsePointsJson("[[1,2],[3,4]]")).toEqual([
      [1, 2],
      [3, 4]
    ]);
    expect(() => parsePointsJson("[[1,2]]")).toThrow(/at least/);
  });
});
