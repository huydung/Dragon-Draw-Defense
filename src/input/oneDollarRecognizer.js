import { GAME_CONFIG } from "../config.js";

// Adapted from the public $1 Unistroke Recognizer reference implementation
// by Jacob O. Wobbrock, Andrew D. Wilson, and Yang Li.
export class OneDollarRecognizer {
  constructor(config = GAME_CONFIG) {
    this.config = config;
    this.templates = Object.entries(config.GESTURES.TEMPLATES)
      .map(([name, points]) => ({
        name,
        points: normalizePath(toPointObjects(points), config)
      }))
      .filter((template) => template.points.length === config.GESTURES.GESTURE_RESAMPLE_POINTS);
  }

  recognize(rawPoints, candidateNames = null) {
    const rawPointObjects = toPointObjects(rawPoints);
    if (rawPointObjects.length < this.config.GESTURES.MIN_STROKE_POINTS) {
      return { name: null, score: 0, accepted: false, ambiguous: false, candidates: [] };
    }

    const candidate = normalizePath(rawPointObjects, this.config);
    if (candidate.length !== this.config.GESTURES.GESTURE_RESAMPLE_POINTS) {
      return { name: null, score: 0, accepted: false, ambiguous: false, candidates: [] };
    }

    const allowedNames = candidateNames ? new Set(candidateNames) : null;
    const scoredCandidates = [];

    for (const template of this.templates) {
      if (allowedNames && !allowedNames.has(template.name)) {
        continue;
      }

      const distance = this.config.GESTURES.DOLLAR_ROTATION_INVARIANT
        ? distanceAtBestAngle(
            candidate,
            template.points,
            -this.config.GESTURES.DOLLAR_ANGLE_RANGE_RADIANS,
            this.config.GESTURES.DOLLAR_ANGLE_RANGE_RADIANS,
            this.config.GESTURES.DOLLAR_ANGLE_PRECISION_RADIANS,
            this.config
          )
        : pathDistance(candidate, template.points);
      const score = scoreDistance(distance, this.config);

      scoredCandidates.push({
        name: template.name,
        score,
        distance
      });
    }

    scoredCandidates.sort((first, second) => first.distance - second.distance);
    const bestCandidate = scoredCandidates[0] ?? null;
    const secondCandidate = scoredCandidates[1] ?? null;
    const score = bestCandidate?.score ?? 0;
    const margin = secondCandidate ? score - secondCandidate.score : Number.POSITIVE_INFINITY;
    const ambiguous = margin < this.config.GESTURES.GESTURE_AMBIGUITY_MARGIN;
    const accepted = Boolean(bestCandidate) && score >= this.config.GESTURES.GESTURE_ACCEPTANCE_THRESHOLD && !ambiguous;

    return {
      name: bestCandidate?.name ?? null,
      score,
      accepted,
      ambiguous,
      margin,
      candidates: scoredCandidates
    };
  }
}

function toPointObjects(points) {
  const pointList = unwrapPointList(points);
  return pointList
    .map((point) => {
      if (Array.isArray(point)) {
        return { x: Number(point[0]), y: Number(point[1]) };
      }

      return { x: Number(point.x), y: Number(point.y) };
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function unwrapPointList(points) {
  if (Array.isArray(points) && points.length === 1 && Array.isArray(points[0]) && Array.isArray(points[0][0])) {
    return points[0];
  }

  return Array.isArray(points) ? points : [];
}

function normalizePath(points, config) {
  const resampled = resample(points, config.GESTURES.GESTURE_RESAMPLE_POINTS);
  const radians = config.GESTURES.DOLLAR_ROTATION_INVARIANT ? indicativeAngle(resampled) : 0;
  const rotated = config.GESTURES.DOLLAR_ROTATION_INVARIANT ? rotateBy(resampled, -radians) : resampled;
  const scaled = scaleToSquare(rotated, config.GESTURES.DOLLAR_SQUARE_SIZE);
  return translateToOrigin(scaled, config.GESTURES.DOLLAR_ORIGIN);
}

function resample(points, targetCount) {
  if (points.length === 0 || targetCount <= 0) {
    return [];
  }

  if (targetCount === 1) {
    return [points[0]];
  }

  const length = pathLength(points);
  if (length <= Number.EPSILON) {
    return Array.from({ length: targetCount }, () => ({ ...points[0] }));
  }

  const interval = length / (targetCount - 1);
  const resampled = [points[0]];
  let accumulatedDistance = 0;
  const workingPoints = points.map((point) => ({ ...point }));

  for (let index = 1; index < workingPoints.length; index += 1) {
    const currentDistance = distance(workingPoints[index - 1], workingPoints[index]);
    if (currentDistance <= Number.EPSILON) {
      continue;
    }

    if (accumulatedDistance + currentDistance >= interval) {
      const ratio = (interval - accumulatedDistance) / currentDistance;
      const point = {
        x: workingPoints[index - 1].x + ratio * (workingPoints[index].x - workingPoints[index - 1].x),
        y: workingPoints[index - 1].y + ratio * (workingPoints[index].y - workingPoints[index - 1].y)
      };
      resampled.push(point);
      workingPoints.splice(index, 0, point);
      accumulatedDistance = 0;
    } else {
      accumulatedDistance += currentDistance;
    }
  }

  while (resampled.length < targetCount) {
    resampled.push(workingPoints[workingPoints.length - 1]);
  }

  return resampled.slice(0, targetCount);
}

function indicativeAngle(points) {
  const center = centroid(points);
  return Math.atan2(center.y - points[0].y, center.x - points[0].x);
}

function rotateBy(points, radians) {
  const center = centroid(points);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return points.map((point) => ({
    x: (point.x - center.x) * cos - (point.y - center.y) * sin + center.x,
    y: (point.x - center.x) * sin + (point.y - center.y) * cos + center.y
  }));
}

function scaleToSquare(points, size) {
  const box = boundingBox(points);
  return points.map((point) => ({
    x: point.x * (size / box.width),
    y: point.y * (size / box.height)
  }));
}

function translateToOrigin(points, origin) {
  const center = centroid(points);
  return points.map((point) => ({
    x: point.x + origin.x - center.x,
    y: point.y + origin.y - center.y
  }));
}

function distanceAtBestAngle(points, template, minAngle, maxAngle, threshold, config) {
  let x1 = config.GESTURES.DOLLAR_GOLDEN_RATIO_HALF * minAngle + (1 - config.GESTURES.DOLLAR_GOLDEN_RATIO_HALF) * maxAngle;
  let f1 = distanceAtAngle(points, template, x1);
  let x2 = (1 - config.GESTURES.DOLLAR_GOLDEN_RATIO_HALF) * minAngle + config.GESTURES.DOLLAR_GOLDEN_RATIO_HALF * maxAngle;
  let f2 = distanceAtAngle(points, template, x2);

  while (Math.abs(maxAngle - minAngle) > threshold) {
    if (f1 < f2) {
      maxAngle = x2;
      x2 = x1;
      f2 = f1;
      x1 = config.GESTURES.DOLLAR_GOLDEN_RATIO_HALF * minAngle + (1 - config.GESTURES.DOLLAR_GOLDEN_RATIO_HALF) * maxAngle;
      f1 = distanceAtAngle(points, template, x1);
    } else {
      minAngle = x1;
      x1 = x2;
      f1 = f2;
      x2 = (1 - config.GESTURES.DOLLAR_GOLDEN_RATIO_HALF) * minAngle + config.GESTURES.DOLLAR_GOLDEN_RATIO_HALF * maxAngle;
      f2 = distanceAtAngle(points, template, x2);
    }
  }

  return Math.min(f1, f2);
}

function distanceAtAngle(points, template, radians) {
  return pathDistance(rotateBy(points, radians), template);
}

function scoreDistance(distance, config) {
  const halfDiagonal =
    0.5 * Math.sqrt(config.GESTURES.DOLLAR_SQUARE_SIZE ** 2 + config.GESTURES.DOLLAR_SQUARE_SIZE ** 2);
  return Math.max(0, 1 - distance / halfDiagonal);
}

function pathDistance(points, template) {
  const count = Math.min(points.length, template.length);
  if (count === 0) {
    return Number.POSITIVE_INFINITY;
  }

  let total = 0;
  for (let index = 0; index < count; index += 1) {
    total += distance(points[index], template[index]);
  }

  return total / count;
}

function pathLength(points) {
  return points.slice(1).reduce((sum, point, index) => sum + distance(points[index], point), 0);
}

function centroid(points) {
  const totals = points.reduce(
    (sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y
    }),
    { x: 0, y: 0 }
  );

  return {
    x: totals.x / points.length,
    y: totals.y / points.length
  };
}

function boundingBox(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    width: Math.max(Number.EPSILON, maxX - minX),
    height: Math.max(Number.EPSILON, maxY - minY)
  };
}

function distance(firstPoint, secondPoint) {
  return Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y);
}
