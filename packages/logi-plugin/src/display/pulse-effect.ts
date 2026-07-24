import { PULSE_NORMAL_PERIOD_MS, PULSE_URGENT_PERIOD_MS, PULSE_MIN_BRIGHTNESS, PULSE_MAX_BRIGHTNESS } from '@mxkiro/shared';

type BrightnessCallback = (brightness: number) => void;

/**
 * Pulse Effect — sinusoidal brightness modulation for LCD buttons.
 * Used when Kiro is waiting for user input.
 */
export class PulseEffect {
  private timer: ReturnType<typeof setInterval> | null = null;
  private callback: BrightnessCallback | null = null;
  private startTime = 0;
  private periodMs = PULSE_NORMAL_PERIOD_MS;

  onBrightness(callback: BrightnessCallback): void {
    this.callback = callback;
  }

  /**
   * Start pulsing at normal speed.
   */
  startNormal(): void {
    this.start(PULSE_NORMAL_PERIOD_MS);
  }

  /**
   * Start pulsing at urgent speed (fast blinking).
   */
  startUrgent(): void {
    this.start(PULSE_URGENT_PERIOD_MS);
  }

  /**
   * Stop pulsing.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // Reset to full brightness
    this.callback?.(1.0);
  }

  isActive(): boolean {
    return this.timer !== null;
  }

  private start(periodMs: number): void {
    this.stop();
    this.periodMs = periodMs;
    this.startTime = Date.now();

    // Update at 30fps for smooth pulse
    this.timer = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const phase = (elapsed % this.periodMs) / this.periodMs;

      // Sinusoidal: goes from min → max → min
      const sinValue = Math.sin(phase * Math.PI * 2);
      const normalized = (sinValue + 1) / 2; // 0 to 1
      const brightness = PULSE_MIN_BRIGHTNESS + normalized * (PULSE_MAX_BRIGHTNESS - PULSE_MIN_BRIGHTNESS);

      this.callback?.(brightness);
    }, 33); // ~30fps
  }
}
