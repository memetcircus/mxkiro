import { KiroState } from '@mxkiro/shared';

type StateChangeCallback = (newState: KiroState, oldState: KiroState) => void;

/**
 * Manages the current Kiro state and notifies listeners on changes.
 * Controls what's displayed on LCD buttons.
 */
export class KiroStateMachine {
  private state: KiroState = KiroState.IDLE;
  private listeners: StateChangeCallback[] = [];
  private waitingOptions: string[] = [];

  getState(): KiroState {
    return this.state;
  }

  getWaitingOptions(): string[] {
    return this.waitingOptions;
  }

  onChange(callback: StateChangeCallback): void {
    this.listeners.push(callback);
  }

  transition(newState: KiroState, options?: string[]): void {
    if (newState === this.state) return;

    const oldState = this.state;
    this.state = newState;
    this.waitingOptions = options ?? [];

    for (const listener of this.listeners) {
      listener(newState, oldState);
    }
  }

  isIdle(): boolean {
    return this.state === KiroState.IDLE;
  }

  isWorking(): boolean {
    return this.state === KiroState.WORKING;
  }

  isWaiting(): boolean {
    return this.state === KiroState.WAITING;
  }
}
