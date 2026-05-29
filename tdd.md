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

- `PLAYFIELD`: world dimensions, defense line, dragon slots, ship spawn bounds, ship dimensions.
- `HEALTH`: starting health.
- `WAVES`: wave counts, speed progression, selected element count, transition timings, spawn intervals.
- `SCORE`: scoring and precision bonus values.
- `GESTURES`: trail, recognizer thresholds, recognizer math constants, glyph templates.
- `ELEMENTS`: labels and colors for Fire, Wind, Earth, Water, Plant, Metal, Energy, Void, Light, Shadow, Prism.
- `RENDER`: colors, ship flag layout, ship asset paths, selection dialog layout, laser and feedback durations.
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

Current wave behavior:

- Each wave selects `WAVE_ELEMENT_COUNT` elements from the 11-element roster.
- Only the selected 5 elements can appear on ships in that wave.
- Ships spawn off-screen right at random y positions.
- Ships move left using delta-time integration.
- Breached ships decrement health and increment resolved ship count.
- Cleared waves automatically queue the next wave.

Ship speed math:

- Wave 1: `BASE_SHIP_SPEED`.
- Wave 2: `BASE_SHIP_SPEED * (1 + WAVE_2_SPEED_MULTIPLIER)`.
- Wave 3+: Wave 2 speed multiplied by `(1 + WAVE_SCALING_MULTIPLIER) ** (wave - 2)`.

8. Rendering

Core file: `src/render/canvasRenderer.js`.

The renderer draws:

- Background grid and defense line.
- Five active dragons only.
- Spawned ships.
- Generated ship base variants from `public/ships/`.
- Dynamic ship flag panels.
- Animated glyph paths on ship flags.
- Lasers, damage flash, drawing trail, feedback, selection dialog, and game over DOM state.

Ship glyph animation is supported by pure helpers in `src/render/glyphTemplateAnimation.js` so drawing-order logic can be unit tested separately from canvas rendering.

9. Assets

Generated ship bases are stored in:

- `public/ships/ship-base-1.png`
- `public/ships/ship-base-2.png`
- `public/ships/ship-base-3.png`

They were generated with the Image skill on chroma-key backgrounds, processed to transparent PNGs, and resized for runtime use.

The ships are decorative bases. The playable glyph information is drawn dynamically by canvas on top of the flag panel so the same asset can represent any element.

10. Logging Protocol

Use explicit console prefixes:

- `[INPUT:DRAW]`: pointer coordinate capture and draw sampling.
- `[INPUT:RECOGNIZED]`: recognizer result, accepted/rejected name, confidence.
- `[STATE:SPAWN]`: wave queueing, active wave start, ship spawn details.
- `[STATE:DAMAGE]`: defense-line breach and health change.
- `[STATE:KILL]`: successful ship clear and score gain.
- `[SANDBOX:*]`: sandbox authoring and save behavior.

11. Testing

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
- Sandbox state editing, snapping, undo/redo.
- Glyph flag animation helper math.

Browser smoke checks should be run after visual or interaction changes. Use Playwright screenshots for canvas-heavy changes because DOM assertions cannot verify most gameplay rendering.

12. Commit Discipline

Use conventional commits:

- `feat:` for player-visible features.
- `fix:` for behavior fixes.
- `test:` for tests.
- `chore:` for build, config, or doc-only maintenance.

Per project instruction, after each turn:

1. Run the build/compile check.
2. If it fails, fix it before committing.
3. If it passes, commit all current changes with a clear conventional message.

13. Known Technical Limits

- Recognition is unistroke only.
- Glyph matching can still confuse visually similar shapes if templates are too close.
- Ship glyph flags are small by design; future art/layout changes should preserve readability.
- The sandbox config writer is development-only.
- There is no persistent player progress or remote score storage.
