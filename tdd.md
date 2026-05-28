TECHNICAL DESIGN DOCUMENT: VIKING RAID SENTRY PROTOTYPE

1. System Architecture & Separation of Concerns

To ensure clean code, ease of testing, and extreme flexibility during tuning, the prototype must strictly decouple its subsystems. The runtime architecture is split into five isolated layers:

+-----------------------------------------------------------------+
|                         CONFIG LAYER                            |
|                          (config.js)                            |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                         INPUT LAYER                             |
|          (Captures gestures, runs $1 Recognizer)               |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                         STATE ENGINE                            |
|  (Manages Waves, Health, Active Ships, Score, Collision check)  |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                       RENDER / UI LAYER                         |
|     (Draws Canvas, fades lines, updates DOM/SVG HUD elements)   |
+-----------------------------------------------------------------+


Module Breakdown

Config Engine (src/config.js): The single source of truth containing all tweakable numerical parameters, including registered gesture templates. No constants are allowed in logic or render scripts.

Gesture Recognizer (src/input/): Listens to pointer (mouse/touch) events, draws a temporary trailing line, and passes the coordinate array to an external, integrated $1 Gesture matching library (e.g., onedollar.js). It emits an event when a shape is successfully matched.

Game State Controller (src/state/): Completely decoupled from the screen. It keeps track of the wave timelines, spawns ships, advances positions based on delta time ($dt$), validates damage collisions, calculates scores, and decrements health points.

Render Pipeline (src/render/): Reads the current active state objects (such as ship positions) and paints them to the screen. It has no say in whether a ship is dead or alive; it simply draws the current state.

2. Centralized Configuration (Zero Magic Numbers)

All physical dimensions, speeds, colors, timing windows, and multipliers must live in src/config.js. This module is fully commented so a game designer or non-coder can open it and instantly modify gameplay characteristics without touching engine logic.

// src/config.js

export const GAME_CONFIG = {
  // ==========================================
  // PLAYFIELD & SCREEN SETTINGS
  // ==========================================
  /* Target canvas aspect ratio height (assumed coordinate system width is 800px) */
  VIRTUAL_WIDTH: 800,
  /* Target canvas aspect ratio height */
  VIRTUAL_HEIGHT: 450,
  
  // ==========================================
  // HEALTH & STATE CONSTANTS
  // ==========================================
  /* Starting Hit Points for the player's Defense Line. Recommended: 3 to 5 */
  INITIAL_HEALTH: 3,
  /* X-coordinate boundary (from left) where ships trigger structural damage */
  DAMAGE_PERIMETER_X: 110,
  
  // ==========================================
  // WAVE PROGRESSION & SPEED TUNING
  // ==========================================
  /* Base amount of ships spawned in the very first wave */
  WAVE_1_SHIP_COUNT: 5,
  /* Base speed of ships in pixels per second during Wave 1. Range: 30 - 80 */
  BASE_SHIP_SPEED: 40,
  /* Progressive multiplier applied to ship speeds in Wave 2. Recommended: 0.15 (+15%) */
  WAVE_2_SPEED_MULTIPLIER: 0.15,
  /* Accumulative compounding speed multiplier applied for Wave 3 and beyond. Recommended: 0.20 (+20% per wave) */
  WAVE_SCALING_MULTIPLIER: 0.20,
  /* Rest window between waves (in milliseconds) before the next banner clears */
  WAVE_TRANSITION_DELAY_MS: 3000,
  /* Minimum delay (ms) between subsequent ship spawns within a single wave */
  MIN_SPAWN_INTERVAL_MS: 1500,
  /* Maximum delay (ms) between subsequent ship spawns within a single wave */
  MAX_SPAWN_INTERVAL_MS: 3000,

  // ==========================================
  // SCORING CONFIGURATION
  // ==========================================
  /* Base score awarded for destroying a ship. Scaled by current Wave number */
  BASE_SCORE_PER_KILL: 100,
  /* Additional bonus score awarded if the gesture matching accuracy is highly precise */
  PRECISION_BONUS_SCORE: 50,

  // ==========================================
  // GESTURE & DRAWING SETTINGS
  // ==========================================
  /* Time (in milliseconds) for the visual drawing trace line to fade off screen completely */
  TRAIL_FADE_DURATION_MS: 500,
  /* Color of the player's drawing stroke trail in HEX format */
  TRAIL_COLOR: "#00ffcc",
  /* Stroke thickness of the player's drawing trail */
  TRAIL_WIDTH: 4,
  /* Accuracy threshold percentage (0.0 to 1.0) required to recognize a gesture. Range: 0.70 to 0.85 */
  GESTURE_ACCEPTANCE_THRESHOLD: 0.75,
  /* Precision threshold percentage (0.0 to 1.0) above which the player earns a scoring bonus. Recommended: 0.85 */
  GESTURE_PRECISION_THRESHOLD: 0.85,
  /* Number of normalized geometric coordinate points used by the $1 Recognizer algorithm. Recommended: 64 */
  GESTURE_RESAMPLE_POINTS: 64,

  // ==========================================
  // GESTURE TEMPLATE PATTERNS
  // ==========================================
  /* Pre-registered templates mapped to their coordinate strings for the $1 Recognizer */
  TEMPLATES: {
    Wind: [[0,0], [50,100], [100,0]],
    Earth: [[0,50], [100,50]],
    Fire: [[10,90], [50,10], [90,90], [10,90]]
  }
};


3. Core Algorithms & Mathematical Formulations

A. Wave Scaling Math

To calculate a ship's pixel speed $S_w$ during wave $w$, use the following scale progression:

For Wave 1:


$$S_1 = \text{BASE\_SHIP\_SPEED}$$

For Wave 2:


$$S_2 = S_1 \times (1 + \text{WAVE\_2\_SPEED\_MULTIPLIER})$$

For Wave $w \ge 3$:


$$S_w = S_2 \times (1 + \text{WAVE\_SCALING\_MULTIPLIER})^{w - 2}$$

This ensures predictable pacing curves that can be fine-tuned purely via the config coefficients.

B. $1 Unistroke Gesture Recognizer Math

While the mathematical foundations are outlined below for theoretical context, developers must not implement this logic from scratch. Instead, import an existing, vetted, open-source library (such as onedollar.js or equivalent platform port).

The library handles four mathematical normalization phases on the raw input array $P = [p_0, p_1, \dots, p_{M-1}]$ to compare it to templates $T$:

Resample Path: Resample the sequence of points to a fixed number $N$ (configured by GESTURE_RESAMPLE_POINTS, usually 64) to ensure uniform point density:


$$l = \frac{\text{Total Length of Path}}{N - 1}$$

Rotate to Zero Degrees: Find the centroid $C$ of the points. Calculate the angle $\theta$ between the vector $(p_0 - C)$ and the horizontal axis. Rotate all points by $-\theta$ around $C$ to make the shape rotation-invariant.

Scale and Translate: Scale the rotated shape non-uniformly to fit a normalized bounding box of size $1 \times 1$. Then, translate the shape so its centroid sits at coordinates $(0, 0)$.

Calculate Distance & Score: For each template $T_i$, compute the average Euclidean distance $d$ between corresponding points of the normalized input and the template. The similarity score is mapped between $0.0$ and $1.0$:


$$\text{Score} = 1 - \frac{d}{\frac{1}{2}\sqrt{2}}$$


If $\text{Score} \ge \text{GESTURE\_ACCEPTANCE\_THRESHOLD}$, trigger a successful hit on the closest matching ship.

4. Developer Workflow, Testing & Sandbox Utilities

A. Strict Conventional Commits

All developers must write commits conforming to the conventional format. A local pre-commit hook runs compilation checks before allowing code into the repository.

feat: for new features (e.g., adding a new elemental shape).

fix: for fixing runtime bugs (e.g., resolving coordinate scaling offsets on high-DPI screens).

test: when writing or refactoring unit/integration test suites.

chore: config updates, workspace settings, or library dependency upgrades.

B. Logging Protocol

Key systems must trace operations to the diagnostic console with explicit logging prefixes for quick profiling:

[INPUT:DRAW] Logs coordinate capture rates, pointer states, and trail paths.

[INPUT:RECOGNIZED] Traces the exact shape string and confidence scores:
"[INPUT:RECOGNIZED] Matched 'Fire' with 89.2% accuracy."

[STATE:SPAWN] Outputs wave initialization logs, active ship metrics, and speed multipliers.

[STATE:DAMAGE] Dispatched immediately when a ship crosses DAMAGE_PERIMETER_X:
"[STATE:DAMAGE] Ship breached boundary. HP decremented. Current HP: 2/3."

[STATE:KILL] Dispatched when a gesture coordinates a laser strike on a targeted ship.

C. Developer Sandbox & Live Pattern Recorder (Method B)

To ensure immediate support for complex, organic shapes later (like a spiral for a "Void" element or a wavy line for "Water"), plotting manual coordinates is forbidden. Developers must implement a toggleable diagnostic Sandbox Panel directly in the UI.

1. Implementation Blueprint:

Interactive Recorder Canvas: The screen drawing tracker must capture raw coordinates in temporary memory during pointer actions:


$$\text{Points} = [p_0, p_1, \dots, p_{M-1}]$$

Export Action: A floating UI panel must include a button labeled "Export Drawn Shape".

Stringification Output: Clicking the button converts the captured coordinates to a clean JSON string, prints it to the console, and exposes it in a copyable text area:

function exportActiveStroke() {
  const jsonOutput = JSON.stringify(playerStrokePoints);
  console.log("[SANDBOX:EXPORT] Template generated:", jsonOutput); 
  document.getElementById("export-box").value = jsonOutput;
}


Integrate & Deploy: The designer draws the shape on screen, clicks "Export", and copies the printed array directly into GAME_CONFIG.TEMPLATES in src/config.js.

D. Automated Testing Blueprint

Core state transitions must be backed by a clean test suite (using frameworks like Jest or Vitest) checking the following boundary scenarios:

// Example Test Cases for Junior Developers
describe("Viking Raid Sentry - Core Rules & Math Tests", () => {
  test("Score calculation applies wave and precision multipliers correctly", () => {
    const score = calculateScore(1, false); // Wave 1, standard hit
    expect(score).toBe(100);

    const wave3PrecisionScore = calculateScore(3, true); // Wave 3, high precision hit
    expect(wave3PrecisionScore).toBe(350); // (100 * 3) + 50
  });

  test("Speed math escalates predictably according to GDD multipliers", () => {
    const speedW1 = calculateShipSpeed(1); // Wave 1
    const speedW2 = calculateShipSpeed(2); // Wave 2
    const speedW3 = calculateShipSpeed(3); // Wave 3

    expect(speedW2).toBeCloseTo(46);  // 40 * 1.15
    expect(speedW3).toBeCloseTo(55.2); // 46 * 1.20
  });

  test("Ships crossing the damage perimeter correctly trigger hit point reduction", () => {
    let mockState = { health: 3, gameOver: false };
    mockState = handleShipBreach(mockState);
    expect(mockState.health).toBe(2);
    expect(mockState.gameOver).toBe(false);

    // Drain remaining HP
    mockState = handleShipBreach(mockState);
    mockState = handleShipBreach(mockState);
    expect(mockState.health).toBe(0);
    expect(mockState.gameOver).toBe(true);
  });
});


E. Automated Diagnostics

Before confirming a successful local deployment, developers must check:

Is the bundler compiling files without errors?

Are all Unit tests passing cleanly?

If sandbox limitations prevent running a live local development server directly in this current container environment, the developer is advised to spin up the server locally on their host machine using:
npm install && npm run dev