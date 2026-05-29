const DRAGON_IMAGE_PATHS = {
  Fire: new URL("./assets/dragons/Fire_Fire_Dragon.png", import.meta.url).href,
  Wind: new URL("./assets/dragons/Wind_Wind_Dragon.png", import.meta.url).href,
  Earth: new URL("./assets/dragons/Earth_Earth_Dragon.png", import.meta.url).href,
  Water: new URL("./assets/dragons/Water_Water_Dragon.png", import.meta.url).href,
  Plant: new URL("./assets/dragons/Plant_Plant_Dragon.png", import.meta.url).href,
  Metal: new URL("./assets/dragons/Metal_Metal_Dragon.png", import.meta.url).href,
  Energy: new URL("./assets/dragons/Energy_Energy_Dragon.png", import.meta.url).href,
  Void: new URL("./assets/dragons/Void_Void_Dragon.png", import.meta.url).href,
  Light: new URL("./assets/dragons/Light_Light_Dragon.png", import.meta.url).href,
  Shadow: new URL("./assets/dragons/Shadow_Shadow_Dragon.png", import.meta.url).href,
  Prism: new URL("./assets/dragons/Prism_Cosmic_Prism_Dragon.png", import.meta.url).href
};
const PUBLIC_ASSET_BASE = import.meta.env?.BASE_URL ?? "/";
const PUBLIC_ASSET_PATHS = {
  cursor: `${PUBLIC_ASSET_BASE}ui/crosshair-blue.png`,
  button: `${PUBLIC_ASSET_BASE}ui/button-long-blue.png`,
  music: `${PUBLIC_ASSET_BASE}audio/dragon-defense-loop.ogg`,
  strike: `${PUBLIC_ASSET_BASE}audio/dragon-strike.ogg`,
  burst: `${PUBLIC_ASSET_BASE}audio/ship-burst.ogg`,
  click: `${PUBLIC_ASSET_BASE}audio/ui-click.ogg`,
  runEnd: `${PUBLIC_ASSET_BASE}audio/run-end.ogg`,
  effectMuzzle: `${PUBLIC_ASSET_BASE}effects/muzzle.png`,
  effectMagicRing: `${PUBLIC_ASSET_BASE}effects/magic-ring.png`,
  effectBolt: `${PUBLIC_ASSET_BASE}effects/bolt.png`,
  effectExplosion1: `${PUBLIC_ASSET_BASE}effects/explosion-1.png`,
  effectExplosion2: `${PUBLIC_ASSET_BASE}effects/explosion-2.png`,
  effectExplosion3: `${PUBLIC_ASSET_BASE}effects/explosion-3.png`,
  habitatHouse: `${PUBLIC_ASSET_BASE}habitat/house.png`,
  habitatPalm: `${PUBLIC_ASSET_BASE}habitat/palm.png`,
  habitatTree: `${PUBLIC_ASSET_BASE}habitat/tree.png`,
  habitatCannonball: `${PUBLIC_ASSET_BASE}habitat/cannonball.png`,
  habitatFire1: `${PUBLIC_ASSET_BASE}habitat/fire-1.png`,
  habitatFire2: `${PUBLIC_ASSET_BASE}habitat/fire-2.png`
};

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
    BASE_SHIP_COUNT: 5,
    SHIP_COUNT_INCREMENT: 4,
    WAVE_ELEMENT_COUNT: 5,
    BASE_SHIP_SPEED: 40,
    SPEED_GROWTH_MULTIPLIER: 0.15,
    WAVE_TRANSITION_DELAY_MS: 3000,
    WAVE_CLEAR_VFX_DELAY_MS: 900,
    WAVE_SELECTION_HIGHLIGHT_INTERVAL_MS: 120,
    WAVE_SELECTION_LOCK_IN_MS: 650,
    BASE_MIN_SPAWN_INTERVAL_MS: 1500,
    BASE_MAX_SPAWN_INTERVAL_MS: 3000,
    SPAWN_INTERVAL_DECAY: 0.92,
    MIN_SPAWN_INTERVAL_FLOOR_MS: 650,
    MAX_SPAWN_INTERVAL_FLOOR_MS: 1300
  },

  SCORE: {
    BASE_SCORE_PER_KILL: 100,
    PRECISION_BONUS_SCORE: 50,
    HIGH_SCORE_LIMIT: 5
  },

  GESTURES: {
    TRAIL_FADE_DURATION_MS: 500,
    TRAIL_COLOR: "#00ffcc",
    TRAIL_WIDTH: 4,
    GESTURE_ACCEPTANCE_THRESHOLD: 0.75,
    GESTURE_AMBIGUITY_MARGIN: 0.1,
    GESTURE_PRECISION_THRESHOLD: 0.80,
    GESTURE_RESAMPLE_POINTS: 64,
    MIN_STROKE_POINTS: 2,
    DOLLAR_SQUARE_SIZE: 250,
    DOLLAR_ORIGIN: { x: 0, y: 0 },
    DOLLAR_ROTATION_INVARIANT: false,
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
      PLAYFIELD_TOP: "#1f7fa2",
      PLAYFIELD_BOTTOM: "#0f506b",
      GRID_LINE: "rgba(213, 244, 255, 0.075)",
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
    CURSOR_IMAGE_PATH: PUBLIC_ASSET_PATHS.cursor,
    BUTTON_IMAGE_PATH: PUBLIC_ASSET_PATHS.button,
    DEFENSE_LINE_DASH: [8, 8],
    SHIP_BADGE_OFFSET_Y: 28,
    SHIP_NOSE_WIDTH: 16,
    SHIP_VARIANT_PATHS: [
      `${PUBLIC_ASSET_BASE}ships/ship-base-1.png`,
      `${PUBLIC_ASSET_BASE}ships/ship-base-2.png`,
      `${PUBLIC_ASSET_BASE}ships/ship-base-3.png`
    ],
    SHIP_FLAG_OFFSET_X: -4,
    SHIP_FLAG_OFFSET_Y: -18,
    SHIP_FLAG_WIDTH: 42,
    SHIP_FLAG_HEIGHT: 26,
    SHIP_FLAG_PADDING: 5,
    SHIP_GLYPH_STROKE_WIDTH: 3,
    SHIP_GLYPH_DOT_RADIUS: 2,
    SHIP_GLYPH_ANIMATION_MS: 1600,
    SHIP_GLYPH_REST_MS: 500,
    DRAGON_IMAGE_PATHS,
    HABITAT_IMAGE_PATHS: {
      house: PUBLIC_ASSET_PATHS.habitatHouse,
      palm: PUBLIC_ASSET_PATHS.habitatPalm,
      tree: PUBLIC_ASSET_PATHS.habitatTree,
      cannonball: PUBLIC_ASSET_PATHS.habitatCannonball,
      fire1: PUBLIC_ASSET_PATHS.habitatFire1,
      fire2: PUBLIC_ASSET_PATHS.habitatFire2
    },
    EFFECT_IMAGE_PATHS: {
      muzzle: PUBLIC_ASSET_PATHS.effectMuzzle,
      magicRing: PUBLIC_ASSET_PATHS.effectMagicRing,
      bolt: PUBLIC_ASSET_PATHS.effectBolt,
      explosionFrames: [
        PUBLIC_ASSET_PATHS.effectExplosion1,
        PUBLIC_ASSET_PATHS.effectExplosion2,
        PUBLIC_ASSET_PATHS.effectExplosion3
      ]
    },
    DRAGON_IMAGE_SIZE: 46,
    DRAGON_SELECTION_IMAGE_SIZE: 32,
    DRAGON_IDLE_BOB_PX: 3,
    DRAGON_IDLE_SWAY_RADIANS: 0.06,
    DRAGON_ATTACK_LUNGE_PX: 18,
    DRAGON_ATTACK_LIFT_PX: 6,
    DRAGON_ATTACK_SCALE: 0.2,
    DRAGON_ATTACK_AURA_RADIUS: 34,
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
    LASER_DURATION_MS: 680,
    LASER_WIDTH: 6,
    LASER_GLOW_WIDTH: 18,
    LASER_IMPACT_RADIUS: 36,
    LASER_PARTICLE_COUNT: 24,
    LASER_PARTICLE_DISTANCE: 48,
    LASER_MUZZLE_RADIUS: 22,
    EXPLOSION_DURATION_MS: 900,
    EXPLOSION_RING_RADIUS: 54,
    EXPLOSION_PARTICLE_COUNT: 34,
    EXPLOSION_PARTICLE_DISTANCE: 72,
    DAMAGE_FLASH_DURATION_MS: 220,
    FEEDBACK_DURATION_MS: 1200,
    CANVAS_BORDER_WIDTH: 1,
    HUD_HEART: "♥"
  },

  AUDIO: {
    MUSIC: PUBLIC_ASSET_PATHS.music,
    SFX: {
      strike: PUBLIC_ASSET_PATHS.strike,
      burst: PUBLIC_ASSET_PATHS.burst,
      click: PUBLIC_ASSET_PATHS.click,
      reject: PUBLIC_ASSET_PATHS.click,
      runEnd: PUBLIC_ASSET_PATHS.runEnd
    },
    VOLUMES: {
      MUSIC: 0.98,
      SFX: 0.45,
      STRIKE: 0.1,
      BURST: 0.2,
      CLICK: 0.28,
      REJECT: 0.22,
      RUNEND: 0.42
    },
    STRIKE_BURST_DELAY_MS: 90
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
