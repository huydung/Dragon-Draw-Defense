import { describe, expect, test } from "vitest";
import { replaceGestureTemplatesInConfig, serializeTemplateBlock, validateTemplates } from "./configTemplateWriter.js";

describe("config template writer", () => {
  test("serializes template blocks with sandbox markers", () => {
    const block = serializeTemplateBlock({
      Wind: [
        [0, 0],
        [50.123, 90]
      ]
    });

    expect(block).toContain("SANDBOX_TEMPLATES_START");
    expect(block).toContain("Wind");
    expect(block).toContain("[50.12, 90]");
  });

  test("replaces the marked template block", () => {
    const source = `export const GAME_CONFIG = {\n  GESTURES: {\n    // SANDBOX_TEMPLATES_START\n    TEMPLATES: {\n      Old: [\n        [0, 0],\n        [1, 1]\n      ]\n    }\n    // SANDBOX_TEMPLATES_END\n  }\n};\n`;
    const nextSource = replaceGestureTemplatesInConfig(source, {
      NewShape: [
        [2, 2],
        [3, 3]
      ]
    });

    expect(nextSource).toContain("NewShape");
    expect(nextSource).not.toContain("Old");
  });

  test("validates template payloads", () => {
    expect(() => validateTemplates({ bad: [[0, 0], [1, 1]] })).toThrow(/Invalid/);
    expect(() => validateTemplates({ Good: [[0, 0]] })).toThrow(/at least/);
    expect(() => validateTemplates({ Good: [[0, 0], [1, 1]] })).not.toThrow();
  });
});
