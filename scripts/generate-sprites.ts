/**
 * Sprite Generator — Creates all PNG assets for MX Creative Console LCD buttons.
 * 
 * Generates:
 * - Ghost walk animation frames (30 frames)
 * - Ghost face expression variants
 * - Fire/burning animation frames
 * - Button background templates
 * 
 * Run: npx tsx scripts/generate-sprites.ts
 */

import { createCanvas, loadImage, CanvasRenderingContext2D } from 'canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CANVAS_SIZE = 360; // 3x3 grid, each tile 120px
const TILE_SIZE = 120;
const FRAME_COUNT = 30;
const OUTPUT_DIR = join(import.meta.dirname, '..', 'assets', 'sprites');

// Ensure output directories exist
mkdirSync(join(OUTPUT_DIR, 'ghost-walk'), { recursive: true });
mkdirSync(join(OUTPUT_DIR, 'ghost-faces'), { recursive: true });
mkdirSync(join(OUTPUT_DIR, 'fire'), { recursive: true });
mkdirSync(join(OUTPUT_DIR, 'tiles', 'ghost-walk'), { recursive: true });
mkdirSync(join(OUTPUT_DIR, 'tiles', 'fire'), { recursive: true });

// --- Color Palette ---
const COLORS = {
  purple: '#7C3AED',
  purpleDark: '#5B21B6',
  purpleLight: '#A78BFA',
  white: '#FFFFFF',
  black: '#000000',
  ghostShadow: 'rgba(0, 0, 0, 0.1)',
  fireOrange: '#F97316',
  fireRed: '#DC2626',
  fireYellow: '#FDE047',
};


// --- Ghost Drawing ---

function drawGhost(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  expression: 'normal' | 'happy' | 'thinking' | 'surprised' | 'angry' | 'sleepy' = 'normal'
): void {
  const w = size;
  const h = size * 1.1;
  const centerX = x + w / 2;
  const topY = y + size * 0.05;

  // Ghost body
  ctx.fillStyle = COLORS.white;
  ctx.beginPath();

  // Head (rounded top)
  ctx.arc(centerX, topY + w * 0.4, w * 0.4, Math.PI, 0, false);

  // Right side
  ctx.lineTo(centerX + w * 0.4, topY + h * 0.75);

  // Wavy bottom
  const waveCount = 3;
  const waveWidth = (w * 0.8) / waveCount;
  for (let i = 0; i < waveCount; i++) {
    const waveX = centerX + w * 0.4 - i * waveWidth;
    const nextX = waveX - waveWidth;
    const midX = (waveX + nextX) / 2;
    const curveY = i % 2 === 0 ? topY + h * 0.85 : topY + h * 0.72;
    ctx.quadraticCurveTo(midX, curveY, nextX, topY + h * 0.75);
  }

  // Left side
  ctx.lineTo(centerX - w * 0.4, topY + w * 0.4);

  ctx.closePath();
  ctx.fill();

  // Eyes based on expression
  const eyeY = topY + w * 0.38;
  const eyeSpacing = w * 0.12;
  const eyeSize = w * 0.06;

  ctx.fillStyle = COLORS.black;

  switch (expression) {
    case 'normal':
      // Oval eyes
      drawOval(ctx, centerX - eyeSpacing, eyeY, eyeSize * 0.8, eyeSize * 1.2);
      drawOval(ctx, centerX + eyeSpacing, eyeY, eyeSize * 0.8, eyeSize * 1.2);
      break;

    case 'happy':
      // Curved happy eyes (arcs)
      ctx.lineWidth = eyeSize * 0.6;
      ctx.strokeStyle = COLORS.black;
      ctx.beginPath();
      ctx.arc(centerX - eyeSpacing, eyeY, eyeSize, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX + eyeSpacing, eyeY, eyeSize, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
      break;

    case 'thinking':
      // Eyes looking up
      drawOval(ctx, centerX - eyeSpacing, eyeY - eyeSize * 0.5, eyeSize * 0.8, eyeSize * 1.2);
      drawOval(ctx, centerX + eyeSpacing, eyeY - eyeSize * 0.5, eyeSize * 0.8, eyeSize * 1.2);
      break;

    case 'surprised':
      // Big round eyes
      drawCircle(ctx, centerX - eyeSpacing, eyeY, eyeSize * 1.5);
      drawCircle(ctx, centerX + eyeSpacing, eyeY, eyeSize * 1.5);
      break;

    case 'angry':
      // Narrowed eyes
      drawOval(ctx, centerX - eyeSpacing, eyeY, eyeSize * 1.0, eyeSize * 0.5);
      drawOval(ctx, centerX + eyeSpacing, eyeY, eyeSize * 1.0, eyeSize * 0.5);
      break;

    case 'sleepy':
      // Half-closed eyes (lines)
      ctx.lineWidth = eyeSize * 0.6;
      ctx.strokeStyle = COLORS.black;
      ctx.beginPath();
      ctx.moveTo(centerX - eyeSpacing - eyeSize, eyeY);
      ctx.lineTo(centerX - eyeSpacing + eyeSize, eyeY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + eyeSpacing - eyeSize, eyeY);
      ctx.lineTo(centerX + eyeSpacing + eyeSize, eyeY);
      ctx.stroke();
      break;
  }
}

function drawOval(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}


// --- Ghost Walk Animation ---

async function generateGhostWalkFrames(
  iconFile: string,
  bgColor: string,
  outSubdir: string,
): Promise<void> {
  console.log(`👻 Generating ghost walk animation (${outSubdir})...`);

  const ghostIconPath = join(import.meta.dirname, '..', 'assets', iconFile);
  const ghostImg = await loadImage(ghostIconPath);

  // Output dirs
  mkdirSync(join(OUTPUT_DIR, outSubdir), { recursive: true });
  mkdirSync(join(OUTPUT_DIR, 'tiles', outSubdir), { recursive: true });

  const ghostSize = CANVAS_SIZE * 0.75;
  const ghostY = (CANVAS_SIZE - ghostSize) / 2;
  const totalTravel = CANVAS_SIZE + ghostSize;
  const halfFrames = FRAME_COUNT / 2;

  for (let frame = 0; frame < FRAME_COUNT; frame++) {
    const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    // Background (matches icon background exactly)
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const isFirstHalf = frame < halfFrames;
    const localFrame = isFirstHalf ? frame : frame - halfFrames;
    const progress = localFrame / halfFrames;

    // Slight vertical bob
    const bobY = Math.sin(progress * Math.PI * 2) * 6;

    if (isFirstHalf) {
      // First half: ghost enters from LEFT, exits RIGHT (as-is)
      const ghostX = -ghostSize + progress * totalTravel;
      ctx.drawImage(ghostImg, ghostX, ghostY + bobY, ghostSize, ghostSize);
    } else {
      // Second half: ghost enters from RIGHT, exits LEFT (mirrored horizontally)
      const ghostX = CANVAS_SIZE - progress * totalTravel;
      ctx.save();
      ctx.translate(ghostX + ghostSize, ghostY + bobY);
      ctx.scale(-1, 1);
      ctx.drawImage(ghostImg, 0, 0, ghostSize, ghostSize);
      ctx.restore();
    }

    // Save full frame
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(join(OUTPUT_DIR, outSubdir, `frame-${String(frame).padStart(2, '0')}.png`), buffer);

    // Split into 3x3 tiles
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const tileCanvas = createCanvas(TILE_SIZE, TILE_SIZE);
        const tileCtx = tileCanvas.getContext('2d');
        const srcX = col * TILE_SIZE;
        const srcY = row * TILE_SIZE;
        tileCtx.drawImage(canvas, srcX, srcY, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);

        const tileIndex = row * 3 + col;
        const tileBuffer = tileCanvas.toBuffer('image/png', { compressionLevel: 9 });
        writeFileSync(
          join(OUTPUT_DIR, 'tiles', outSubdir, `frame-${String(frame).padStart(2, '0')}-tile-${tileIndex}.png`),
          tileBuffer
        );
      }
    }
  }

  console.log(`   ✅ ${FRAME_COUNT} frames + ${FRAME_COUNT * 9} tiles generated`);
}


// --- Ghost Face Variants ---

function generateGhostFaces(): void {
  console.log('👻 Generating ghost face variants...');

  const expressions: Array<'normal' | 'happy' | 'thinking' | 'surprised' | 'angry' | 'sleepy'> = [
    'normal', 'happy', 'thinking', 'surprised', 'angry', 'sleepy',
  ];

  const ghostSize = CANVAS_SIZE * 0.7;
  const ghostX = (CANVAS_SIZE - ghostSize) / 2;
  const ghostY = (CANVAS_SIZE - ghostSize) / 2;

  for (const expression of expressions) {
    const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    // Purple background
    ctx.fillStyle = COLORS.purple;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawGhost(ctx, ghostX, ghostY, ghostSize, expression);

    const buffer = canvas.toBuffer('image/png');
    writeFileSync(join(OUTPUT_DIR, 'ghost-faces', `${expression}.png`), buffer);
  }

  console.log(`   ✅ ${expressions.length} face variants generated`);
}

// --- Fire Animation ---

function generateFireFrames(): void {
  console.log('🔥 Generating fire animation...');

  const fireFrameCount = 20;

  for (let frame = 0; frame < fireFrameCount; frame++) {
    const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    const progress = frame / fireFrameCount;

    // Dark background with fire gradient
    ctx.fillStyle = '#1a0000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw fire flames (multiple layers)
    const flameCount = 8;
    for (let i = 0; i < flameCount; i++) {
      const flameProgress = (progress + i / flameCount) % 1;
      const flameX = (i / flameCount) * CANVAS_SIZE;
      const flameHeight = CANVAS_SIZE * (0.4 + Math.sin(flameProgress * Math.PI * 2 + i) * 0.3);
      const flameY = CANVAS_SIZE - flameHeight;

      // Flame gradient
      const gradient = ctx.createLinearGradient(flameX, CANVAS_SIZE, flameX, flameY);
      gradient.addColorStop(0, COLORS.fireRed);
      gradient.addColorStop(0.4, COLORS.fireOrange);
      gradient.addColorStop(0.8, COLORS.fireYellow);
      gradient.addColorStop(1, 'rgba(253, 224, 71, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(flameX - 30, CANVAS_SIZE);
      ctx.quadraticCurveTo(
        flameX + Math.sin(flameProgress * Math.PI * 3) * 15,
        flameY,
        flameX + 30,
        CANVAS_SIZE
      );
      ctx.fill();
    }

    // Warning text
    ctx.fillStyle = COLORS.white;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Session çok uzadı!', CANVAS_SIZE / 2, CANVAS_SIZE * 0.35);
    ctx.font = '20px Arial';
    ctx.fillText('Yeni session aç', CANVAS_SIZE / 2, CANVAS_SIZE * 0.45);

    // Save full frame
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(join(OUTPUT_DIR, 'fire', `frame-${String(frame).padStart(2, '0')}.png`), buffer);

    // Split into tiles
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const tileCanvas = createCanvas(TILE_SIZE, TILE_SIZE);
        const tileCtx = tileCanvas.getContext('2d');
        const srcX = col * TILE_SIZE;
        const srcY = row * TILE_SIZE;
        tileCtx.drawImage(canvas, srcX, srcY, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);

        const tileIndex = row * 3 + col;
        const tileBuffer = tileCanvas.toBuffer('image/png');
        writeFileSync(
          join(OUTPUT_DIR, 'tiles', 'fire', `frame-${String(frame).padStart(2, '0')}-tile-${tileIndex}.png`),
          tileBuffer
        );
      }
    }
  }

  console.log(`   ✅ ${fireFrameCount} frames + ${fireFrameCount * 9} tiles generated`);
}


// --- Button Templates ---

function generateButtonTemplates(): void {
  console.log('🔘 Generating button templates...');

  const buttons = [
    { label: 'Eleştir', icon: '🔍', color: '#7C3AED' },
    { label: 'Refactor', icon: '♻️', color: '#7C3AED' },
    { label: 'Test Yaz', icon: '🧪', color: '#7C3AED' },
    { label: 'Açıkla', icon: '💡', color: '#7C3AED' },
    { label: 'Fix Bug', icon: '🐛', color: '#7C3AED' },
    { label: 'Optimize', icon: '⚡', color: '#7C3AED' },
    { label: 'Review', icon: '👀', color: '#7C3AED' },
    { label: 'Dokümante', icon: '📝', color: '#7C3AED' },
    { label: 'Basitleştir', icon: '✂️', color: '#7C3AED' },
    // Response buttons
    { label: 'Trust', icon: '✅', color: '#16A34A' },
    { label: 'Cancel', icon: '❌', color: '#DC2626' },
    { label: 'Keep Going', icon: '▶️', color: '#2563EB' },
    { label: 'New Session', icon: '🆕', color: '#D97706' },
    { label: 'Compact', icon: '📦', color: '#D97706' },
  ];

  mkdirSync(join(OUTPUT_DIR, 'buttons'), { recursive: true });

  for (const btn of buttons) {
    const canvas = createCanvas(TILE_SIZE, TILE_SIZE);
    const ctx = canvas.getContext('2d');

    // Background with rounded corners effect
    ctx.fillStyle = btn.color;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    // Darker border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);

    // Icon (centered, upper area)
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.white;
    ctx.fillText(btn.icon, TILE_SIZE / 2, TILE_SIZE * 0.45);

    // Label (centered, lower area)
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = COLORS.white;
    ctx.fillText(btn.label, TILE_SIZE / 2, TILE_SIZE * 0.75);

    const safeName = btn.label.toLowerCase().replace(/\s+/g, '-');
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(join(OUTPUT_DIR, 'buttons', `${safeName}.png`), buffer);
  }

  console.log(`   ✅ ${buttons.length} button templates generated`);
}

// --- Main ---

(async () => {
  console.log('🎨 MX Kiro Sprite Generator');
  console.log('===========================\n');

  await generateGhostWalkFrames('ghost_icon_new_new.png', '#9145fd', 'ghost-walk');
  await generateGhostWalkFrames('ghost_icon_thinking.png', '#9145fd', 'ghost-walk-thinking');
  await generateGhostWalkFrames('ghost_icon_worried.png', '#9145fd', 'ghost-walk-worried');
  await generateGhostWalkFrames('ghost_icon_onfire_new.png', '#9143fb', 'ghost-walk-fire');
  generateGhostFaces();
  generateFireFrames();
  generateButtonTemplates();

  console.log('\n✅ All sprites generated!');
  console.log(`   Output: ${OUTPUT_DIR}`);
})();
