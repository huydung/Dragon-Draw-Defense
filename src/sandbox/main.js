import { GAME_CONFIG } from "../config.js";
import { GestureInput } from "../input/gestureInput.js";
import { OneDollarRecognizer } from "../input/oneDollarRecognizer.js";
import {
  addShape,
  appendSelectedPoint,
  createDefaultShapeName,
  createRecognizerConfig,
  createSandboxState,
  deleteSelectedPoint,
  deleteSelectedShape,
  parsePointsJson,
  renameShape,
  simplifyStrokeToTemplate,
  updateSelectedShape,
  updateSelectedPoint
} from "./sandboxState.js";
import { SandboxRenderer } from "./sandboxRenderer.js";
import "./styles.css";

const SAVE_TEMPLATES_ENDPOINT = "/__sandbox/save-templates";

const elements = {
  templateCanvas: document.querySelector("#template-canvas"),
  drawCanvas: document.querySelector("#draw-canvas"),
  shapeList: document.querySelector("#shape-list"),
  addShape: document.querySelector("#add-shape"),
  deleteShape: document.querySelector("#delete-shape"),
  shapeName: document.querySelector("#shape-name"),
  renameShape: document.querySelector("#rename-shape"),
  captureShape: document.querySelector("#capture-shape"),
  shapePoints: document.querySelector("#shape-points"),
  applyPoints: document.querySelector("#apply-points"),
  clearStroke: document.querySelector("#clear-stroke"),
  deletePoint: document.querySelector("#delete-point"),
  templateEditStatus: document.querySelector("#template-edit-status"),
  matchResult: document.querySelector("#match-result"),
  saveConfig: document.querySelector("#save-config"),
  saveStatus: document.querySelector("#save-status")
};

let state = createSandboxState();
let recognizer = createRecognizer();
let selectedPointIndex = null;
let isDraggingTemplatePoint = false;
const templateRenderer = new SandboxRenderer(elements.templateCanvas);
const drawRenderer = new SandboxRenderer(elements.drawCanvas);
const input = new GestureInput(elements.drawCanvas, {
  onChange(points) {
    state = {
      ...state,
      currentStroke: points
    };
    renderCanvases();
  },
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
templateRenderer.start();
drawRenderer.start();
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
    selectedPointIndex = null;
    render();
  });

  elements.addShape.addEventListener("click", () => {
    updateWithErrors(() => {
      const name = createDefaultShapeName(state.templates);
      const points =
        state.currentStroke.length > 0 ? simplifyStrokeToTemplate(state.currentStroke) : GAME_CONFIG.GESTURES.TEMPLATES.Earth;
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
      state = updateSelectedShape(state, simplifyStrokeToTemplate(state.currentStroke));
      recognizer = createRecognizer();
    });
  });

  elements.templateCanvas.addEventListener("pointerdown", handleTemplatePointerDown);
  elements.templateCanvas.addEventListener("pointermove", handleTemplatePointerMove);
  elements.templateCanvas.addEventListener("pointerup", handleTemplatePointerUp);
  elements.templateCanvas.addEventListener("pointercancel", handleTemplatePointerUp);

  elements.deletePoint.addEventListener("click", () => {
    updateWithErrors(() => {
      if (selectedPointIndex === null) {
        throw new Error("Select an anchor point before deleting it.");
      }
      state = deleteSelectedPoint(state, selectedPointIndex);
      selectedPointIndex = Math.min(selectedPointIndex, state.templates[state.selectedName].length - 1);
      recognizer = createRecognizer();
      state = {
        ...state,
        status: "Deleted anchor point."
      };
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

function handleTemplatePointerDown(event) {
  if (!state.selectedName) {
    return;
  }

  event.preventDefault();
  elements.templateCanvas.setPointerCapture(event.pointerId);
  const hitIndex = findNearestTemplatePoint(event.clientX, event.clientY);

  updateWithErrors(() => {
    if (hitIndex === null) {
      const point = templateRenderer.clientToTemplatePoint(event.clientX, event.clientY);
      state = appendSelectedPoint(state, point);
      selectedPointIndex = state.templates[state.selectedName].length - 1;
      state = {
        ...state,
        status: "Added anchor point."
      };
    } else {
      selectedPointIndex = hitIndex;
      state = {
        ...state,
        status: `Selected anchor ${hitIndex + 1}.`
      };
    }
    isDraggingTemplatePoint = true;
    recognizer = createRecognizer();
  });
}

function handleTemplatePointerMove(event) {
  if (!isDraggingTemplatePoint || selectedPointIndex === null || !state.selectedName) {
    return;
  }

  event.preventDefault();
  const point = templateRenderer.clientToTemplatePoint(event.clientX, event.clientY);
  updateWithErrors(() => {
    state = updateSelectedPoint(state, selectedPointIndex, point);
    recognizer = createRecognizer();
    state = {
      ...state,
      status: `Moved anchor ${selectedPointIndex + 1}.`
    };
  });
}

function handleTemplatePointerUp(event) {
  if (!isDraggingTemplatePoint) {
    return;
  }

  event.preventDefault();
  isDraggingTemplatePoint = false;
  if (elements.templateCanvas.hasPointerCapture(event.pointerId)) {
    elements.templateCanvas.releasePointerCapture(event.pointerId);
  }
}

function findNearestTemplatePoint(clientX, clientY) {
  const points = state.templates[state.selectedName] ?? [];
  const virtualPoint = templateRenderer.clientToVirtualPoint(clientX, clientY);
  const hitRadius = GAME_CONFIG.UI.TEMPLATE_POINT_HIT_RADIUS;
  let nearestIndex = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  points.forEach((point, index) => {
    const virtualTemplatePoint = templateRenderer.templatePointToVirtual(point);
    const distance = Math.hypot(virtualTemplatePoint.x - virtualPoint.x, virtualTemplatePoint.y - virtualPoint.y);
    if (distance <= hitRadius && distance < nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  });

  return nearestIndex;
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
  renderCanvases();
  elements.saveStatus.textContent = state.status;
}

function renderCanvases() {
  templateRenderer.renderTemplate(state.selectedName ? state.templates[state.selectedName] : [], selectedPointIndex);
  drawRenderer.renderStroke(state.currentStroke);
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
  elements.deletePoint.disabled =
    !state.selectedName || selectedPointIndex === null || state.templates[state.selectedName].length <= GAME_CONFIG.GESTURES.MIN_STROKE_POINTS;
  elements.templateEditStatus.textContent =
    selectedPointIndex === null ? "Click to add or drag anchors." : `Anchor ${selectedPointIndex + 1} selected.`;
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
