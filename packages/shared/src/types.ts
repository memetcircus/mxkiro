// --- Kiro State Machine ---

export enum KiroState {
  IDLE = 'idle',
  WORKING = 'working',
  WAITING = 'waiting',
  ERROR = 'error',
  SUCCESS = 'success',
}

// --- Animation Types ---

export enum AnimationType {
  GHOST_WALK = 'ghost_walk',
  FIRE = 'fire',
  CELEBRATION = 'celebration',
  THINKING = 'thinking',
  ERROR = 'error',
  PULSE = 'pulse',
}

// --- Ghost Face Expressions ---

export enum GhostExpression {
  NORMAL = 'normal',
  THINKING = 'thinking',
  HAPPY = 'happy',
  SURPRISED = 'surprised',
  ANGRY = 'angry',
  SLEEPY = 'sleepy',
  ERROR = 'error',
}

// --- Button Configuration ---

export type ButtonType = 'skill' | 'steering' | 'shortcut' | 'command';

export interface ButtonConfig {
  index: number;
  type: ButtonType;
  value: string;
  label: string;
  icon?: string;
}

export interface PageConfig {
  name: string;
  buttons: ButtonConfig[];
}

// --- Session Info ---

export interface SessionInfo {
  id: string;
  name: string;
  tokenCount: number;
  messageCount: number;
  createdAt: string;
  lastActivity: string;
}

// --- Session Health ---

export enum HealthLevel {
  NORMAL = 'normal',
  WORRIED = 'worried',
  CRITICAL = 'critical',
}

export interface SessionHealth {
  tokenCount: number;
  messageCount: number;
  durationMinutes: number;
  level: HealthLevel;
}
