export const GAME_CONFIG = {
  PLAYFIELD: {
    VIRTUAL_WIDTH: 800,
    VIRTUAL_HEIGHT: 450,
    SAFE_TOP_PADDING: 58,
    DEFENSE_LINE_X: 92,
    DAMAGE_PERIMETER_X: 110,
    DRAGON_X: 48,
    DRAGON_RADIUS: 15,
    DRAGON_POSITIONS: {
      Fire: { x: 35, y: 94 },
      Wind: { x: 77, y: 94 },
      Earth: { x: 35, y: 151 },
      Water: { x: 77, y: 151 },
      Plant: { x: 35, y: 208 },
      Metal: { x: 77, y: 208 },
      Energy: { x: 35, y: 265 },
      Void: { x: 77, y: 265 },
      Light: { x: 35, y: 322 },
      Shadow: { x: 77, y: 322 },
      Prism: { x: 56, y: 379 }
    },
    ACTIVE_DRAGON_POSITIONS: [
      { x: 48, y: 112 },
      { x: 48, y: 176 },
      { x: 48, y: 240 },
      { x: 48, y: 304 },
      { x: 48, y: 368 }
    ],
    SHIP_WIDTH: 96,
    SHIP_HEIGHT: 64,
    SHIP_BADGE_RADIUS: 13,
    SHIP_SPAWN_X: 850,
    SHIP_MIN_Y: 92,
    SHIP_MAX_Y: 390,
    STATIC_SHIP_SLOTS: [
      { id: "ship-slot-1", x: 300, y: 162 },
      { id: "ship-slot-2", x: 475, y: 95 },
      { id: "ship-slot-3", x: 570, y: 294 },
      { id: "ship-slot-4", x: 680, y: 228 },
      { id: "ship-slot-5", x: 390, y: 360 }
    ]
  },

  HEALTH: {
    INITIAL_HEALTH: 3
  },

  WAVES: {
    WAVE_1_SHIP_COUNT: 5,
    WAVE_2_SHIP_COUNT: 8,
    WAVE_3_SHIP_COUNT: 12,
    WAVE_AFTER_3_SHIP_INCREMENT: 1,
    WAVE_ELEMENT_COUNT: 5,
    BASE_SHIP_SPEED: 40,
    WAVE_2_SPEED_MULTIPLIER: 0.15,
    WAVE_SCALING_MULTIPLIER: 0.2,
    WAVE_TRANSITION_DELAY_MS: 3000,
    WAVE_SELECTION_HIGHLIGHT_INTERVAL_MS: 120,
    WAVE_SELECTION_LOCK_IN_MS: 650,
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
    // SANDBOX_TEMPLATES_START
    TEMPLATES: {
      Fire: [
        [0, 85.44],
        [49.7, 23.53],
        [100, 85.34],
        [0, 85.44]
      ],
      Wind: [
        [15, 20],
        [50, 85],
        [85, 20]
      ],
      Earth: [
        [15, 75],
        [35, 35],
        [55, 75],
        [75, 35],
        [90, 75]
      ],
      Water: [
        [10, 60],
        [30, 35],
        [50, 60],
        [70, 85],
        [90, 60]
      ],
      Plant: [
        [49.15, 89.59],
        [50, 15],
        [17.26, 33.65],
        [84.3, 32.99],
        [50, 15]
      ],
      Metal: [
        [20, 25],
        [80, 25],
        [65, 50],
        [80, 75],
        [20, 75],
        [35, 50],
        [20, 25]
      ],
      Energy: [
        [62, 10],
        [35, 48],
        [58, 48],
        [38, 90]
      ],
      Void: [
        [72, 25],
        [35, 25],
        [35, 70],
        [75, 70]
      ],
      Light: [
        [50, 10],
        [85, 30],
        [85, 70],
        [50, 90],
        [15, 70],
        [15, 30],
        [50, 10]
      ],
      Shadow: [
        [20, 20],
        [80, 20],
        [65, 50],
        [80, 80],
        [20, 80]
      ],
      Prism: [
        [50, 10],
        [90, 50],
        [50, 90],
        [10, 50]
      ]
    }
    // SANDBOX_TEMPLATES_END
  },

  ELEMENTS: {
    Fire: {
      label: "F",
      color: "#ff9166"
    },
    Wind: {
      label: "W",
      color: "#77d8ff"
    },
    Earth: {
      label: "E",
      color: "#c4934b"
    },
    Water: {
      label: "A",
      color: "#3aa6ff"
    },
    Plant: {
      label: "P",
      color: "#78d64b"
    },
    Metal: {
      label: "M",
      color: "#b7bec8"
    },
    Energy: {
      label: "N",
      color: "#f0d537"
    },
    Void: {
      label: "V",
      color: "#9b4bb3"
    },
    Light: {
      label: "L",
      color: "#f2e9bd"
    },
    Shadow: {
      label: "S",
      color: "#d2d5da"
    },
    Prism: {
      label: "R",
      color: "#9aaeff"
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
      SHIP_FLAG: "#f7ead0",
      SHIP_FLAG_BORDER: "#5b4632",
      SHIP_FLAG_GUIDE: "rgba(17, 24, 39, 0.35)",
      TEXT: "#eff6ff",
      MUTED_TEXT: "#aab8c7",
      SELECTION_BACKDROP: "rgba(6, 12, 24, 0.74)",
      SELECTION_PANEL: "rgba(9, 16, 30, 0.94)",
      SELECTION_ACTIVE: "rgba(0, 255, 204, 0.2)",
      SELECTION_SCAN: "rgba(247, 215, 116, 0.3)",
      FAILURE: "#ff6b6b",
      LASER_CORE: "#fff7cc",
      LASER_GLOW: "rgba(255, 229, 129, 0.42)"
    },
    BACKGROUND_GRID_STEP: 40,
    DEFENSE_LINE_DASH: [8, 8],
    DEFENSE_LABEL_Y: 72,
    SHIP_BADGE_OFFSET_Y: 28,
    SHIP_NOSE_WIDTH: 16,
    SHIP_VARIANT_PATHS: ["/ships/ship-base-1.png", "/ships/ship-base-2.png", "/ships/ship-base-3.png"],
    SHIP_FLAG_OFFSET_X: -4,
    SHIP_FLAG_OFFSET_Y: -18,
    SHIP_FLAG_WIDTH: 42,
    SHIP_FLAG_HEIGHT: 26,
    SHIP_FLAG_PADDING: 5,
    SHIP_GLYPH_STROKE_WIDTH: 3,
    SHIP_GLYPH_DOT_RADIUS: 2,
    SHIP_GLYPH_ANIMATION_MS: 1600,
    SHIP_GLYPH_REST_MS: 500,
    SELECTION_DIALOG_WIDTH: 500,
    SELECTION_DIALOG_HEIGHT: 320,
    SELECTION_DIALOG_TOP: 74,
    SELECTION_GRID_COLUMNS: 4,
    SELECTION_TILE_WIDTH: 104,
    SELECTION_TILE_HEIGHT: 64,
    SELECTION_TILE_GAP: 10,
    SELECTION_TILE_RADIUS: 8,
    SELECTION_TITLE_Y: 118,
    SELECTION_SUBTITLE_Y: 142,
    SELECTION_GRID_TOP: 162,
    LASER_DURATION_MS: 240,
    LASER_WIDTH: 5,
    LASER_GLOW_WIDTH: 13,
    DAMAGE_FLASH_DURATION_MS: 220,
    FEEDBACK_DURATION_MS: 1200,
    CANVAS_BORDER_WIDTH: 1,
    HUD_HEART: "♥"
  },

  UI: {
    STAGE_ASPECT_RATIO: 16 / 9,
    SHELL_PADDING_PX: 14,
    HUD_HEIGHT_PX: 44,
    HUD_GAP_PX: 10,
    PANEL_RADIUS_PX: 8,
    PANEL_BORDER_WIDTH_PX: 1,
    BUTTON_RADIUS_PX: 6,
    TEMPLATE_PREVIEW_SCALE: 0.85,
    TEMPLATE_POINT_HIT_RADIUS: 28,
    TEMPLATE_POINT_SNAP_DISTANCE: 4,
    TEMPLATE_MAX_POINTS: 7,
    MAX_DELTA_SECONDS: 0.05,
    SANDBOX_WIDTH_PX: 310,
    SANDBOX_TEXTAREA_HEIGHT_PX: 150,
    SANDBOX_OFFSET_PX: 14,
    FONT_FAMILY: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  },

  LOGGING: {
    DRAW_LOG_SAMPLE_INTERVAL_MS: 120
  }
};
