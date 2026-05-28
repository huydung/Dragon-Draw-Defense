import { GAME_CONFIG } from "./config.js";
import { GestureInput } from "./input/gestureInput.js";
import { OneDollarRecognizer } from "./input/oneDollarRecognizer.js";
import { CanvasRenderer } from "./render/canvasRenderer.js";
import { applyGlyphStrike, createInitialState, pruneTransientState } from "./state/targeting.js";
import "./styles.css";

const canvas = document.querySelector("#game-canvas");
const sandboxPanel = document.querySelector("#sandbox-panel");
const sandboxToggle = document.querySelector("#sandbox-toggle");
const sandboxClose = document.querySelector("#sandbox-close");
const exportButton = document.querySelector("#export-shape");
const exportBox = document.querySelector("#export-box");

const renderer = new CanvasRenderer(canvas, {
  health: document.querySelector("#health"),
  wave: document.querySelector("#wave"),
  score: document.querySelector("#score"),
  feedback: document.querySelector("#feedback")
});
const recognizer = new OneDollarRecognizer();
let gameState = createInitialState();
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
document.documentElement.style.setProperty("--max-game-width", `${GAME_CONFIG.UI.MAX_GAME_WIDTH_PX}px`);
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
bindSandboxControls();
requestAnimationFrame(tick);

function tick(nowMs) {
  gameState = pruneTransientState(gameState, nowMs);
  renderer.render(gameState, input.getTrail(nowMs), nowMs);
  requestAnimationFrame(tick);
}

function bindSandboxControls() {
  sandboxToggle.addEventListener("click", () => {
    const expanded = sandboxToggle.getAttribute("aria-expanded") === "true";
    sandboxToggle.setAttribute("aria-expanded", String(!expanded));
    sandboxPanel.hidden = expanded;
  });

  sandboxClose.addEventListener("click", () => {
    sandboxToggle.setAttribute("aria-expanded", "false");
    sandboxPanel.hidden = true;
  });

  exportButton.addEventListener("click", async () => {
    const jsonOutput = JSON.stringify(input.getCurrentStroke());
    console.log("[SANDBOX:EXPORT] Template generated:", jsonOutput);
    exportBox.value = jsonOutput;

    if (navigator.clipboard && jsonOutput.length > 0) {
      try {
        await navigator.clipboard.writeText(jsonOutput);
      } catch (error) {
        console.info("[SANDBOX:EXPORT] Clipboard copy skipped:", error.message);
      }
    }
  });
}
