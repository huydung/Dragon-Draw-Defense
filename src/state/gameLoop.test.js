import { describe, expect, test, vi } from "vitest";
import { GAME_CONFIG } from "../config.js";
import { advanceGameState, createInitialGameState, getWaveShipCount, restartGame } from "./gameLoop.js";
import { createSeededRandom } from "./waveElements.js";

describe("Milestone 3 wave survival loop", () => {
  test("wave ship counts follow configured progression", () => {
    expect(getWaveShipCount(1)).toBe(5);
    expect(getWaveShipCount(2)).toBe(8);
    expect(getWaveShipCount(3)).toBe(12);
    expect(getWaveShipCount(5)).toBe(14);
  });

  test("starts with a transition banner phase before spawning", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const state = createInitialGameState(GAME_CONFIG, createSeededRandom(1), 1000);

    expect(state.phase).toBe("transition");
    expect(state.ships).toHaveLength(0);
    expect(state.transitionUntilMs).toBe(1000 + GAME_CONFIG.WAVES.WAVE_TRANSITION_DELAY_MS);
    logSpy.mockRestore();
  });

  test("activates a wave and spawns moving ships over time", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const rng = createSeededRandom(2);
    let state = createInitialGameState(GAME_CONFIG, rng, 0);

    state = advanceGameState(state, GAME_CONFIG.WAVES.WAVE_TRANSITION_DELAY_MS, rng);
    expect(state.phase).toBe("active");
    expect(state.ships).toHaveLength(1);
    expect(state.activeElements).toHaveLength(GAME_CONFIG.WAVES.WAVE_ELEMENT_COUNT);
    expect(state.ships[0].variantIndex).toBe(0);

    const startX = state.ships[0].x;
    state = advanceGameState(state, GAME_CONFIG.WAVES.WAVE_TRANSITION_DELAY_MS + 1000, rng);
    expect(state.ships[0].x).toBeLessThan(startX);
    logSpy.mockRestore();
  });

  test("breached ships decrement health and can trigger game over", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const state = {
      ...createInitialGameState(GAME_CONFIG, createSeededRandom(3), 0),
      phase: "active",
      health: 1,
      ships: [
        {
          id: "breach",
          x: GAME_CONFIG.PLAYFIELD.DAMAGE_PERIMETER_X,
          y: GAME_CONFIG.PLAYFIELD.SHIP_MIN_Y,
          weakness: "Fire",
          speed: GAME_CONFIG.WAVES.BASE_SHIP_SPEED,
          active: true
        }
      ],
      spawnedShipCount: 1,
      resolvedShipCount: 0,
      waveShipCount: 1
    };
    const nextState = advanceGameState(state, 100, createSeededRandom(4));

    expect(nextState.health).toBe(0);
    expect(nextState.gameOver).toBe(true);
    expect(nextState.resolvedShipCount).toBe(1);
    logSpy.mockRestore();
  });

  test("restart resets score, health, and wave one state", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const state = restartGame(5000, createSeededRandom(5));

    expect(state.wave).toBe(1);
    expect(state.score).toBe(0);
    expect(state.defeatedShipCount).toBe(0);
    expect(state.health).toBe(GAME_CONFIG.HEALTH.INITIAL_HEALTH);
    expect(state.gameOver).toBe(false);
    expect(state.phase).toBe("transition");
    logSpy.mockRestore();
  });
});
