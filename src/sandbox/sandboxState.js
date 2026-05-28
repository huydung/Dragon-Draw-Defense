import { GAME_CONFIG } from "../config.js";

export function createSandboxState(config = GAME_CONFIG) {
  const templates = cloneTemplates(config.GESTURES.TEMPLATES);
  const names = Object.keys(templates);

  return {
    templates,
    selectedName: names[0] ?? null,
    currentStroke: [],
    match: null,
    status: "Loaded templates from config."
  };
}

export function cloneTemplates(templates) {
  return Object.fromEntries(
    Object.entries(templates).map(([name, points]) => [name, points.map(([x, y]) => [x, y])])
  );
}

export function createRecognizerConfig(templates, baseConfig = GAME_CONFIG) {
  return {
    ...baseConfig,
    GESTURES: {
      ...baseConfig.GESTURES,
      TEMPLATES: cloneTemplates(templates)
    }
  };
}

export function addShape(state, name, points) {
  assertShapeNameAvailable(state.templates, name);

  return {
    ...state,
    selectedName: name,
    templates: {
      ...state.templates,
      [name]: normalizePoints(points)
    },
    status: `Added ${name}.`
  };
}

export function renameShape(state, nextName) {
  const currentName = state.selectedName;

  if (!currentName) {
    throw new Error("Select a shape before renaming.");
  }

  if (currentName !== nextName) {
    assertShapeNameAvailable(state.templates, nextName);
  }

  const templates = {};
  Object.entries(state.templates).forEach(([name, points]) => {
    templates[name === currentName ? nextName : name] = points;
  });

  return {
    ...state,
    templates,
    selectedName: nextName,
    status: `Renamed ${currentName} to ${nextName}.`
  };
}

export function updateSelectedShape(state, points) {
  if (!state.selectedName) {
    throw new Error("Select a shape before updating points.");
  }

  return {
    ...state,
    templates: {
      ...state.templates,
      [state.selectedName]: normalizePoints(points)
    },
    status: `Updated ${state.selectedName}.`
  };
}

export function deleteSelectedShape(state) {
  if (!state.selectedName) {
    throw new Error("Select a shape before deleting.");
  }

  const templates = { ...state.templates };
  delete templates[state.selectedName];
  const selectedName = Object.keys(templates)[0] ?? null;

  return {
    ...state,
    templates,
    selectedName,
    status: "Deleted shape."
  };
}

export function parsePointsJson(value) {
  return normalizePoints(JSON.parse(value));
}

export function normalizePoints(points) {
  if (!Array.isArray(points) || points.length < GAME_CONFIG.GESTURES.MIN_STROKE_POINTS) {
    throw new Error("A shape needs at least two points.");
  }

  return points.map((point) => {
    if (!Array.isArray(point) || point.length !== 2) {
      throw new Error("Each point must be a two-number array.");
    }

    const [x, y] = point;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error("Point coordinates must be finite numbers.");
    }

    return [roundPoint(x), roundPoint(y)];
  });
}

export function createDefaultShapeName(templates) {
  let index = 1;
  let name = `Shape${index}`;

  while (templates[name]) {
    index += 1;
    name = `Shape${index}`;
  }

  return name;
}

function assertShapeNameAvailable(templates, name) {
  if (!/^[A-Z][A-Za-z0-9_]*$/.test(name)) {
    throw new Error("Shape names must start with a capital letter and use letters, numbers, or underscores.");
  }

  if (templates[name]) {
    throw new Error(`Shape '${name}' already exists.`);
  }
}

function roundPoint(value) {
  return Math.round(value * 100) / 100;
}
