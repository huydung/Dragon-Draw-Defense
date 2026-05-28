const TEMPLATE_BLOCK_PATTERN =
  /    \/\/ SANDBOX_TEMPLATES_START\n    TEMPLATES: [\s\S]*?\n    \/\/ SANDBOX_TEMPLATES_END/;

export function validateTemplates(templates) {
  if (!templates || typeof templates !== "object" || Array.isArray(templates)) {
    throw new Error("Templates payload must be an object.");
  }

  for (const [name, points] of Object.entries(templates)) {
    if (!isValidShapeName(name)) {
      throw new Error(`Invalid shape name: ${name}`);
    }

    if (!Array.isArray(points) || points.length < 2) {
      throw new Error(`Shape '${name}' must include at least two points.`);
    }

    points.forEach((point, index) => {
      if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) {
        throw new Error(`Shape '${name}' has an invalid point at index ${index}.`);
      }
    });
  }
}

export function replaceGestureTemplatesInConfig(configSource, templates) {
  validateTemplates(templates);

  if (!TEMPLATE_BLOCK_PATTERN.test(configSource)) {
    throw new Error("Could not find sandbox template markers in src/config.js.");
  }

  return configSource.replace(TEMPLATE_BLOCK_PATTERN, serializeTemplateBlock(templates));
}

export function serializeTemplateBlock(templates) {
  const lines = ["    // SANDBOX_TEMPLATES_START", "    TEMPLATES: {"];
  const entries = Object.entries(templates);

  entries.forEach(([name, points], entryIndex) => {
    lines.push(`      ${name}: [`);
    points.forEach((point, pointIndex) => {
      const pointSuffix = pointIndex === points.length - 1 ? "" : ",";
      lines.push(`        [${formatNumber(point[0])}, ${formatNumber(point[1])}]${pointSuffix}`);
    });
    const entrySuffix = entryIndex === entries.length - 1 ? "" : ",";
    lines.push(`      ]${entrySuffix}`);
  });

  lines.push("    }", "    // SANDBOX_TEMPLATES_END");
  return lines.join("\n");
}

function isValidShapeName(name) {
  return /^[A-Z][A-Za-z0-9_]*$/.test(name);
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}
