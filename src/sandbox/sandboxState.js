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

export function updateSelectedPoint(state, pointIndex, point) {
  if (!state.selectedName) {
    throw new Error("Select a shape before editing points.");
  }

  const points = state.templates[state.selectedName].map((existingPoint, index) =>
    index === pointIndex ? normalizePoint(point) : existingPoint
  );

  return updateSelectedShape(state, points);
}

export function appendSelectedPoint(state, point) {
  if (!state.selectedName) {
    throw new Error("Select a shape before adding points.");
  }

  return updateSelectedShape(state, [...state.templates[state.selectedName], normalizePoint(point)]);
}

export function deleteSelectedPoint(state, pointIndex) {
  if (!state.selectedName) {
    throw new Error("Select a shape before deleting points.");
  }

  const points = state.templates[state.selectedName].filter((_, index) => index !== pointIndex);
  return updateSelectedShape(state, points);
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

export function simplifyStrokeToTemplate(points, maxPoints = GAME_CONFIG.UI.FREEHAND_TEMPLATE_MAX_POINTS) {
  if (!Array.isArray(points) || points.length < GAME_CONFIG.GESTURES.MIN_STROKE_POINTS) {
    throw new Error("Draw a stroke before capturing it.");
  }

  const normalized = normalizeStrokeToTemplateSquare(points);
  let tolerance = 0;
  let simplified = normalized;

  while (simplified.length > maxPoints && tolerance <= 50) {
    tolerance += 1;
    simplified = simplifyRdp(normalized, tolerance);
  }

  if (simplified.length > maxPoints) {
    simplified = pickEvenlySpaced(simplified, maxPoints);
  }

  return normalizePoints(simplified);
}

export function normalizePoints(points) {
  if (!Array.isArray(points) || points.length < GAME_CONFIG.GESTURES.MIN_STROKE_POINTS) {
    throw new Error("A shape needs at least two points.");
  }

  return points.map(normalizePoint);
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

function normalizePoint(point) {
  if (!Array.isArray(point) || point.length !== 2) {
    throw new Error("Each point must be a two-number array.");
  }

  const [x, y] = point;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error("Point coordinates must be finite numbers.");
  }

  return [roundPoint(x), roundPoint(y)];
}

function normalizeStrokeToTemplateSquare(points) {
  const path = points.map((point) => (Array.isArray(point) ? { x: point[0], y: point[1] } : point));
  const xs = path.map((point) => point.x);
  const ys = path.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const size = Math.max(Number.EPSILON, maxX - minX, maxY - minY);
  const offsetX = (100 - ((maxX - minX) / size) * 100) / 2;
  const offsetY = (100 - ((maxY - minY) / size) * 100) / 2;

  return path.map((point) => [
    offsetX + ((point.x - minX) / size) * 100,
    offsetY + ((point.y - minY) / size) * 100
  ]);
}

function simplifyRdp(points, tolerance) {
  if (points.length <= 2) {
    return points;
  }

  let maxDistance = 0;
  let splitIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = perpendicularDistance(points[index], first, last);
    if (distance > maxDistance) {
      maxDistance = distance;
      splitIndex = index;
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyRdp(points.slice(0, splitIndex + 1), tolerance);
    const right = simplifyRdp(points.slice(splitIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const denominator = Math.hypot(x2 - x1, y2 - y1);

  if (denominator === 0) {
    return Math.hypot(x - x1, y - y1);
  }

  return Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / denominator;
}

function pickEvenlySpaced(points, maxPoints) {
  if (points.length <= maxPoints) {
    return points;
  }

  return Array.from({ length: maxPoints }, (_, index) => {
    const sourceIndex = Math.round((index / (maxPoints - 1)) * (points.length - 1));
    return points[sourceIndex];
  });
}
