import { GAME_CONFIG } from "./config.js";
import { GestureInput } from "./input/gestureInput.js";
import { OneDollarRecognizer } from "./input/oneDollarRecognizer.js";
import { CanvasRenderer } from "./render/canvasRenderer.js";
import { advanceGameState, createInitialGameState, restartGame } from "./state/gameLoop.js";
import { applyGlyphStrike, pruneTransientState } from "./state/targeting.js";
import "./styles.css";

const canvas = document.querySelector("#game-canvas");
const restartButton = document.querySelector("#restart-game");

const renderer = new CanvasRenderer(canvas, {
  health: document.querySelector("#health"),
  wave: document.querySelector("#wave"),
  score: document.querySelector("#score"),
  feedback: document.querySelector("#feedback"),
  waveBanner: document.querySelector("#wave-banner"),
  gameOver: document.querySelector("#game-over"),
  finalScore: document.querySelector("#final-score")
});
const recognizer = new OneDollarRecognizer();
let gameState = createInitialGameState(GAME_CONFIG, Math.random, performance.now());
window.__VIKING_RAID_SENTRY__ = {
  config: GAME_CONFIG,
  getState: () => structuredClone(gameState)
};

document.documentElement.style.setProperty("--page-background", GAME_CONFIG.RENDER.COLORS.PAGE_BACKGROUND);
document.documentElement.style.setProperty("--panel-background", GAME_CONFIG.RENDER.COLORS.PANEL_BACKGROUND);
document.documentElement.style.setProperty("--text-color", GAME_CONFIG.RENDER.COLORS.TEXT);
document.documentElement.style.setProperty("--muted-text-color", GAME_CONFIG.RENDER.COLORS.MUTED_TEXT);
document.documentElement.style.setProperty("--accent-color", GAME_CONFIG.GESTURES.TRAIL_COLOR);
document.documentElement.style.setProperty("--failure-color", GAME_CONFIG.RENDER.COLORS.FAILURE);
document.documentElement.style.setProperty("--font-family", GAME_CONFIG.UI.FONT_FAMILY);
document.documentElement.style.setProperty("--world-width", `${GAME_CONFIG.PLAYFIELD.VIRTUAL_WIDTH}`);
document.documentElement.style.setProperty("--world-height", `${GAME_CONFIG.PLAYFIELD.VIRTUAL_HEIGHT}`);
document.documentElement.style.setProperty("--stage-aspect-ratio", `${GAME_CONFIG.UI.STAGE_ASPECT_RATIO}`);
document.documentElement.style.setProperty("--shell-padding", `${GAME_CONFIG.UI.SHELL_PADDING_PX}px`);
document.documentElement.style.setProperty("--hud-height", `${GAME_CONFIG.UI.HUD_HEIGHT_PX}px`);
document.documentElement.style.setProperty("--hud-gap", `${GAME_CONFIG.UI.HUD_GAP_PX}px`);
document.documentElement.style.setProperty("--panel-radius", `${GAME_CONFIG.UI.PANEL_RADIUS_PX}px`);
document.documentElement.style.setProperty("--panel-border-width", `${GAME_CONFIG.UI.PANEL_BORDER_WIDTH_PX}px`);
document.documentElement.style.setProperty("--button-radius", `${GAME_CONFIG.UI.BUTTON_RADIUS_PX}px`);
document.documentElement.style.setProperty("--sandbox-width", `${GAME_CONFIG.UI.SANDBOX_WIDTH_PX}px`);
document.documentElement.style.setProperty("--sandbox-textarea-height", `${GAME_CONFIG.UI.SANDBOX_TEXTAREA_HEIGHT_PX}px`);
document.documentElement.style.setProperty("--sandbox-offset", `${GAME_CONFIG.UI.SANDBOX_OFFSET_PX}px`);

const input = new GestureInput(canvas, {
  onCommit(points) {
    if (gameState.gameOver) {
      return;
    }

    const result = recognizer.recognize(points);
    const percent = (result.score * 100).toFixed(1);

    if (!result.accepted) {
      console.log(`[INPUT:RECOGNIZED] Rejected '${result.name ?? "Unknown"}' with ${percent}% accuracy.`);
      gameState = {
        ...gameState,
        feedback: {
          kind: "fail",
          text: `Gesture rejected ${percent}%`,
          untilMs: performance.now() + GAME_CONFIG.RENDER.FEEDBACK_DURATION_MS
        }
      };
      return;
    }

    console.log(`[INPUT:RECOGNIZED] Matched '${result.name}' with ${percent}% accuracy.`);
    gameState = applyGlyphStrike(gameState, result, performance.now());
  }
});

renderer.start();
input.start();
restartButton.addEventListener("click", () => {
  gameState = restartGame(performance.now());
});
requestAnimationFrame(tick);

function tick(nowMs) {
  gameState = advanceGameState(gameState, nowMs);
  gameState = pruneTransientState(gameState, nowMs);
  renderer.render(gameState, input.getTrail(nowMs), nowMs);
  requestAnimationFrame(tick);
}
