import { describe, expect, test, vi } from "vitest";
import { GAME_CONFIG } from "../config.js";
import { applyGlyphStrike, createInitialState, findClosestMatchingShip } from "./targeting.js";

describe("Viking Raid Sentry targeting", () => {
  test("targeting chooses the closest active ship with a matching weakness", () => {
    const state = {
      ships: [
        { id: "ship-fire-far", x: 600, weakness: "Fire", active: true },
        { id: "ship-fire-close", x: 300, weakness: "Fire", active: true },
        { id: "ship-wind", x: 250, weakness: "Wind", active: true }
      ]
    };
    const target = findClosestMatchingShip(state.ships, "Fire");

    expect(target.id).toBe("ship-fire-close");
  });

  test("glyph strike removes only the closest matching ship and scores the hit", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const state = {
      ...createInitialState(),
      wave: 1,
      ships: [
        { id: "ship-fire-far", x: 600, y: 100, weakness: "Fire", active: true },
        { id: "ship-fire-close", x: 300, y: 100, weakness: "Fire", active: true }
      ]
    };
    const nextState = applyGlyphStrike(
      state,
      { name: "Fire", score: GAME_CONFIG.GESTURES.GESTURE_PRECISION_THRESHOLD },
      1000
    );

    expect(nextState.score).toBe(150);
    expect(nextState.ships.find((ship) => ship.id === "ship-fire-close").active).toBe(false);
    expect(nextState.ships.find((ship) => ship.id === "ship-fire-far").active).toBe(true);
    expect(nextState.lasers).toHaveLength(1);
    logSpy.mockRestore();
  });

  test("glyph strike laser starts from the current active dragon slot", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const state = {
      ...createInitialState(),
      activeElements: ["Water", "Fire", "Plant", "Metal", "Void"],
      ships: [{ id: "ship-fire", x: 300, y: 100, weakness: "Fire", active: true }]
    };
    const nextState = applyGlyphStrike(
      state,
      { name: "Fire", score: GAME_CONFIG.GESTURES.GESTURE_PRECISION_THRESHOLD },
      1000
    );

    expect(nextState.lasers[0].from).toEqual(GAME_CONFIG.PLAYFIELD.ACTIVE_DRAGON_POSITIONS[1]);
    logSpy.mockRestore();
  });
});
