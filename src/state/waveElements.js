import { GAME_CONFIG } from "../config.js";

export function selectWaveElements(wave, rng = Math.random, config = GAME_CONFIG) {
  const elementNames = Object.keys(config.ELEMENTS);
  const shuffled = shuffle(elementNames, rng);
  const selection = shuffled.slice(0, config.WAVES.WAVE_ELEMENT_COUNT);

  console.log(`[STATE:SPAWN] Wave ${wave} element pool: ${selection.join(", ")}.`);
  return selection;
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
