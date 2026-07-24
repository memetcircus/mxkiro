// --- Bridge Service ---

export const BRIDGE_PORT = 9847;
export const BRIDGE_HOST = 'localhost';
export const BRIDGE_WS_URL = `ws://${BRIDGE_HOST}:${BRIDGE_PORT}`;
export const BRIDGE_HTTP_URL = `http://${BRIDGE_HOST}:${BRIDGE_PORT}`;

// --- LCD Grid ---

export const LCD_GRID_COLS = 3;
export const LCD_GRID_ROWS = 3;
export const LCD_BUTTON_COUNT = LCD_GRID_COLS * LCD_GRID_ROWS; // 9
export const LCD_TILE_SIZE = 120; // pixels per tile
export const LCD_CANVAS_SIZE = LCD_TILE_SIZE * LCD_GRID_COLS; // 360px

// --- Animation ---

export const GHOST_ANIMATION_FPS = 12;
export const GHOST_ANIMATION_FRAMES = 30;
export const GHOST_ANIMATION_DURATION_MS = (GHOST_ANIMATION_FRAMES / GHOST_ANIMATION_FPS) * 1000;

export const PULSE_NORMAL_PERIOD_MS = 2000;
export const PULSE_URGENT_PERIOD_MS = 500;
export const PULSE_MIN_BRIGHTNESS = 0.3;
export const PULSE_MAX_BRIGHTNESS = 1.0;

// --- Session Health Thresholds ---

export const HEALTH_WARN_TOKENS = 30_000;
export const HEALTH_ALERT_TOKENS = 50_000;
export const HEALTH_CRITICAL_TOKENS = 70_000;

// --- Models ---

export const AVAILABLE_MODELS = [
  { id: 'auto', name: 'Auto', shortName: 'Auto' },
  { id: 'claude-opus-4', name: 'Claude Opus 4', shortName: 'Opus' },
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', shortName: 'Sonnet' },
  { id: 'claude-haiku-4', name: 'Claude Haiku 4', shortName: 'Haiku' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', shortName: 'DS-V3' },
] as const;
