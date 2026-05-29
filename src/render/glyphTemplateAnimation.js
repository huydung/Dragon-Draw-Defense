export function getTemplateBounds(points) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

export function scaleTemplatePoint(point, bounds, rect) {
  const width = Math.max(bounds.maxX - bounds.minX, Number.EPSILON);
  const height = Math.max(bounds.maxY - bounds.minY, Number.EPSILON);
  const scale = Math.min(rect.width / width, rect.height / height);
  const drawnWidth = width * scale;
  const drawnHeight = height * scale;
  const offsetX = rect.x + (rect.width - drawnWidth) / 2;
  const offsetY = rect.y + (rect.height - drawnHeight) / 2;

  return {
    x: offsetX + (point[0] - bounds.minX) * scale,
    y: offsetY + (point[1] - bounds.minY) * scale
  };
}

export function createAnimatedTemplatePath(points, progress) {
  if (points.length < 2) {
    return {
      completedSegments: [],
      partialSegment: null,
      revealedPointCount: points.length
    };
  }

  const boundedProgress = Math.min(1, Math.max(0, progress));
  const segmentCount = points.length - 1;
  const animatedSegmentPosition = boundedProgress * segmentCount;
  const completedSegmentCount = Math.min(segmentCount, Math.floor(animatedSegmentPosition));
  const completedSegments = [];

  for (let index = 0; index < completedSegmentCount; index += 1) {
    completedSegments.push({
      from: points[index],
      to: points[index + 1]
    });
  }

  const hasPartialSegment = completedSegmentCount < segmentCount && boundedProgress < 1;
  const partialSegment = hasPartialSegment
    ? {
        from: points[completedSegmentCount],
        to: interpolatePoint(
          points[completedSegmentCount],
          points[completedSegmentCount + 1],
          animatedSegmentPosition - completedSegmentCount
        )
      }
    : null;

  return {
    completedSegments,
    partialSegment,
    revealedPointCount: Math.min(points.length, completedSegmentCount + 1)
  };
}

function interpolatePoint(from, to, progress) {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress
  ];
}
