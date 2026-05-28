DEVELOPMENT BUILD PLAN: VIKING RAID SENTRY PROTOTYPE

This document breaks down the development of the Viking Raid Sentry vertical slice into three sequential, functional milestones. Each milestone culminates in a playable target slice, ensuring code health, decoupling, and strict adherence to the logging and testing conventions laid out in tdd.md.

MILESTONE 1: The Tactical Canvas & UI Foundation

A. Scope Paragraph

Establish the project skeleton, centralized config system (src/config.js), and the visual interface layer. This milestone builds the static sandbox arena: a responsive viewport featuring the left-hand dragon defense coordinates, placeholders for the top HUD elements (HP, Score, Wave Tracker), and a high-performance drawing canvas. The drawing module must track touch/mouse coordinates in real time and render a smooth, glowing trailing line that fades out progressively within the configured $500\text{ ms}$ decay window. No active gesture matching or physics loop runs yet, but all coordinate translations, modular file divisions, and visual assets must be cleanly scaffolded.

B. End-User Test Checklist

Centralized Configuration Test: Modifying colors, stroke widths, or dimensions in src/config.js instantly and visibly alters the game's UI and rendering on refresh without changing game code.

Drawing Trail Decay Test: Drawing on the screen with a mouse or finger paints a smooth #00ffcc trail. The line must begin fading out smoothly from its oldest points and vanish completely within exactly $500\text{ ms}$.

UI Alignment Check: On both a desktop viewport and a simulated mobile touch screen, the HUD sits flush at the top, the defense boundary line is clearly marked at the left perimeter, and the three dragon stations scale responsively.

Diagnostic Logs Verify: The browser developer console outputs [INPUT:DRAW] tracking details containing real-time cursor coordinate capture rates.

C. AI Agent Prompt

Role: Junior Developer / AI Coding Agent
Context: Build Milestone 1 of the Viking Raid Sentry prototype.
Instructions:
1. Initialize a highly structured, single-page web environment (HTML5/Canvas with native JavaScript, using inline styles for ease of prototype setup).
2. Create a fully isolated configuration object mirroring GAME_CONFIG in `tdd.md`. Ensure absolutely zero magic numbers exist in the main drawing/rendering code; all positions, colors, widths, and bounds must refer back to this configuration.
3. Implement the pointer drawing listeners (mousedown/mousemove/mouseup and touchstart/touchmove/touchend) capturing raw coordinates. Translate screen coordinates to local virtual coordinates (800x450).
4. Render the glowing gesture trail on the canvas with a fading alpha channel using a requestAnimationFrame loop. The trail must vanish entirely after TRAIL_FADE_DURATION_MS.
5. Create a clean HUD overlay displaying mock health, waves, and score. Draw three static nodes representing dragons along the far left edge.
6. Print debugging traces to the console using the prefix `[INPUT:DRAW]` whenever the player is drawing.
7. BEFORE COMPLETING, physically run and verify every single item in the "End-User Test Checklist" in Milestone 1 of `plan.md`. Confirm that the page loads with no Javascript errors in the console.


MILESTONE 2: The $1 Glyph Strike Engine & Sandbox Recorder

A. Scope Paragraph

Introduce active gesture recognition and targeting. Integrate a lightweight implementation of the $1 Unistroke algorithm. Build templates for the three elemental glyphs: Wind ("V"), Earth ("Line"), and Fire ("Triangle"). Spawn static Viking ship placeholders on the right side of the screen, each displaying its respective elemental weakness badge. When a gesture is drawn and released, the system must recognize the shape: if correct, it identifies all ships matching that weakness and strikes the closest one to the defense line by drawing a temporary laser projection from the matching left-hand dragon. This milestone also builds the interactive Sandbox Panel (Method B) allowing designers to draw shapes, hit "Export Drawn Shape", and copy the clean JSON coordinate array for quick integration.

B. End-User Test Checklist

Shape Matching Validation: Draw a sharp "V" on screen. The system recognizes it as "Wind" with high accuracy. Draw a straight horizontal line. The system recognizes it as "Earth".

Targeting Priority Test: Place two static ships with "Fire" weaknesses on screen at different horizontal distances. Draw a triangle. Only the ship closest to the left-hand dragon barrier must explode and disappear.

Rejection/Accuracy Tolerance Check: Draw a chaotic scribble. The system must output a trace showing it fell below the GESTURE_ACCEPTANCE_THRESHOLD and refuse to fire a strike, providing immediate visual feedback of failure.

Method B Recorder Test: Open the toggleable diagnostic Sandbox Panel, draw a spiral shape on the canvas, and click "Export Drawn Shape". Verify that the clean JSON array of coordinates is copied or printed in the text field for direct configuration pasting.

Diagnostic Logs Verify: Check that the browser console logs [INPUT:RECOGNIZED] Matched 'X' with Y% accuracy. on successful inputs, or [STATE:KILL] when a target is cleared.

C. AI Agent Prompt

Role: Junior Developer / AI Coding Agent
Context: Build Milestone 2 of the Viking Raid Sentry prototype based on `tdd.md` and `defining_gestures.md`.
Instructions:
1. Integrate an inline, lightweight implementation of the $1 Unistroke Recognizer algorithm. Do not write this math from scratch; use a proven port.
2. Register the three default patterns (Wind, Earth, Fire) using the normalized coordinates provided in the design files. Set the threshold check from GESTURE_ACCEPTANCE_THRESHOLD in the config.
3. Spawn 3-4 static Viking ships at fixed, different X positions across the screen, assigning each an element weakness badge.
4. On pointerup/touchend, run the recognition. If recognized, run targeting logic: find the active ship on the screen that matches the recognized element and is closest to the left boundary. Trigger a visual projectile/laser from the corresponding dragon node to that ship, then remove the ship.
5. Create a toggleable diagnostic HTML Sandbox Panel on the UI. Capture raw drawing coordinates during active inputs and, upon clicking "Export Drawn Shape", output a stringified JSON array into a text box.
6. Print trace metrics to the console using the prefix `[INPUT:RECOGNIZED]` and `[STATE:KILL]`.
7. BEFORE COMPLETING, verify every single item in the "End-User Test Checklist" in Milestone 2 of `plan.md`. Keep the visual rendering clean and robust.


MILESTONE 3: Endless Wave Progression & Survival Loop

A. Scope Paragraph

Unify all modules into a fully automated, endless game loop. Implement the active Wave Spawning Engine that reads wave rules and dynamically launches Viking ships off-screen right. Create the ship movement logic using delta-time ($dt$) integration, applying compounding speed calculations based on the current Wave number using the formula: $S_w = S_2 \times (1 + \text{WAVE\_SCALING\_MULTIPLIER})^{w - 2}$ for $w \ge 3$. Handle ship boundary breaches: if a ship crosses DAMAGE_PERIMETER_X, decrement player HP. Build the 3-second wave transition banner. Implement score accumulation (including the $+50$ precision bonus). Finally, handle the game over state: display the score summary and a working Restart button that fully reinitializes all states.

B. End-User Test Checklist

Wave Progression Loop Test: Launching the game starts a 3-second countdown banner ("WAVE 1 START"). Once cleared, ships begin spawning automatically from the right at randomized heights.

Compounding Speed Escalation Check: Progress from Wave 1 through Wave 3. Verify that ships in Wave 3 move noticeably faster than in Wave 1, strictly obeying the exponential scaling multiplier.

Boundary Damage & Lose State Test: Allow three Viking ships to sail completely past the left-side dotted yellow perimeter line. The player health hearts must deplete one by one. On the third breach, the screen must freeze and display the "DEFEAT" overlay.

Restart Button Verification: Clicking "Restart" on the Defeat overlay resets player HP to 3, clears the screen of any ships, sets the score to 0, and begins Wave 1 immediately.

High Precision Score Bonus: Draw a highly precise gesture matching a template at $85\%+$ accuracy. Verify that the score increments by the standard wave kill points plus the additional $50$ precision points.

Diagnostic Logs Verify: Console prints [STATE:SPAWN], [STATE:DAMAGE], and wave change logs correctly.

C. AI Agent Prompt

Role: Junior Developer / AI Coding Agent
Context: Build Milestone 3 of the Viking Raid Sentry prototype to complete the vertical slice.
Instructions:
1. Implement a real-time delta-time game loop running via requestAnimationFrame.
2. Build the Wave Spawner. Initialize wave timelines: spawn WAVE_1_SHIP_COUNT ships at randomized intervals. Apply the exponential speed formula detailed in Section 3-A of the TDD to accelerate ships for subsequent waves.
3. Apply horizontal movement to spawned ships. If a ship's x-coordinate drops below DAMAGE_PERIMETER_X, delete the ship, decrement INITIAL_HEALTH, print `[STATE:DAMAGE]`, and flash the screen red.
4. When HP reaches 0, freeze game state updates, show the Defeat overlay screen with the final score, and disable drawing.
5. Code the "Restart" button logic to cleanly purge active entities, reset game health/score trackers, and boot Wave 1 again.
6. Connect scoring: on a successful hit, increment score by BASE_SCORE_PER_KILL * wave. If the gesture accuracy score is >= GESTURE_PRECISION_THRESHOLD, apply the PRECISION_BONUS_SCORE.
7. Implement the 3-second visual text banner transition between waves.
8. BEFORE COMPLETING, run through every item in the "End-User Test Checklist" in Milestone 3 of `plan.md`. Ensure that the game builds, runs, and is ready for static web deployment.
