import { describe, expect, test, vi } from "vitest";
import { calculateScore, calculateShipSpeed, handleShipBreach } from "./gameRules.js";

describe("Viking Raid Sentry core rules", () => {
  test("score calculation applies wave and precision multipliers correctly", () => {
    expect(calculateScore(1, false)).toBe(100);
    expect(calculateScore(3, true)).toBe(350);
  });

  test("speed math escalates predictably according to configured multipliers", () => {
    expect(calculateShipSpeed(1)).toBeCloseTo(40);
    expect(calculateShipSpeed(2)).toBeCloseTo(46);
    expect(calculateShipSpeed(3)).toBeCloseTo(55.2);
  });

  test("ships crossing the damage perimeter trigger hit point reduction", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    let mockState = { health: 3, gameOver: false };

    mockState = handleShipBreach(mockState);
    expect(mockState.health).toBe(2);
    expect(mockState.gameOver).toBe(false);

    mockState = handleShipBreach(mockState);
    mockState = handleShipBreach(mockState);
    expect(mockState.health).toBe(0);
    expect(mockState.gameOver).toBe(true);
    logSpy.mockRestore();
  });
});
