PROTOTYPE GAME DESIGN DOCUMENT: VIKING RAID SENTRY

1. Pitch

A high-focus, gesture-drawing defense mini-game for Dragon Mania Legends. Players defend their island's border by actively sketching elemental glyphs onto the screen to unleash defensive strikes from their dragons, countering waves of encroaching Viking mechanical airships before they break through the perimeter.

2. Design Pillars

Tactical Urgency: The game relies on rapid visual identification of priority threats mixed with fast, accurate physical execution.

Familiar Magic: Reuses core DML elements (Fire, Wind, Earth) and lore to instantly feel like an official spin-off extension.

Low Friction, High Mastery: Easy to grasp with intuitive drawings, but high scores require spatial awareness and optimal targeting choices.

3. Core Loop

[ Identify Closest Threat ] ➔ [ Match Glyph Weakness ] ➔ [ Sketch Gesture on Screen ] ➔ [ Dragon Fires / Ship Explodes ] ➔ [ Earn Score Points ] ➔ [ Face Faster Wave ]


4. Core Mechanic: Gesture Countering

The screen acts as an open canvas. Encroaching Viking ships display a distinct, glowing elemental weakness icon above them. Drawing the matching geometric shape anywhere on the gameplay canvas commands the player's back-line dragons to fire a homing elemental projectile, destroying the targeted ship instantly.

5. Game Rules

The Battlefield Layout:

Three of the player's dragons sit stationed in fixed decorative positions along the far-left edge of the screen (the Defense Line).

Viking mechanical airships spawn off-screen to the right and sail continuously from right to left at variable vertical positions (no locked lanes).

Targeting Priority (One Drawing = One Ship):

When a player successfully draws a gesture, the game identifies all active ships on screen that share that specific elemental weakness.

The system then executes the strike exclusively on the closest matching ship to the left-hand Defense Line.

The Gesture Catalog:

Wind Weakness: Represented by a sharp "V" shape.

Earth Weakness: Represented by a direct Horizontal Line drawn from left to right.

Fire Weakness: Represented by an upscale Triangle/Crest shape (drawn continuously).

Wave Progression Structure:

The game progresses in distinct, sequential waves.

Wave 1: 5 Viking ships spawn sequentially. Slow movement speed.

Wave 2: 8 Viking ships spawn. Movement speed increases by 15%.

Wave 3+: 12+ Viking ships spawn per wave. Movement speed increases cumulatively by 20% per wave, creating an escalating survival challenge.

A 3-second visual text banner ("WAVE X START") separates waves, giving the player a brief rest window.

Scoring System:

Base Kill: Destroying a ship awards 100 points multiplied by the current Wave number (e.g., a kill in Wave 3 awards 300 points).

Precision Bonus: If the gesture matching algorithm detects a shape accuracy rating greater than 85%, an additional 50 points are added to that kill.

Win and Lose States:

Win Condition: The prototype is an endless high-score survival loop. "Winning" means beating personal milestones on the local scoring system.

Lose Condition: Each Viking ship carries a health damage value. The player's left-hand Defense Line has a structural health pool of 3 Hit Points. If a single Viking ship successfully touches the left edge of the screen, it explodes, and the player loses 1 Hit Point. When the health pool hits 0, the game freeze-frames, displaying a "GAME OVER" menu with the final score.

6. Controls

Mobile (Touch-First):

Draw Input: Touch and drag anywhere within the screen's central play space to draw a continuous line path.

Commit Input: Lifting the finger off the glass ends the gesture trail and immediately triggers the shape validation engine.

Desktop (Mouse Alternative):

Draw Input: Click and hold the Left Mouse Button while moving the cursor across the central play space to draw a line path.

Commit Input: Releasing the Left Mouse Button ends the line trail and triggers the shape validation engine.

7. UI Layout & Elements

Heads-Up Display (HUD) - Top Margin:

Left Side: Player Health indicator represented by 3 Heart Icons.

Center: Current Wave Number (e.g., "WAVE 03").

Right Side: Current Score display counter (e.g., "SCORE: 014,500").

Gameplay Canvas - Central Core:

An open field where the player draws. A transient, glowing trailing line effect follows the user's cursor/finger path, fading out over 500 milliseconds.

Game Over Screen Overlay:

A modal dialogue blocking interaction upon defeat. Displays "DEFEAT", the final score achieved, a "Restart Prototype" button, and an empty mock placeholder box for a future leaderboards module.

8. UX Flow

Launch app ➔ 2. Simple Title screen with a "Start Game" button ➔ 3. Brief 3-second countdown ➔ 4. Active gameplay (Wave 1 begins) ➔ 5. Endless escalation loop until Health reaches zero ➔ 6. Game Over overlay presentation ➔ 7. Pressing "Restart" immediately reloads the gameplay state.

9. Scope Specifications (Vertical Slice)

In-Scope:

Fully working $1 Gesture recognition script for the 3 target shapes (V, Line, Triangle).

Functional wave spawner with speed multipliers.

Real-time text trackers for Score, Wave, and Health points.

Basic, color-coded geometric shapes standing in for game assets (e.g., Green boxes for Dragons, Grey rectangles with Element badges for Viking ships).

Non-Goals (Out of Scope for Prototype):

Real-time server database integrations or functional live network leaderboards.

Animated dragon models, complex particle impact explosions, background ambient music tracks, or multi-phase boss encounters.