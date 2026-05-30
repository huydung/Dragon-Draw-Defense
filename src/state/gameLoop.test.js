import { describe, expect, test, vi } from "vitest";
import { GAME_CONFIG } from "../config.js";
import { advanceGameState, createInitialGameState, getWaveShipCount, getWaveSpawnInterval, restartGame } from "./gameLoop.js";
import { createSeededRandom } from "./waveElements.js";

describe("Milestone 3 wave survival loop", () => {
  test("wave ship counts follow configured progression", () => {
    expect(getWaveShipCount(1)).toBe(GAME_CONFIG.WAVES.BASE_SHIP_COUNT);
    expect(getWaveShipCount(2)).toBe(GAME_CONFIG.WAVES.BASE_SHIP_COUNT + GAME_CONFIG.WAVES.SHIP_COUNT_INCREMENT);
    expect(getWaveShipCount(3)).toBe(GAME_CONFIG.WAVES.BASE_SHIP_COUNT + 2 * GAME_CONFIG.WAVES.SHIP_COUNT_INCREMENT);
    expect(getWaveShipCount(5)).toBe(
      GAME_CONFIG.WAVES.BASE_SHIP_COUNT + (5 - 1) * GAME_CONFIG.WAVES.SHIP_COUNT_INCREMENT
    );
  });

  test("spawn intervals tighten with wave number until the configured floors", () => {
    const waveOne = getWaveSpawnInterval(1);
    const waveFive = getWaveSpawnInterval(5);
    const lateWave = getWaveSpawnInterval(30);

    expect(waveFive.min).toBeLessThan(waveOne.min);
    expect(waveFive.max).toBeLessThan(waveOne.max);
    expect(lateWave.min).toBe(GAME_CONFIG.WAVES.MIN_SPAWN_INTERVAL_FLOOR_MS);
    expect(lateWave.max).toBe(GAME_CONFIG.WAVES.MAX_SPAWN_INTERVAL_FLOOR_MS);
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
    expect(nextState.islandHitCount).toBe(1);
    expect(nextState.islandFires).toHaveLength(2);
    expect(nextState.dockedShips).toHaveLength(1);
    expect(nextState.dockedShips[0]).toMatchObject({
      weakness: "Fire",
      active: false,
      docked: true
    });
    expect(nextState.gameOverDialogAtMs).toBe(100 + GAME_CONFIG.RENDER.GAME_OVER_REVEAL_DELAY_MS);
    expect(nextState.resolvedShipCount).toBe(1);
    logSpy.mockRestore();
  });

  test("remaining active ships freeze in place when the island is defeated", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const state = {
      ...createInitialGameState(GAME_CONFIG, createSeededRandom(7), 0),
      phase: "active",
      health: 1,
      ships: [
        {
          id: "first-breach",
          x: GAME_CONFIG.PLAYFIELD.DAMAGE_PERIMETER_X,
          y: GAME_CONFIG.PLAYFIELD.SHIP_MIN_Y,
          weakness: "Fire",
          speed: GAME_CONFIG.WAVES.BASE_SHIP_SPEED,
          active: true
        },
        {
          id: "extra-breach",
          x: GAME_CONFIG.PLAYFIELD.DAMAGE_PERIMETER_X,
          y: GAME_CONFIG.PLAYFIELD.SHIP_MIN_Y,
          weakness: "Water",
          speed: GAME_CONFIG.WAVES.BASE_SHIP_SPEED,
          active: true
        }
      ],
      spawnedShipCount: 2,
      resolvedShipCount: 0,
      waveShipCount: 2
    };
    const nextState = advanceGameState(state, 100, createSeededRandom(8));

    expect(nextState.health).toBe(0);
    expect(nextState.gameOver).toBe(true);
    // first-breach causes the defeat and docks on the island
    expect(nextState.islandHitCount).toBe(1);
    expect(nextState.islandFires).toHaveLength(2);
    expect(nextState.dockedShips).toHaveLength(1);
    expect(nextState.dockedShips[0].id).toBe("first-breach-docked");
    expect(nextState.gameOverDialogAtMs).toBe(100 + GAME_CONFIG.RENDER.GAME_OVER_REVEAL_DELAY_MS);
    expect(nextState.resolvedShipCount).toBe(1);
    // extra-breach is frozen in place, not docked
    const extraShip = nextState.ships.find((s) => s.id === "extra-breach");
    expect(extraShip.active).toBe(false);
    expect(extraShip.frozen).toBe(true);
    logSpy.mockRestore();
  });

  test("restart resets score, health, and wave one state", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const state = restartGame(5000, createSeededRandom(5));

    expect(state.wave).toBe(1);
    expect(state.score).toBe(0);
    expect(state.defeatedShipCount).toBe(0);
    expect(state.dockedShips).toHaveLength(0);
    expect(state.health).toBe(GAME_CONFIG.HEALTH.INITIAL_HEALTH);
    expect(state.gameOver).toBe(false);
    expect(state.phase).toBe("transition");
    logSpy.mockRestore();
  });

  test("waits on a cleared phase before showing the next roster selection", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const rng = createSeededRandom(6);
    const clearedState = {
      ...createInitialGameState(GAME_CONFIG, rng, 0),
      phase: "active",
      wave: 1,
      ships: [{ id: "cleared", x: 300, y: 100, weakness: "Fire", active: false }],
      spawnedShipCount: 1,
      resolvedShipCount: 1,
      waveShipCount: 1,
      lastUpdateMs: 0
    };

    const vfxState = advanceGameState(clearedState, 100, rng);
    expect(vfxState.phase).toBe("cleared");
    expect(vfxState.wave).toBe(1);
    expect(vfxState.waveClearedUntilMs).toBe(100 + GAME_CONFIG.WAVES.WAVE_CLEAR_VFX_DELAY_MS);

    const nextWave = advanceGameState(vfxState, vfxState.waveClearedUntilMs, rng);
    expect(nextWave.phase).toBe("transition");
    expect(nextWave.wave).toBe(2);
    logSpy.mockRestore();
  });
});
