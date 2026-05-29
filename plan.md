DEVELOPMENT BUILD PLAN: VIKING RAID SENTRY PROTOTYPE

This plan reflects the prototype as currently built. Milestones 1, 2, and 3 are complete and committed. The next session can start from "Remaining Work / Next Milestone Candidates" below.

Milestone 1: Tactical Canvas and UI Foundation

Status: Complete.

Implemented:

- Vite project setup with native JavaScript modules.
- Centralized `src/config.js`.
- Fixed 800x450 virtual world.
- Responsive 16:9 canvas scaling with letterboxing.
- Canvas background, HUD, defense line, health, wave, score, and sandbox link.
- Pointer/touch drawing input with coordinate conversion into virtual world space.
- Real-time glowing gesture trail with configured fade.
- Console logging for draw input.

Verification:

- Unit/build check has passed in prior milestone work.
- Browser view confirmed the canvas is runnable through the Vite dev server.

Milestone 2: Glyph Strike Engine and Sandbox Authoring

Status: Complete, with scope expanded from 3 elements to 11 elements.

Implemented:

- $1 unistroke recognizer.
- Recognition thresholds and templates wired through config.
- Targeting logic that clears the closest active ship matching the recognized element.
- Laser strike feedback from the matching active dragon slot.
- Rejection feedback for low-confidence gestures.
- Separate sandbox page.
- Glyph list for all 11 elements.
- Config-shape editor panel and separate user-drawing test panel.
- Point editing, snapping, undo, redo, template JSON display, and save-to-config.
- Original glyph proposals preserved in `docs/original-glyph-proposals.json`.

Design changes from original plan:

- The old toggleable in-game recorder panel was replaced by a dedicated sandbox page.
- The old "Use Current Stroke" workflow was removed because raw strokes created too many points.
- The config-shape panel is now an authoring tool for clean anchor-point glyphs.
- The element library now includes all 11 basic elements instead of only Fire, Wind, and Earth.

Verification:

- Logic tests cover recognizer, targeting, and sandbox state behavior.
- Browser checks confirmed real-time drawing and sandbox editing behavior during implementation.

Milestone 3: Endless Wave Progression and Survival Loop

Status: Complete, with added wave draft and ship glyph readability features.

Implemented:

- Endless wave loop driven by `requestAnimationFrame`.
- 3-second pre-wave transition.
- Random selection of 5 active dragons from all 11 elements per wave.
- Pre-wave dialog showing all 11 dragons with random highlight animation before locking onto the 5 selected dragons.
- Active combat view showing only the 5 selected dragons on the defense line.
- Dynamic ship spawning from off-screen right.
- Randomized ship y positions.
- Delta-time ship movement.
- Wave 1, Wave 2, Wave 3+ ship count progression.
- Configured speed scaling.
- Health damage on defense-line breach.
- Damage flash.
- Scoring and precision bonus.
- Defeat overlay and restart button.
- Generated transparent Viking airship base variants in `public/ships/`.
- Dynamic ship flag panels that animate the target glyph drawing order.

Design changes from original plan:

- The old text-only "WAVE X START" banner was replaced by a richer dragon-draft dialog.
- Ships no longer rely on small elemental badges alone; they show the actual target glyph on a flag.
- The ship art is generated raster asset work, while the gameplay glyph remains canvas-drawn and config-driven.
- Defense line dragons are now wave-selected active dragons, not a fixed static roster.

Verification:

- `npm run check` passed after implementation.
- Browser smoke verified transition dialog, 5 active dragons, active wave spawning, ship flags, and no page errors.

Current Useful Commands

- Start dev server: `npm run dev`
- Run tests: `npm run test`
- Run required full check: `npm run check`
- Main game URL while dev server is running: `http://127.0.0.1:<vite-port>/`
- Sandbox URL while dev server is running: `http://127.0.0.1:<vite-port>/sandbox.html`

Remaining Work / Next Milestone Candidates

Recommended next milestone: Milestone 4, "Gesture and Combat Polish".

Candidate scope:

- Playtest all 11 glyphs against each other and revise confusing templates.
- Add a visible recognition result panel or short combat feedback near the stroke.
- Improve ship destruction feedback with a small explosion or dissolve animation.
- Add a short dragon attack animation or pulse when a strike fires.
- Add pause/resume and a clearer restart/new-run flow.
- Add mobile-specific playtest pass for touch accuracy and safe-area layout.
- Add deterministic browser smoke tests for drawing a known glyph and confirming a ship is removed.
- Tune spawn pacing and speed so Wave 1 is readable and Wave 3 is tense but fair.
- Decide whether to stay with $1 unistroke recognition or evaluate a stronger recognizer before adding multi-stroke glyphs.

Known Risks to Address Next

- Some glyph templates may still be too visually or mathematically similar.
- Ship flags are readable at desktop size but should be checked on small mobile screens.
- The generated ships are serviceable prototype assets, not final art.
- Recognition only supports one continuous stroke.
- The sandbox save middleware is development-only and should be disabled or excluded from production workflows if this moves beyond prototype.

Fresh Session Startup Prompt

Read `gdd.md`, `tdd.md`, and `plan.md` first. Continue from the "Remaining Work / Next Milestone Candidates" section. Preserve centralized config, zero magic numbers, separation of concerns, tests for logic, browser smoke checks for canvas UI, and commit-after-turn discipline.
