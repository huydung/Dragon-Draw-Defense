import { describe, expect, test, vi } from "vitest";
import { GAME_CONFIG } from "../config.js";
import { createSeededRandom, createShipsForWave, selectWaveElements } from "./waveElements.js";

describe("wave element selection", () => {
  test("selects five unique elements from the full DML element set", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const selected = selectWaveElements(1, createSeededRandom(42));

    expect(selected).toHaveLength(GAME_CONFIG.WAVES.WAVE_ELEMENT_COUNT);
    expect(new Set(selected).size).toBe(GAME_CONFIG.WAVES.WAVE_ELEMENT_COUNT);
    selected.forEach((name) => expect(GAME_CONFIG.ELEMENTS[name]).toBeDefined());
    logSpy.mockRestore();
  });

  test("produces different pools across different seeds", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const results = new Set(
      Array.from({ length: 20 }, (_, i) => selectWaveElements(i + 1, createSeededRandom(i + 1)).join(","))
    );

    expect(results.size).toBeGreaterThan(1);
    logSpy.mockRestore();
  });

  test("generates placeholder ships using only the active wave element pool", () => {
    const activeElements = ["Fire", "Wind", "Earth", "Water", "Plant"];
    const ships = createShipsForWave(activeElements);

    expect(ships).toHaveLength(GAME_CONFIG.PLAYFIELD.STATIC_SHIP_SLOTS.length);
    ships.forEach((ship) => expect(activeElements).toContain(ship.weakness));
  });
});
