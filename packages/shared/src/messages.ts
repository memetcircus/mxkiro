import { AnimationType, ButtonConfig, KiroState, SessionInfo } from './types.js';

// --- Plugin → Bridge Messages ---

export interface ButtonPressMessage {
  type: 'button_press';
  buttonIndex: number;
  page: number;
}

export interface PageChangeMessage {
  type: 'page_change';
  direction: 'next' | 'prev';
}

export interface DialRotateMessage {
  type: 'dial_rotate';
  ticks: number; // positive = clockwise, negative = counter-clockwise
}

export interface DialClickMessage {
  type: 'dial_click';
}

export interface RollerRotateMessage {
  type: 'roller_rotate';
  ticks: number;
}

export interface ResponseMessage {
  type: 'response';
  value: string;
}

export interface CancelMessage {
  type: 'cancel';
}

export interface AutopilotToggleMessage {
  type: 'autopilot_toggle';
}

export type PluginToBridgeMessage =
  | ButtonPressMessage
  | PageChangeMessage
  | DialRotateMessage
  | DialClickMessage
  | RollerRotateMessage
  | ResponseMessage
  | CancelMessage
  | AutopilotToggleMessage;

// --- Bridge → Plugin Messages ---

export interface StateChangeMessage {
  type: 'state_change';
  state: KiroState;
  options?: string[]; // for WAITING state
  message?: string;
}

export interface UpdateButtonsMessage {
  type: 'update_buttons';
  buttons: ButtonConfig[];
  page: number;
}

export interface ShowAnimationMessage {
  type: 'show_animation';
  animation: AnimationType;
  duration?: number;
}

export interface SessionLoadedMessage {
  type: 'session_loaded';
  session: SessionInfo;
  index: number;
  total: number;
}

export interface ModelChangedMessage {
  type: 'model_changed';
  modelId: string;
  modelName: string;
}

export interface SessionHealthMessage {
  type: 'session_health';
  tokenCount: number;
  messageCount: number;
  level: string;
}

export type BridgeToPluginMessage =
  | StateChangeMessage
  | UpdateButtonsMessage
  | ShowAnimationMessage
  | SessionLoadedMessage
  | ModelChangedMessage
  | SessionHealthMessage;
