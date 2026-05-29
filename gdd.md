PROTOTYPE GAME DESIGN DOCUMENT: VIKING RAID SENTRY

1. Pitch

Viking Raid Sentry is a high-focus gesture defense prototype inspired by Dragon Mania Legends. Players defend an island perimeter by drawing elemental glyphs that command dragons to destroy incoming Viking airships before they breach the defense line.

2. Design Pillars

Tactical Urgency: Players must read ship glyphs quickly, choose the right elemental response, and execute the matching drawing under pressure.

Familiar Magic: The prototype uses the 11 basic DML-style elements: Fire, Wind, Earth, Water, Plant, Metal, Energy, Void, Light, Shadow, and Prism.

Low Friction, High Mastery: A player can draw anywhere on the game canvas, but high scores depend on clean gestures, fast recognition, and prioritizing the closest matching ship.

Readable Combat Language: Ships must clearly communicate their required glyph. The current implementation shows the target pattern on each ship flag and animates the path in drawing order.

3. Core Loop

1. A pre-wave draft randomly selects 5 dragons from the full 11-element roster.
2. Ships spawn from the right with glyph flags that show their elemental weakness.
3. The player draws the matching glyph anywhere on the game canvas.
4. The closest active ship with that weakness is struck by the matching dragon.
5. The player earns score, survives the wave, and faces a faster wave.

4. Core Mechanic: Gesture Countering

The gameplay canvas is both the battlefield and the drawing surface. Pointer or touch strokes are converted into normalized point paths and compared against configured glyph templates using a $1 unistroke recognizer.

When a gesture is accepted, the game finds active ships matching that recognized element. The strike targets the matching ship closest to the left-side damage perimeter. One accepted drawing clears at most one ship.

5. Current Element Roster

All 11 basic elements are present in the prototype:

- Fire
- Wind
- Earth
- Water
- Plant
- Metal
- Energy
- Void
- Light
- Shadow
- Prism

Each wave randomly selects 5 of the 11 elements. Only those 5 dragons appear on the defense line during active combat. The full roster appears in the pre-wave selection dialog.

6. Glyph Design Decisions

Glyphs are stored in `GAME_CONFIG.GESTURES.TEMPLATES` as normalized 0-100 point coordinates.

Current authoring constraints:

- Glyphs should fit comfortably inside a square.
- Glyphs should be visually distinct across all 11 elements.
- Most glyphs should stay within 7 anchor points, giving up to 6 simple path segments.
- Extra points are allowed only for shapes that are very easy to draw and uniquely readable.
- Circles are supported by polygonal approximation; Light currently uses a closed loop/circle-like shape.
- The sandbox keeps prior proposal data in `docs/original-glyph-proposals.json` for reference.

7. Battlefield Layout

The world simulation uses a fixed 800x450 virtual coordinate system. The browser scales this 16:9 game canvas to the full available page with letterboxing, so gameplay math stays stable across screen sizes.

The left side contains:

- A dashed yellow defense/damage line.
- Five active dragon slots for the current wave.
- Health, wave, and score HUD across the top.

The right side contains:

- Viking airships spawning off-screen.
- Ship flags displaying the required glyph.
- Animated glyph drawing order on each flag.

8. Wave Rules

Wave progression is endless:

- Wave 1: 5 ships.
- Wave 2: 8 ships.
- Wave 3: 12 ships.
- Wave 4+: Wave 3 count plus 1 additional ship per wave after Wave 3.

Ship speed:

- Wave 1 uses the base speed.
- Wave 2 increases by 15%.
- Wave 3+ scales exponentially using the configured 20% multiplier.

Before each wave, a 3-second dragon draft dialog shows all 11 elements, rapidly highlights possible selections, then locks onto the 5 active dragons used in that wave.

9. Scoring, Win, and Lose States

Base kill score: `BASE_SCORE_PER_KILL * current wave`.

Precision bonus: +50 if recognition confidence is at least `GESTURE_PRECISION_THRESHOLD`.

Win state: The prototype is currently endless high-score survival. There is no campaign victory condition yet.

Lose state: The defense line has 3 health. Each breached ship removes 1 health. At 0 health, the game freezes and shows a Defeat overlay with final score and a restart button.

10. Controls

Desktop:

- Hold left mouse button and draw on the game canvas.
- Release to submit the gesture.

Mobile or touch:

- Touch and drag on the game canvas.
- Lift finger to submit the gesture.

11. UI and UX Flow

Current implemented flow:

1. Load directly into the game view.
2. Wave 1 begins with a 3-second dragon draft dialog.
3. Active combat starts automatically.
4. Waves continue until health reaches 0.
5. Defeat overlay appears.
6. Restart button resets health, score, ships, and Wave 1 state.

The earlier title screen idea is not implemented and is no longer part of the current vertical slice.

12. Sandbox

The sandbox is a separate page available from the game screen. It supports:

- Viewing all glyph templates.
- Editing template points directly on the config-shape canvas.
- Drawing test strokes in a separate square canvas.
- Live matching against the configured glyph library.
- Snapping nearby points together.
- Undo and redo for glyph editing.
- Auto-updating the template JSON display.
- Saving edited glyph templates back into `src/config.js` through the Vite middleware.

13. Current Scope

Implemented:

- Native JavaScript, Vite, Canvas prototype.
- Fixed 800x450 world with responsive 16:9 letterboxing.
- Real-time drawing trail.
- $1 gesture recognizer.
- 11-element glyph library.
- Random 5-dragon wave draft.
- Endless wave spawning, movement, breach damage, scoring, restart, and game over.
- Generated Viking airship base variants.
- Animated glyph flags on ships.
- Separate glyph sandbox and config writer.
- Vitest coverage for logic-heavy systems.

Still out of scope:

- Production DML art.
- Animated dragon models.
- Audio/music.
- Leaderboards or server persistence.
- Multi-stroke gesture recognition.
- Bosses, powerups, campaign progression, or economy systems.
