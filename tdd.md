TECHNICAL DESIGN DOCUMENT: VIKING RAID SENTRY PROTOTYPE

1. Current Stack

The prototype is a native JavaScript browser game using:

- Vite for local development and production builds.
- Canvas 2D for the gameplay field and sandbox drawing panels.
- Vitest for logic tests.
- Playwright for browser smoke checks when needed.
- A project-local $1 unistroke recognizer implementation in `src/input/oneDollarRecognizer.js`.

2. Architecture

The codebase is split into clear layers:

- Config: `src/config.js`
- Input: `src/input/`
- State engine: `src/state/`
- Rendering: `src/render/`
- Audio: `src/audio/`
- Sandbox authoring: `src/sandbox/`
- Vite middleware/tools: `tools/`

Rules:

- Config remains the single source of truth for gameplay constants, dimensions, colors, timings, thresholds, templates, and render tuning.
- State modules do not read the DOM or canvas.
- Render modules do not decide game outcomes.
- Input modules capture strokes and invoke recognition, but targeting and score changes happen in state modules.
- Sandbox tools may write config through explicit save actions, but runtime game code must not mutate `GAME_CONFIG`.

3. Fixed World and Responsive Scaling

The game simulation uses a fixed virtual playfield:

- Width: 800
- Height: 450
- Aspect ratio: 16:9

All world calculations use this coordinate system. Browser layout scales the canvas to the full page with letterboxing. Do not use CSS pixel dimensions for gameplay rules.

4. Centralized Configuration

All tunable values live in `src/config.js`, grouped by purpose:

- `PLAYFIELD`: world dimensions, defense line, dragon slots, ship spawn bounds, ship dimensions, static ship slots.
- `HEALTH`: starting health.
- `WAVES`: wave counts, speed progression, selected element count, transition timings, spawn intervals. Ship count and speed formulas use values from this block — see Section 7.
- `SCORE`: scoring, precision bonus values, high score limit.
- `GESTURES`: trail, recognizer thresholds, recognizer math constants, glyph templates.
- `ELEMENTS`: labels and colors for Fire, Wind, Earth, Water, Plant, Metal, Energy, Void, Light, Shadow, Prism.
- `RENDER`: colors, ship flag layout, ship asset paths, dragon images, dragon defeat rotations, docked ship rotation, effect images, habitat images, selection dialog layout, laser and feedback durations.
- `AUDIO`: music path, SFX paths, per-channel volumes, strike/burst delay.
- `UI`: responsive layout and sandbox/editor dimensions.
- `LOGGING`: sampling intervals.

No gameplay or render file should introduce hard-coded numbers when a config entry would be appropriate.

5. Gesture Recognition

The recognizer is based on the $1 unistroke algorithm:

- Resample the stroke to `GESTURE_RESAMPLE_POINTS`.
- Rotate toward zero.
- Scale and translate into a normalized space.
- Compare against configured templates.
- Accept when score is at least `GESTURE_ACCEPTANCE_THRESHOLD`.

Important current decision:

- The prototype supports unistroke glyphs only.
- Circle-like glyphs are represented by closed polygonal paths.
- Multi-stroke symbols are out of scope until a recognizer upgrade is selected.

6. Glyph Authoring

Glyph templates are stored as normalized point arrays in `GAME_CONFIG.GESTURES.TEMPLATES`.

The separate sandbox page is the canonical authoring workflow. It provides:

- A config-shape panel for editing the actual stored glyph.
- A separate user-drawing panel for test strokes.
- Point snapping for near-overlapping anchors.
- Undo and redo.
- Auto-updated template JSON display.
- One-click save to `src/config.js`.
- Live matching feedback.

The sandbox save path is powered by Vite middleware. This is a development-only tool and should not be exposed as a production feature.

The file `docs/original-glyph-proposals.json` preserves the earlier generated proposals for comparison.

7. Wave and State Engine

Core files:

- `src/state/gameLoop.js`: wave transitions, spawning, movement, breaches, restart.
- `src/state/gameRules.js`: score, precision, speed, damage rules.
- `src/state/targeting.js`: closest matching ship selection and strike application.
- `src/state/waveElements.js`: seeded random helper and active element selection.
- `src/state/highScores.js`: localStorage persistence for the top-5 leaderboard.

Current wave behavior:

- Each wave selects `WAVE_ELEMENT_COUNT` elements from the 11-element roster.
- Only the selected 5 elements can appear on ships in that wave.
- Ships spawn off-screen right at random y positions.
- Ships move left using delta-time integration.
- Breached ships decrement health, increment resolved ship count, spawn island fires, and create a docked ship entry.
- Cleared waves automatically queue the next wave.

Ship count formula (see `GAME_CONFIG.WAVES` for tunable values):

`BASE_SHIP_COUNT + (wave - 1) * SHIP_COUNT_INCREMENT`

Ship speed formula (see `GAME_CONFIG.WAVES` for tunable values):

`BASE_SHIP_SPEED * (1 + SPEED_GROWTH_MULTIPLIER) ^ (wave - 1)`

A single exponential multiplier applies uniformly from Wave 1 onward.

Game state fields introduced by breach handling:

- `islandHitCount`: total cumulative breaches.
- `islandFires`: array of fire position/size/rotation records, grows with each breach.
- `dockedShips`: array of breach-captured ships rendered on the island.

8. Rendering

Core file: `src/render/canvasRenderer.js`.

The renderer draws:

- Background sea gradient.
- Static island habitat (sand, grass, house, palm, tree, drawn to an offscreen cache).
- Five active dragons as PNG sprites with idle bob/sway animation and attack lunge.
- Island fire sprites that accumulate per breach.
- Active ships with dynamic glyph flag panels (animated drawing order).
- Docked ships: full ship image rotated 45° CW (`RENDER.DOCKED_SHIP_ROTATION`), no glyph overlay. The skull baked into the ship PNG is visible.
- Lasers with glow, bolt sprite, muzzle flash, and impact burst.
- Explosion animations (3-frame sprite sequence with sparks).
- Drawing trail, recognition feedback, wave selection dialog, and game over DOM state.

Dragon defeat rotation: when `islandHitCount >= HEALTH.INITIAL_HEALTH`, each dragon rotates to its configured dead angle. Values are set per element in `RENDER.DRAGON_DEFEAT_ROTATIONS` in `src/config.js` — edit those values to adjust the defeated pose for individual dragons.

Ship glyph animation is supported by pure helpers in `src/render/glyphTemplateAnimation.js` so drawing-order logic can be unit tested separately from canvas rendering.

9. Assets

Ship bases (PNG, 512×341, RGBA, chroma-key processed):

- `public/ships/ship-base-1.png`
- `public/ships/ship-base-2.png`
- `public/ships/ship-base-3.png`

Each ship base has a skull drawn onto the flag area. This skull is visible when a ship is docked (no glyph panel overlay). For active ships the skull is hidden behind the dynamically rendered glyph panel.

Dragon portraits:

- `src/assets/dragons/` — 11 PNG sprites, one per element (e.g. `Fire_Fire_Dragon.png`).

Audio:

- `public/audio/dragon-defense-loop.ogg` — looping background music.
- `public/audio/dragon-strike.ogg`, `ship-burst.ogg`, `ui-click.ogg`, `run-end.ogg` — SFX.

UI:

- `public/ui/crosshair-blue.png` — custom canvas cursor.
- `public/ui/button-long-blue.png` — button sprite.

Effects:

- `public/effects/muzzle.png`, `magic-ring.png`, `bolt.png` — laser/impact sprites.
- `public/effects/explosion-1.png`, `explosion-2.png`, `explosion-3.png` — explosion frames.

Habitat:

- `public/habitat/house.png`, `palm.png`, `tree.png`, `cannonball.png`, `fire-1.png`, `fire-2.png`.

10. Audio

`src/audio/gameAudio.js` exports a `GameAudio` class:

- Plays looping background music and per-event SFX.
- Delays audio context unlock until the first user interaction (browser autoplay policy).
- Mute toggle persists the preference to `localStorage` (key: `dragon-draw-defense-audio-enabled`).
- All volume levels and paths come from `GAME_CONFIG.AUDIO` — edit that block to tune volumes without touching code.

11. Logging Protocol

Use explicit console prefixes:

- `[INPUT:DRAW]`: pointer coordinate capture and draw sampling.
- `[INPUT:RECOGNIZED]`: recognizer result, accepted/rejected name, confidence.
- `[STATE:SPAWN]`: wave queueing, active wave start, ship spawn details.
- `[STATE:DAMAGE]`: defense-line breach and health change.
- `[STATE:KILL]`: successful ship clear and score gain.
- `[SANDBOX:*]`: sandbox authoring and save behavior.

12. Testing

Required command before committing:

`npm run check`

This runs:

1. `npm run test`
2. `npm run build`

Current test coverage includes:

- Gesture recognizer behavior.
- Score, precision, speed, and damage rules.
- Wave selection and seeded random behavior.
- Wave transition/spawn/movement/breach/restart behavior.
- Targeting closest matching ship.
- High score insert, load, save, and validation logic.
- Sandbox state editing, snapping, undo/redo.
- Glyph flag animation helper math.

Browser smoke checks should be run after visual or interaction changes. Use Playwright screenshots for canvas-heavy changes because DOM assertions cannot verify most gameplay rendering.

13. Commit Discipline

Use conventional commits:

- `feat:` for player-visible features.
- `fix:` for behavior fixes.
- `test:` for tests.
- `chore:` for build, config, or doc-only maintenance.

Per project instruction, after each turn:

1. Run the build/compile check.
2. If it fails, fix it before committing.
3. If it passes, commit all current changes with a clear conventional message.

14. Known Technical Limits

- Recognition is unistroke only.
- Glyph matching can still confuse visually similar shapes if templates are too close.
- Ship glyph flags are small by design; future art/layout changes should preserve readability.
- The sandbox config writer is development-only.
- There is no persistent player progress or remote score storage.
