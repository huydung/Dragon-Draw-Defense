import { GAME_CONFIG } from "../config.js";
import { GestureInput } from "../input/gestureInput.js";
import { OneDollarRecognizer } from "../input/oneDollarRecognizer.js";
import {
  addShape,
  createDefaultShapeName,
  createRecognizerConfig,
  createSandboxState,
  deleteSelectedShape,
  parsePointsJson,
  renameShape,
  updateSelectedShape
} from "./sandboxState.js";
import { SandboxRenderer } from "./sandboxRenderer.js";
import "./styles.css";

const SAVE_TEMPLATES_ENDPOINT = "/__sandbox/save-templates";

const elements = {
  canvas: document.querySelector("#sandbox-canvas"),
  shapeList: document.querySelector("#shape-list"),
  addShape: document.querySelector("#add-shape"),
  deleteShape: document.querySelector("#delete-shape"),
  shapeName: document.querySelector("#shape-name"),
  renameShape: document.querySelector("#rename-shape"),
  captureShape: document.querySelector("#capture-shape"),
  shapePoints: document.querySelector("#shape-points"),
  applyPoints: document.querySelector("#apply-points"),
  clearStroke: document.querySelector("#clear-stroke"),
  matchResult: document.querySelector("#match-result"),
  saveConfig: document.querySelector("#save-config"),
  saveStatus: document.querySelector("#save-status")
};

let state = createSandboxState();
let recognizer = createRecognizer();
const renderer = new SandboxRenderer(elements.canvas);
const input = new GestureInput(elements.canvas, {
  onCommit(points) {
    state = {
      ...state,
      currentStroke: points
    };
    runMatch(points);
    render();
  }
});

applyTheme();
renderer.start();
input.start();
bindControls();
render();

function bindControls() {
  elements.shapeList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-shape-name]");
    if (!button) {
      return;
    }

    state = {
      ...state,
      selectedName: button.dataset.shapeName,
      status: `Selected ${button.dataset.shapeName}.`
    };
    render();
  });

  elements.addShape.addEventListener("click", () => {
    updateWithErrors(() => {
      const name = createDefaultShapeName(state.templates);
      const points = state.currentStroke.length > 0 ? pointsToPairs(state.currentStroke) : GAME_CONFIG.GESTURES.TEMPLATES.Earth;
      state = addShape(state, name, points);
      recognizer = createRecognizer();
    });
  });

  elements.renameShape.addEventListener("click", () => {
    updateWithErrors(() => {
      state = renameShape(state, elements.shapeName.value.trim());
      recognizer = createRecognizer();
    });
  });

  elements.captureShape.addEventListener("click", () => {
    updateWithErrors(() => {
      state = updateSelectedShape(state, pointsToPairs(state.currentStroke));
      recognizer = createRecognizer();
    });
  });

  elements.applyPoints.addEventListener("click", () => {
    updateWithErrors(() => {
      state = updateSelectedShape(state, parsePointsJson(elements.shapePoints.value));
      recognizer = createRecognizer();
    });
  });

  elements.deleteShape.addEventListener("click", () => {
    updateWithErrors(() => {
      state = deleteSelectedShape(state);
      recognizer = createRecognizer();
    });
  });

  elements.clearStroke.addEventListener("click", () => {
    state = {
      ...state,
      currentStroke: [],
      match: null,
      status: "Cleared test stroke."
    };
    render();
  });

  elements.saveConfig.addEventListener("click", async () => {
    updateStatus("Saving templates to src/config.js...");

    try {
      const response = await fetch(SAVE_TEMPLATES_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ templates: state.templates })
      });
      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error);
      }

      updateStatus("Saved to src/config.js. Reload to verify config-backed data.");
    } catch (error) {
      updateStatus(`Save failed: ${error.message}`);
    }
  });
}

function runMatch(points) {
  const result = recognizer.recognize(points);
  const percent = (result.score * 100).toFixed(1);
  const verb = result.accepted ? "Matched" : "Rejected";

  console.log(`[INPUT:RECOGNIZED] ${verb} '${result.name ?? "Unknown"}' with ${percent}% accuracy.`);
  state = {
    ...state,
    match: result,
    status: `${verb} ${result.name ?? "Unknown"} at ${percent}%.`
  };
}

function updateWithErrors(action) {
  try {
    action();
  } catch (error) {
    state = {
      ...state,
      status: error.message
    };
  }
  render();
}

function render() {
  renderShapeList();
  renderEditor();
  renderMatch();
  renderer.render(state.currentStroke, state.selectedName ? state.templates[state.selectedName] : []);
  elements.saveStatus.textContent = state.status;
}

function renderShapeList() {
  elements.shapeList.replaceChildren(
    ...Object.entries(state.templates).map(([name, points]) => {
      const button = document.createElement("button");
      const label = document.createElement("span");
      const count = document.createElement("small");
      button.type = "button";
      button.className = name === state.selectedName ? "shape-row selected" : "shape-row";
      button.dataset.shapeName = name;
      label.textContent = name;
      count.textContent = `${points.length} pts`;
      button.append(label, count);
      return button;
    })
  );
}

function renderEditor() {
  elements.shapeName.value = state.selectedName ?? "";
  elements.shapePoints.value = state.selectedName ? JSON.stringify(state.templates[state.selectedName], null, 2) : "";
  elements.deleteShape.disabled = !state.selectedName;
  elements.renameShape.disabled = !state.selectedName;
  elements.captureShape.disabled = !state.selectedName || state.currentStroke.length < GAME_CONFIG.GESTURES.MIN_STROKE_POINTS;
  elements.applyPoints.disabled = !state.selectedName;
}

function renderMatch() {
  if (!state.match) {
    elements.matchResult.textContent = "Draw on the canvas to test against the current shape library.";
    elements.matchResult.dataset.kind = "";
    return;
  }

  const percent = (state.match.score * 100).toFixed(1);
  elements.matchResult.textContent = state.match.accepted
    ? `Matched ${state.match.name} at ${percent}%`
    : `Rejected ${state.match.name ?? "Unknown"} at ${percent}%`;
  elements.matchResult.dataset.kind = state.match.accepted ? "match" : "fail";
}

function updateStatus(status) {
  state = {
    ...state,
    status
  };
  elements.saveStatus.textContent = status;
}

function createRecognizer() {
  return new OneDollarRecognizer(createRecognizerConfig(state.templates));
}

function pointsToPairs(points) {
  return points.map(({ x, y }) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
}

function applyTheme() {
  document.documentElement.style.setProperty("--page-background", GAME_CONFIG.RENDER.COLORS.PAGE_BACKGROUND);
  document.documentElement.style.setProperty("--panel-background", GAME_CONFIG.RENDER.COLORS.PANEL_BACKGROUND);
  document.documentElement.style.setProperty("--text-color", GAME_CONFIG.RENDER.COLORS.TEXT);
  document.documentElement.style.setProperty("--muted-text-color", GAME_CONFIG.RENDER.COLORS.MUTED_TEXT);
  document.documentElement.style.setProperty("--accent-color", GAME_CONFIG.GESTURES.TRAIL_COLOR);
  document.documentElement.style.setProperty("--failure-color", GAME_CONFIG.RENDER.COLORS.FAILURE);
  document.documentElement.style.setProperty("--font-family", GAME_CONFIG.UI.FONT_FAMILY);
  document.documentElement.style.setProperty("--hud-height", `${GAME_CONFIG.UI.HUD_HEIGHT_PX}px`);
  document.documentElement.style.setProperty("--hud-gap", `${GAME_CONFIG.UI.HUD_GAP_PX}px`);
  document.documentElement.style.setProperty("--panel-radius", `${GAME_CONFIG.UI.PANEL_RADIUS_PX}px`);
  document.documentElement.style.setProperty("--panel-border-width", `${GAME_CONFIG.UI.PANEL_BORDER_WIDTH_PX}px`);
  document.documentElement.style.setProperty("--button-radius", `${GAME_CONFIG.UI.BUTTON_RADIUS_PX}px`);
}
