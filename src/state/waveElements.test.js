import { describe, expect, test, vi } from "vitest";
import { GAME_CONFIG } from "../config.js";
import { createElementConflictMap, createSeededRandom, createShipsForWave, hasElementConflict, selectWaveElements } from "./waveElements.js";

describe("wave element selection", () => {
  test("selects five unique elements from the full DML element set", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const selected = selectWaveElements(1, createSeededRandom(42));

    expect(selected).toHaveLength(GAME_CONFIG.WAVES.WAVE_ELEMENT_COUNT);
    expect(new Set(selected).size).toBe(GAME_CONFIG.WAVES.WAVE_ELEMENT_COUNT);
    selected.forEach((name) => expect(GAME_CONFIG.ELEMENTS[name]).toBeDefined());
    expect(hasElementConflict(selected, createElementConflictMap())).toBe(false);
    logSpy.mockRestore();
  });

  test("avoids configured high-confusion pairs across seeded wave pools", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const conflicts = createElementConflictMap();

    for (let seed = 1; seed <= 50; seed += 1) {
      const selected = selectWaveElements(seed, createSeededRandom(seed));
      expect(hasElementConflict(selected, conflicts)).toBe(false);
    }

    logSpy.mockRestore();
  });

  test("keeps high-confusion glyphs out of the same active pool", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const config = {
      ...GAME_CONFIG,
      WAVES: {
        ...GAME_CONFIG.WAVES,
        WAVE_ELEMENT_COUNT: 3
      },
      ELEMENTS: {
        First: { label: "1", color: "#fff" },
        Second: { label: "2", color: "#fff" },
        Third: { label: "3", color: "#fff" },
        Fourth: { label: "4", color: "#fff" }
      },
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
          ],
          Third: [
            [10, 90],
            [90, 10]
          ],
          Fourth: [
            [10, 50],
            [90, 50]
          ]
        }
      }
    };

    const selected = selectWaveElements(1, () => 0, config);

    expect(selected).toHaveLength(3);
    expect(selected).not.toEqual(expect.arrayContaining(["First", "Second"]));
    expect(hasElementConflict(selected, createElementConflictMap(config))).toBe(false);
    logSpy.mockRestore();
  });

  test("generates placeholder ships using only the active wave element pool", () => {
    const activeElements = ["Fire", "Wind", "Earth", "Water", "Plant"];
    const ships = createShipsForWave(activeElements);

    expect(ships).toHaveLength(GAME_CONFIG.PLAYFIELD.STATIC_SHIP_SLOTS.length);
    ships.forEach((ship) => expect(activeElements).toContain(ship.weakness));
  });
});
