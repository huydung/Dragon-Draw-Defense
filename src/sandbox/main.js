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
  undoEdit: document.querySelector("#undo-edit"),
  redoEdit: document.querySelector("#redo-edit"),
  shapePoints: document.querySelector("#shape-points"),
  applyPoints: document.querySelector("#apply-points"),
  clearStroke: document.querySelector("#clear-stroke"),
  deletePoint: document.querySelector("#delete-point"),
  templateEditStatus: document.querySelector("#template-edit-status"),
  matchResult: document.querySelector("#match-result"),
  riskSummary: document.querySelector("#risk-summary"),
  riskGrid: document.querySelector("#risk-grid"),
  saveConfig: document.querySelector("#save-config"),
  saveStatus: document.querySelector("#save-status")
};

let state = createSandboxState();
let recognizer = createRecognizer();
let selectedPointIndex = null;
let isDraggingTemplatePoint = false;
let dragSnapshot = null;
const history = {
  past: [],
  future: []
};
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
      applyHistoryEdit(() => {
        state = addShape(state, name, GAME_CONFIG.GESTURES.TEMPLATES.Earth);
        selectedPointIndex = null;
      });
    });
  });

  elements.renameShape.addEventListener("click", () => {
    updateWithErrors(() => {
      applyHistoryEdit(() => {
        state = renameShape(state, elements.shapeName.value.trim());
      });
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
      applyHistoryEdit(() => {
        state = deleteSelectedPoint(state, selectedPointIndex);
        selectedPointIndex = Math.min(selectedPointIndex, state.templates[state.selectedName].length - 1);
        state = {
          ...state,
          status: "Deleted anchor point."
        };
      });
    });
  });

  elements.applyPoints.addEventListener("click", () => {
    updateWithErrors(() => {
      applyHistoryEdit(() => {
        state = updateSelectedShape(state, parsePointsJson(elements.shapePoints.value));
      });
    });
  });

  elements.deleteShape.addEventListener("click", () => {
    updateWithErrors(() => {
      applyHistoryEdit(() => {
        state = deleteSelectedShape(state);
        selectedPointIndex = null;
      });
    });
  });

  elements.undoEdit.addEventListener("click", () => {
    updateWithErrors(undoEdit);
  });

  elements.redoEdit.addEventListener("click", () => {
    updateWithErrors(redoEdit);
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
      applyHistoryEdit(() => {
        state = appendSelectedPoint(state, point);
        selectedPointIndex = state.templates[state.selectedName].length - 1;
        state = {
          ...state,
          status: "Added anchor point."
        };
      });
    } else {
      selectedPointIndex = hitIndex;
      state = {
        ...state,
        status: `Selected anchor ${hitIndex + 1}.`
      };
      dragSnapshot = createSnapshot();
    }
    isDraggingTemplatePoint = true;
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
  if (dragSnapshot && !snapshotsEqual(dragSnapshot, createSnapshot())) {
    history.past.push(dragSnapshot);
    history.future = [];
  }
  dragSnapshot = null;
  if (elements.templateCanvas.hasPointerCapture(event.pointerId)) {
    elements.templateCanvas.releasePointerCapture(event.pointerId);
  }
  render();
}

function applyHistoryEdit(action) {
  const before = createSnapshot();
  action();
  if (!snapshotsEqual(before, createSnapshot())) {
    history.past.push(before);
    history.future = [];
    recognizer = createRecognizer();
  }
}

function undoEdit() {
  const previous = history.past.pop();
  if (!previous) {
    state = {
      ...state,
      status: "Nothing to undo."
    };
    return;
  }

  history.future.push(createSnapshot());
  restoreSnapshot(previous);
  state = {
    ...state,
    status: "Undid template edit."
  };
}

function redoEdit() {
  const next = history.future.pop();
  if (!next) {
    state = {
      ...state,
      status: "Nothing to redo."
    };
    return;
  }

  history.past.push(createSnapshot());
  restoreSnapshot(next);
  state = {
    ...state,
    status: "Redid template edit."
  };
}

function createSnapshot() {
  return {
    templates: structuredClone(state.templates),
    selectedName: state.selectedName,
    selectedPointIndex
  };
}

function restoreSnapshot(snapshot) {
  state = {
    ...state,
    templates: structuredClone(snapshot.templates),
    selectedName: snapshot.selectedName
  };
  selectedPointIndex = snapshot.selectedPointIndex;
  recognizer = createRecognizer();
}

function snapshotsEqual(firstSnapshot, secondSnapshot) {
  return JSON.stringify(firstSnapshot) === JSON.stringify(secondSnapshot);
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
  renderRiskGrid();
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
  elements.undoEdit.disabled = history.past.length === 0;
  elements.redoEdit.disabled = history.future.length === 0;
  elements.applyPoints.disabled = !state.selectedName;
  elements.deletePoint.disabled =
    !state.selectedName || selectedPointIndex === null || state.templates[state.selectedName].length <= GAME_CONFIG.GESTURES.MIN_STROKE_POINTS;
  elements.templateEditStatus.textContent =
    selectedPointIndex === null
      ? `${state.selectedName ? state.templates[state.selectedName].length : 0}/${GAME_CONFIG.UI.TEMPLATE_MAX_POINTS} anchors. Click to add or drag.`
      : `Anchor ${selectedPointIndex + 1} selected. ${state.templates[state.selectedName].length}/${GAME_CONFIG.UI.TEMPLATE_MAX_POINTS} anchors.`;
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

function renderRiskGrid() {
  const riskRows = createRiskRows();
  const riskyRows = riskRows.filter((row) => row.kind !== "safe");
  const highestRisk = riskRows[0];

  elements.riskSummary.textContent = highestRisk
    ? `${highestRisk.source} vs ${highestRisk.target}: ${(highestRisk.score * 100).toFixed(1)}%`
    : "No comparable pairs";

  elements.riskGrid.replaceChildren(
    ...riskRows.map((row) => {
      const item = document.createElement("button");
      const pair = document.createElement("span");
      const score = document.createElement("strong");
      item.type = "button";
      item.className = "risk-row";
      item.dataset.kind = row.kind;
      item.dataset.selected = row.source === state.selectedName || row.target === state.selectedName ? "true" : "false";
      item.addEventListener("click", () => {
        state = {
          ...state,
          selectedName: row.source,
          status: `Selected ${row.source}. ${row.target} cross-scores at ${(row.score * 100).toFixed(1)}%.`
        };
        selectedPointIndex = null;
        render();
      });

      pair.textContent = `${row.source} -> ${row.target}`;
      score.textContent = `${(row.score * 100).toFixed(1)}%`;
      item.append(pair, score);
      return item;
    })
  );

  elements.riskGrid.dataset.empty = riskyRows.length === 0 ? "true" : "false";
}

function createRiskRows() {
  const names = Object.keys(state.templates);
  const rows = [];

  names.forEach((sourceName) => {
    names.forEach((targetName) => {
      if (sourceName === targetName) {
        return;
      }

      const result = recognizer.recognize(toPointObjects(state.templates[sourceName]), [targetName]);
      rows.push({
        source: sourceName,
        target: targetName,
        score: result.score,
        kind: getRiskKind(result.score)
      });
    });
  });

  return rows.sort((first, second) => second.score - first.score);
}

function getRiskKind(score) {
  if (score >= GAME_CONFIG.GESTURES.GESTURE_ACCEPTANCE_THRESHOLD) {
    return "danger";
  }

  if (score >= GAME_CONFIG.GESTURES.GESTURE_ACCEPTANCE_THRESHOLD - GAME_CONFIG.GESTURES.GESTURE_AMBIGUITY_MARGIN * 2) {
    return "warn";
  }

  return "safe";
}

function toPointObjects(points) {
  return points.map(([x, y]) => ({ x, y }));
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
