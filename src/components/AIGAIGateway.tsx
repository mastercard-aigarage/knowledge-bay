import React, { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import './AIGAIGateway.css';
import { AIGEventsMode } from './AIGEventsHackathonsPage';
import { content } from '../content/content';
import { iconForKey } from '../content/iconRegistry';

type AIGNode = {
  id: 'hackathons' | 'events' | 'university-collaborations' | 'publications';
  title: string;
  subtitle: string;
  tint: string;
  icon: React.ReactNode;
};

type Burst = {
  targetIndex: number;
  createdAt: number;
  durationMs: number;
  points: Array<{ x: number; y: number }>;
  branches?: Array<{ points: Array<{ x: number; y: number }>; width: number; alphaScale: number }>;
  color: string;
  width: number;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function buildLightningPoints(from: { x: number; y: number }, to: { x: number; y: number }, segments: number) {
  const points: Array<{ x: number; y: number }> = [];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const maxJitter = clamp(len * 0.06, 10, 42);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const baseX = lerp(from.x, to.x, t);
    const baseY = lerp(from.y, to.y, t);

    const falloff = Math.sin(Math.PI * t);
    const jitter = (Math.random() - 0.5) * 2 * maxJitter * falloff;
    const jitter2 = (Math.random() - 0.5) * 2 * (maxJitter * 0.25) * falloff;

    points.push({
      x: baseX + nx * jitter + dx * jitter2 * 0.002,
      y: baseY + ny * jitter - dy * jitter2 * 0.002
    });
  }

  return points;
}

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  style: { stroke: string; width: number; alpha?: number; glow?: boolean }
) {
  if (points.length < 2) return;

  ctx.save();
  ctx.globalAlpha = style.alpha ?? 1;
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (style.glow) {
    ctx.shadowColor = style.stroke;
    ctx.shadowBlur = 10;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  ctx.restore();
}

function cubicBezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
  };
}

function drawDataStream(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  now: number,
  seed: number,
  color: string
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const bend = clamp(len * 0.22, 34, 120);

  const c1 = {
    x: lerp(from.x, to.x, 0.33) + nx * bend * 0.55,
    y: lerp(from.y, to.y, 0.33) + ny * bend * 0.55
  };
  const c2 = {
    x: lerp(from.x, to.x, 0.66) - nx * bend * 0.65,
    y: lerp(from.y, to.y, 0.66) - ny * bend * 0.65
  };

  // Base faint path glow
  const pulse = 0.55 + 0.45 * Math.sin(now * 0.0012 + seed);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.09 + pulse * 0.06;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, to.x, to.y);
  ctx.stroke();
  ctx.restore();

  // Moving particles
  const speed = 0.00022 + (seed % 3) * 0.00006;
  const baseT = (now * speed + (seed * 0.17)) % 1;
  const count = 2;

  for (let i = 0; i < count; i++) {
    const t = (baseT + i * 0.22) % 1;
    const p = cubicBezierPoint(from, c1, c2, to, t);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.18 + 0.16 * Math.sin((t + seed) * Math.PI);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.55 + i * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

interface AIGAIGatewayProps {
  onSelect: (categoryId: AIGNode['id']) => void;
  onBack: () => void;
  onOpenEventsHackathons: (mode: AIGEventsMode) => void;
}

const AIGAIGateway: React.FC<AIGAIGatewayProps> = ({ onSelect, onBack, onOpenEventsHackathons }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const orbitRefs = useRef<Array<HTMLDivElement | null>>([]);
  const copy = content.pages.aigGateway;

  const nodes = useMemo<AIGNode[]>(
    () =>
      content.aigGatewayNodes.map((n) => ({
        id: n.id as AIGNode['id'],
        title: n.title,
        subtitle: n.subtitle,
        tint: n.tint,
        icon: iconForKey(n.iconKey)
      })),
    []
  );

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bursts: Burst[] = [];
    const positions: Array<{ x: number; y: number }> = nodes.map(() => ({ x: 0, y: 0 }));

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    let raf = 0;
    let angleBase = randBetween(0, Math.PI * 2);
    let lastNow = performance.now();

    // Throttle the canvas render loop; visually identical but much lighter on CPU/GPU.
    const targetFps = prefersReducedMotion ? 18 : 24;
    const frameIntervalMs = 1000 / targetFps;
    let lastRenderAt = 0;

    // Lightning cadence (instead of per-frame random chance)
    let nextBurstAt = performance.now() + randBetween(450, 800);

    // Cache layout metrics to avoid forcing layout every frame.
    let layout = { w: 0, h: 0, left: 0, top: 0, cx: 0, cy: 0 };
    let heroEl: HTMLElement | null = document.querySelector('.mc-hero-circle') as HTMLElement | null;
    let lastLayoutSampleAt = 0;
    const sampleLayout = () => {
      const stageRect = stage.getBoundingClientRect();
      layout.w = stageRect.width;
      layout.h = stageRect.height;
      layout.left = stageRect.left;
      layout.top = stageRect.top;

      if (!heroEl) heroEl = document.querySelector('.mc-hero-circle') as HTMLElement | null;
      if (heroEl) {
        const heroRect = heroEl.getBoundingClientRect();
        layout.cx = heroRect.left + heroRect.width / 2 - stageRect.left;
        layout.cy = heroRect.top + heroRect.height / 2 - stageRect.top;
      } else {
        layout.cx = stageRect.width / 2;
        layout.cy = stageRect.height / 2;
      }
    };

    let lastStageWidth = 0;
    let lastStageHeight = 0;
    let lastDpr = 0;

    const resizeCanvas = () => {
      const rect = { width: layout.w || stage.getBoundingClientRect().width, height: layout.h || stage.getBoundingClientRect().height };

      // Retinas can easily push this animation into "too many pixels" territory.
      // Cap the render DPR to keep performance consistent.
      const deviceDpr = window.devicePixelRatio || 1;
      const dpr = Math.min(deviceDpr, prefersReducedMotion ? 1 : 1.25);

      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));

      const nextPixelW = Math.max(1, Math.floor(cssW * dpr));
      const nextPixelH = Math.max(1, Math.floor(cssH * dpr));

      if (canvas.width !== nextPixelW) canvas.width = nextPixelW;
      if (canvas.height !== nextPixelH) canvas.height = nextPixelH;

      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      lastStageWidth = cssW;
      lastStageHeight = cssH;
      lastDpr = dpr;
    };

    sampleLayout();
    resizeCanvas();

    const ro = new ResizeObserver(() => {
      sampleLayout();
      resizeCanvas();
    });
    ro.observe(stage);

    const onWindowResize = () => {
      sampleLayout();
      resizeCanvas();
    };
    window.addEventListener('resize', onWindowResize);

    const spawnBurst = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      now: number,
      targetIndex: number
    ) => {
      const palette = [
        'rgba(255, 170, 0, 1)',
        'rgba(247, 158, 27, 1)',
        'rgba(255, 179, 71, 1)',
        'rgba(235, 0, 27, 0.95)',
        'rgba(255, 255, 255, 0.92)'
      ];

      const color = palette[Math.floor(Math.random() * palette.length)];
      const mainPoints = buildLightningPoints(from, to, Math.floor(randBetween(8, 14)));

      const addBranches = Math.random() < 0.4;
      const branches: Burst['branches'] = addBranches ? [] : undefined;

      if (branches) {
        const branchCount = 1;
        for (let b = 0; b < branchCount; b++) {
          const pivot = mainPoints[Math.floor(randBetween(4, Math.max(5, mainPoints.length - 4)))];
          const dir = randBetween(0, Math.PI * 2);
          const len = randBetween(40, 90);
          const branchTo = { x: pivot.x + Math.cos(dir) * len, y: pivot.y + Math.sin(dir) * len };
          branches.push({
            points: buildLightningPoints(pivot, branchTo, Math.floor(randBetween(4, 7))),
            width: randBetween(0.7, 1.2),
            alphaScale: randBetween(0.25, 0.5)
          });
        }
      }

      bursts.push({
        targetIndex,
        createdAt: now,
        durationMs: randBetween(90, 170),
        points: mainPoints,
        branches,
        color,
        width: randBetween(1.0, 2.2)
      });
    };

    const frame = (now: number) => {
      if (document.hidden) {
        raf = window.requestAnimationFrame(frame);
        return;
      }

      if (now - lastRenderAt < frameIntervalMs) {
        raf = window.requestAnimationFrame(frame);
        return;
      }
      lastRenderAt = now;

      const dt = now - lastNow;
      lastNow = now;

      // Periodically resample layout to keep the origin correct without forcing layout every frame.
      if (!prefersReducedMotion && now - lastLayoutSampleAt > 450) {
        lastLayoutSampleAt = now;
        sampleLayout();
      }

      const w = layout.w;
      const h = layout.h;

      // Keep the backing canvas in sync with layout changes.
      // This prevents visible seams/"cropping" when the stage size changes without a window resize.
      const nextCssW = Math.max(1, Math.round(w));
      const nextCssH = Math.max(1, Math.round(h));
      const nextDpr = window.devicePixelRatio || 1;
      if (nextCssW !== lastStageWidth || nextCssH !== lastStageHeight || nextDpr !== lastDpr) {
        sampleLayout();
        resizeCanvas();
      }
      const cx = layout.cx;
      const cy = layout.cy;

      // Gentle node revolution
      angleBase += dt * 0.00018;
      // Orbit should be an ellipse (more horizontal space than vertical).
      // Also push nodes a bit further away from the center logo.
      const nodeHalf = 135; // generous bound to keep nodes on-screen (accounts for larger node size)
      const maxRx = Math.max(160, Math.min(cx, w - cx) - nodeHalf - 10);
      const maxRy = Math.max(140, Math.min(cy, h - cy) - nodeHalf - 10);

      const radiusX = clamp(w * 0.28, 290, maxRx);
      const radiusY = clamp(h * 0.22, 215, maxRy);

      for (let i = 0; i < nodes.length; i++) {
        const a = angleBase + (i * Math.PI * 2) / nodes.length + 0.4;
        const x = cx + Math.cos(a) * radiusX;
        const y = cy + Math.sin(a) * radiusY;

        positions[i].x = x;
        positions[i].y = y;

        const orbitEl = orbitRefs.current[i];
        if (orbitEl) {
          orbitEl.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;
        }
      }

      // Canvas clear
      ctx.clearRect(0, 0, w, h);

      // Background glow
      ctx.save();
      const bg = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.max(w, h) * 0.58);
      bg.addColorStop(0, 'rgba(255, 170, 0, 0.10)');
      bg.addColorStop(0.35, 'rgba(247, 158, 27, 0.06)');
      bg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Constant connected streams + particles
      for (let i = 0; i < nodes.length; i++) {
        const coreFrom = { x: cx, y: cy };
        drawDataStream(ctx, coreFrom, positions[i], now, i + 1, nodes[i].tint);
        if (!prefersReducedMotion) {
          drawDataStream(ctx, { x: cx + 10, y: cy - 10 }, positions[i], now + i * 120, i + 12, 'rgba(255, 255, 255, 0.75)');
        }
      }

      // Extra ambient, non-attached streams to create the feeling of many paths
      if (!prefersReducedMotion) {
        for (let k = 0; k < 2; k++) {
          const pick = (k + Math.floor((now * 0.0004) % nodes.length)) % nodes.length;
          const wobbleX = Math.sin(now * 0.0011 + k * 2.3) * 68;
          const wobbleY = Math.cos(now * 0.0013 + k * 1.7) * 58;
          const jitterTarget = {
            x: positions[pick].x + wobbleX,
            y: positions[pick].y + wobbleY
          };
          drawDataStream(
            ctx,
            { x: cx + Math.sin(now * 0.001 + k) * 18, y: cy + Math.cos(now * 0.0012 + k) * 18 },
            jitterTarget,
            now + k * 160,
            80 + k,
            'rgba(255, 255, 255, 0.35)'
          );
        }
      }

      // Frequent lightning bursts w/ variation (multiple per tick sometimes)
      const lightningEnabled = !prefersReducedMotion;
      if (lightningEnabled && now >= nextBurstAt && bursts.length < 6) {
        const pick = Math.floor(Math.random() * nodes.length);
        const to = {
          x: positions[pick].x + randBetween(-14, 14),
          y: positions[pick].y + randBetween(-14, 14)
        };
        const from = { x: cx + randBetween(-8, 8), y: cy + randBetween(-8, 8) };
        spawnBurst(from, to, now, pick);

        // Rare secondary burst between nodes
        if (Math.random() < 0.18) {
          const other = (pick + 1 + Math.floor(Math.random() * (nodes.length - 1))) % nodes.length;
          spawnBurst(
            { x: positions[pick].x + randBetween(-8, 8), y: positions[pick].y + randBetween(-8, 8) },
            { x: positions[other].x + randBetween(-8, 8), y: positions[other].y + randBetween(-8, 8) },
            now + 10,
            pick
          );
        }

        nextBurstAt = now + randBetween(650, 1200);
      }

      // Draw & age bursts
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        const t = (now - b.createdAt) / b.durationMs;
        if (t >= 1) {
          bursts.splice(i, 1);
          continue;
        }

        const fade = Math.pow(1 - t, 2);
        const flicker = 0.7 + 0.3 * Math.sin(now * 0.06 + i * 1.2);

        drawPolyline(ctx, b.points, {
          stroke: b.color,
          width: b.width,
          alpha: fade * flicker,
          glow: true
        });

        if (b.branches) {
          for (const br of b.branches) {
            drawPolyline(ctx, br.points, {
              stroke: b.color,
              width: br.width,
              alpha: fade * flicker * br.alphaScale,
              glow: true
            });
          }
        }
      }

      // Subtle center sparkles
      if (!prefersReducedMotion && Math.random() < 0.08) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = 'rgba(255, 170, 0, 0.75)';
        ctx.shadowColor = 'rgba(255, 170, 0, 0.9)';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(cx + randBetween(-18, 18), cy + randBetween(-18, 18), randBetween(0.8, 1.8), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWindowResize);
      window.cancelAnimationFrame(raf);
    };
  }, [nodes]);

  return (
    <motion.section
      className="aig-gateway"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.button
        type="button"
        className="aig-back-button"
        onClick={onBack}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Back"
        title="Back"
      >
        {copy.backButton?.text ?? '← Back'}
      </motion.button>

      <div className="aig-gateway-header">
        <h1>{copy.headerTitle?.text ?? 'AIG AI Ecosystem'}</h1>
        <p>{copy.headerSubtitle?.text ?? ''}</p>
      </div>

      <div ref={stageRef} className="aig-gateway-stage" aria-label="AIG ecosystem selector">
        <canvas ref={canvasRef} className="aig-gateway-canvas" aria-hidden="true" />

        {nodes.map((n, idx) => (
          <div
            key={n.id}
            ref={(el) => {
              orbitRefs.current[idx] = el;
            }}
            className="aig-node-orbit"
            aria-hidden="true"
          >
            <motion.button
              type="button"
              className="aig-node"
              style={{ ['--node-tint' as any]: n.id === 'publications' ? 'rgba(247, 158, 27, 1)' : n.tint }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + idx * 0.06, duration: 0.45, ease: 'easeOut' }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (n.id === 'events') {
                  onOpenEventsHackathons('events');
                  return;
                }

                if (n.id === 'hackathons') {
                  onOpenEventsHackathons('hackathons');
                  return;
                }

                onSelect(n.id);
              }}
              aria-label={n.title}
              title={n.title}
            >
              <span className="aig-node-gloss" aria-hidden="true" />
              <span className="aig-node-icon" aria-hidden="true">{n.icon}</span>
              <span className={`aig-node-title${n.id === 'university-collaborations' ? ' aig-node-title--split' : ''}`}>
                {n.id === 'university-collaborations' ? (
                  <>
                    <span>University</span>
                    <span>Collaborations</span>
                  </>
                ) : (
                  n.title
                )}
              </span>
              <span className="aig-node-ring" aria-hidden="true" />
            </motion.button>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

export default AIGAIGateway;
