export const GAME_CONFIG = {
  PLAYFIELD: {
    VIRTUAL_WIDTH: 800,
    VIRTUAL_HEIGHT: 450,
    SAFE_TOP_PADDING: 58,
    DEFENSE_LINE_X: 92,
    DAMAGE_PERIMETER_X: 110,
    DRAGON_X: 48,
    DRAGON_Y_POSITIONS: [120, 225, 330],
    DRAGON_RADIUS: 22,
    SHIP_WIDTH: 58,
    SHIP_HEIGHT: 30,
    SHIP_BADGE_RADIUS: 13,
    STATIC_SHIPS: [
      { id: "ship-fire-close", x: 300, y: 162, weakness: "Fire" },
      { id: "ship-wind", x: 475, y: 95, weakness: "Wind" },
      { id: "ship-earth", x: 570, y: 294, weakness: "Earth" },
      { id: "ship-fire-far", x: 680, y: 228, weakness: "Fire" }
    ]
  },

  HEALTH: {
    INITIAL_HEALTH: 3
  },

  WAVES: {
    WAVE_1_SHIP_COUNT: 5,
    BASE_SHIP_SPEED: 40,
    WAVE_2_SPEED_MULTIPLIER: 0.15,
    WAVE_SCALING_MULTIPLIER: 0.2,
    WAVE_TRANSITION_DELAY_MS: 3000,
    MIN_SPAWN_INTERVAL_MS: 1500,
    MAX_SPAWN_INTERVAL_MS: 3000
  },

  SCORE: {
    BASE_SCORE_PER_KILL: 100,
    PRECISION_BONUS_SCORE: 50
  },

  GESTURES: {
    TRAIL_FADE_DURATION_MS: 500,
    TRAIL_COLOR: "#00ffcc",
    TRAIL_WIDTH: 4,
    GESTURE_ACCEPTANCE_THRESHOLD: 0.75,
    GESTURE_PRECISION_THRESHOLD: 0.85,
    GESTURE_RESAMPLE_POINTS: 64,
    MIN_STROKE_POINTS: 2,
    DOLLAR_SQUARE_SIZE: 250,
    DOLLAR_ORIGIN: { x: 0, y: 0 },
    DOLLAR_ANGLE_RANGE_RADIANS: Math.PI / 4,
    DOLLAR_ANGLE_PRECISION_RADIANS: Math.PI / 90,
    DOLLAR_GOLDEN_RATIO_HALF: 0.5 * (-1 + Math.sqrt(5)),
    TEMPLATES: {
      Wind: [
        [0, 0],
        [50, 100],
        [100, 0]
      ],
      Earth: [
        [0, 50],
        [100, 50]
      ],
      Fire: [
        [10, 90],
        [50, 10],
        [90, 90],
        [10, 90]
      ]
    }
  },

  ELEMENTS: {
    Wind: {
      label: "W",
      dragonIndex: 0,
      color: "#77d8ff"
    },
    Earth: {
      label: "E",
      dragonIndex: 1,
      color: "#76d467"
    },
    Fire: {
      label: "F",
      dragonIndex: 2,
      color: "#ff9166"
    }
  },

  RENDER: {
    COLORS: {
      PAGE_BACKGROUND: "#111827",
      PANEL_BACKGROUND: "rgba(9, 16, 30, 0.78)",
      PLAYFIELD_TOP: "#1c3442",
      PLAYFIELD_BOTTOM: "#13242e",
      GRID_LINE: "rgba(255, 255, 255, 0.055)",
      DEFENSE_LINE: "#f7d774",
      DRAGON_FILL: "#2ed3a2",
      DRAGON_STROKE: "#d8fff1",
      SHIP_FILL: "#8a939d",
      SHIP_STROKE: "#e7edf4",
      SHIP_WINDOW: "#28323f",
      TEXT: "#eff6ff",
      MUTED_TEXT: "#aab8c7",
      FAILURE: "#ff6b6b",
      LASER_CORE: "#fff7cc",
      LASER_GLOW: "rgba(255, 229, 129, 0.42)"
    },
    BACKGROUND_GRID_STEP: 40,
    DEFENSE_LINE_DASH: [8, 8],
    DEFENSE_LABEL_Y: 72,
    SHIP_BADGE_OFFSET_Y: 28,
    SHIP_NOSE_WIDTH: 16,
    LASER_DURATION_MS: 240,
    LASER_WIDTH: 5,
    LASER_GLOW_WIDTH: 13,
    FEEDBACK_DURATION_MS: 1200,
    CANVAS_BORDER_WIDTH: 1,
    HUD_HEART: "♥"
  },

  UI: {
    MAX_GAME_WIDTH_PX: 1100,
    SHELL_PADDING_PX: 14,
    HUD_HEIGHT_PX: 44,
    HUD_GAP_PX: 10,
    PANEL_RADIUS_PX: 8,
    PANEL_BORDER_WIDTH_PX: 1,
    BUTTON_RADIUS_PX: 6,
    SANDBOX_WIDTH_PX: 310,
    SANDBOX_TEXTAREA_HEIGHT_PX: 150,
    SANDBOX_OFFSET_PX: 14,
    FONT_FAMILY: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  },

  LOGGING: {
    DRAW_LOG_SAMPLE_INTERVAL_MS: 120
  }
};
