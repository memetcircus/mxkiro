import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ASSETS_PATH } from '@logitech/plugin-sdk';
import {
  GHOST_ANIMATION_FPS,
  GHOST_ANIMATION_FRAMES,
  LCD_BUTTON_COUNT,
} from '@mxkiro/shared';

type FrameCallback = (tiles: Buffer[], frameIndex: number) => void;

/**
 * Animation Engine — manages timed frame playback for LCD grid.
 * Loads pre-rendered tile PNGs and cycles through them at a fixed FPS.
 */
export class AnimationEngine {
  private timer: ReturnType<typeof setInterval> | null = null;
  private currentFrame = 0;
  private frameCallback: FrameCallback | null = null;
  private tiles: Map<string, Buffer[][]> = new Map(); // animation name → frames → tiles

  /**
   * Pre-load all tiles for an animation into memory.
   */
  loadAnimation(name: string, frameCount: number): void {
    const frames: Buffer[][] = [];
    const basePath = join(ASSETS_PATH ?? 'assets/sprites', 'tiles', name);

    for (let frame = 0; frame < frameCount; frame++) {
      const frameTiles: Buffer[] = [];
      for (let tile = 0; tile < LCD_BUTTON_COUNT; tile++) {
        const filePath = join(basePath, `frame-${String(frame).padStart(2, '0')}-tile-${tile}.png`);
        if (existsSync(filePath)) {
          frameTiles.push(readFileSync(filePath));
        } else {
          // Empty tile (transparent)
          frameTiles.push(Buffer.alloc(0));
        }
      }
      frames.push(frameTiles);
    }

    this.tiles.set(name, frames);
    console.log(`🎬 Loaded animation "${name}": ${frameCount} frames`);
  }

  /**
   * Set callback for when a new frame should be displayed.
   */
  onFrame(callback: FrameCallback): void {
    this.frameCallback = callback;
  }

  /**
   * Start playing an animation in a loop.
   */
  play(animationName: string, fps: number = GHOST_ANIMATION_FPS): void {
    this.stop();

    const frames = this.tiles.get(animationName);
    if (!frames || frames.length === 0) {
      console.warn(`⚠️ Animation "${animationName}" not loaded`);
      return;
    }

    this.currentFrame = 0;
    const intervalMs = Math.round(1000 / fps);

    this.timer = setInterval(() => {
      const tiles = frames[this.currentFrame];
      if (tiles) {
        this.frameCallback?.(tiles, this.currentFrame);
      }
      this.currentFrame = (this.currentFrame + 1) % frames.length;
    }, intervalMs);
  }

  /**
   * Stop the current animation.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.currentFrame = 0;
  }

  /**
   * Check if an animation is currently playing.
   */
  isPlaying(): boolean {
    return this.timer !== null;
  }
}
