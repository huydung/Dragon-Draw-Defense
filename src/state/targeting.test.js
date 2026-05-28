import { describe, expect, test, vi } from "vitest";
import { GAME_CONFIG } from "../config.js";
import { applyGlyphStrike, createInitialState, findClosestMatchingShip } from "./targeting.js";

describe("Viking Raid Sentry targeting", () => {
  test("targeting chooses the closest active ship with a matching weakness", () => {
    const state = createInitialState();
    const target = findClosestMatchingShip(state.ships, "Fire");

    expect(target.id).toBe("ship-fire-close");
  });

  test("glyph strike removes only the closest matching ship and scores the hit", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const state = createInitialState();
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
});
