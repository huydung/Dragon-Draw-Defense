import { GAME_CONFIG } from "../config.js";
import { OneDollarRecognizer } from "../input/oneDollarRecognizer.js";

export function selectWaveElements(wave, rng = Math.random, config = GAME_CONFIG) {
  const elementNames = Object.keys(config.ELEMENTS);
  const shuffled = shuffle(elementNames, rng);
  const conflicts = createElementConflictMap(config);
  const selection = findCompatibleSelection(shuffled, config.WAVES.WAVE_ELEMENT_COUNT, conflicts) ?? shuffled.slice(0, config.WAVES.WAVE_ELEMENT_COUNT);

  console.log(`[STATE:SPAWN] Wave ${wave} element pool: ${selection.join(", ")}.`);
  return selection;
}

export function createElementConflictMap(config = GAME_CONFIG) {
  const recognizer = new OneDollarRecognizer(config);
  const threshold = config.GESTURES.GESTURE_ACCEPTANCE_THRESHOLD;
  const names = Object.keys(config.GESTURES.TEMPLATES);
  const conflicts = new Map(names.map((name) => [name, new Set()]));

  names.forEach((sourceName) => {
    names.forEach((targetName) => {
      if (sourceName === targetName) {
        return;
      }

      const result = recognizer.recognize(toPointObjects(config.GESTURES.TEMPLATES[sourceName]), [targetName]);
      if (result.score >= threshold) {
        conflicts.get(sourceName)?.add(targetName);
        conflicts.get(targetName)?.add(sourceName);
      }
    });
  });

  return conflicts;
}

export function hasElementConflict(elements, conflicts) {
  return elements.some((name, index) =>
    elements.slice(index + 1).some((otherName) => conflicts.get(name)?.has(otherName))
  );
}

export function createShipsForWave(activeElements, config = GAME_CONFIG) {
  return config.PLAYFIELD.STATIC_SHIP_SLOTS.map((slot, index) => ({
    ...slot,
    id: `${slot.id}-${activeElements[index % activeElements.length]}`,
    weakness: activeElements[index % activeElements.length],
    active: true
  }));
}

export function createSeededRandom(seed) {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function shuffle(items, rng) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function findCompatibleSelection(candidates, targetCount, conflicts, startIndex = 0, selection = []) {
  if (selection.length === targetCount) {
    return selection;
  }

  const remainingSlots = targetCount - selection.length;
  if (candidates.length - startIndex < remainingSlots) {
    return null;
  }

  for (let index = startIndex; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (selection.every((selected) => !conflicts.get(candidate)?.has(selected))) {
      const result = findCompatibleSelection(candidates, targetCount, conflicts, index + 1, [...selection, candidate]);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

function toPointObjects(points) {
  return points.map(([x, y]) => ({ x, y }));
}
