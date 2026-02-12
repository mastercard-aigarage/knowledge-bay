import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { TopicOption } from './TopicSidebar';
import './TopicLanding.css';
import { content } from '../content/content';

const topicIconFiles = import.meta.glob('../../assets/topics/*.{png,svg,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

const topicIconMap: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [path, url] of Object.entries(topicIconFiles)) {
    const filename = path.split('/').pop() ?? path;
    const base = normalizeKey(filename);
    map[base] = url;
  }
  return map;
})();

function iconUrlForTopicLabel(label: string): string | undefined {
  const key = normalizeKey(label);
  return (
    topicIconMap[key] ??
    // Handle known spelling differences in asset names.
    topicIconMap[key.replace('responsible', 'resposible')] ??
    topicIconMap[key.replace('modelling', 'modeling')] ??
    topicIconMap[normalizeKey('Others')] // fallback if present
  );
}

function toTitleCase(str: string): string {
  return str
    .split(/\s+/)
    .map(word => {
      // Preserve all-uppercase acronyms (e.g., "AI" stays "AI")
      if (word === word.toUpperCase() && word.length > 1) return word;
      // Title case: capitalize first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

type BubbleLayout = {
  xPx: number;
  yPx: number;
  sizePx: number;
  driftPx: number;
  floatPx: number;
  duration: number;
  delay: number;
};

function seedFromString(input: string): number {
  // Simple deterministic hash (32-bit)
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function prng(seed: number): () => number {
  // xorshift32
  let x = seed || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}

type StageSize = { width: number; height: number };

type UnitPoint = { ux: number; uy: number };

function makeSymmetricSlots(count: number): UnitPoint[] {
  if (count <= 0) return [];
  if (count === 1) return [{ ux: 0, uy: 0 }];

  const slots: UnitPoint[] = [];

  const isOdd = count % 2 === 1;
  if (isOdd) slots.push({ ux: 0, uy: 0 });

  const pairCount = Math.floor(count / 2);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const maxR = 1;

  for (let i = 0; i < pairCount; i++) {
    const t = i + 1;
    const r = Math.sqrt(t / (pairCount + 1)) * maxR;
    const a = t * goldenAngle;
    const ux = r * Math.cos(a);
    const uy = r * Math.sin(a);
    slots.push({ ux, uy });
    slots.push({ ux: -ux, uy: -uy });
  }

  return slots.slice(0, count);
}

function sizeForTopic(paperCount: number, maxPaperCount: number, viewportScale: number): number {
  const minSize = 100 * viewportScale;
  const maxSize = 240 * viewportScale;
  const normalizedCount = Math.sqrt(paperCount / Math.max(maxPaperCount, 1));
  return minSize + normalizedCount * (maxSize - minSize);
}

function motionForTopic(topicId: string): Pick<BubbleLayout, 'driftPx' | 'floatPx' | 'duration' | 'delay'> {
  const rand = prng(seedFromString(topicId));
  const driftPx = 10 + rand() * 14;
  const floatPx = 14 + rand() * 18;
  const duration = 5.8 + rand() * 4.2;
  const delay = rand() * 0.6;
  return { driftPx, floatPx, duration, delay };
}

interface TopicLandingProps {
  topics: TopicOption[];
  selectedTopicId: string;
  onSelectTopic: (topicId: string) => void;
  onBack?: () => void;
}

const TopicLanding: React.FC<TopicLandingProps> = ({
  topics,
  selectedTopicId,
  onSelectTopic,
  onBack
}) => {
  const copy = content.pages.topicLanding;
  const visibleTopics = useMemo(() => topics.filter((t) => t.id !== 'all'), [topics]);

  const stageInnerRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<StageSize>({ width: 1, height: 1 });

  useLayoutEffect(() => {
    const el = stageInnerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setStageSize({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const bubbles = useMemo(() => {
    const total = visibleTopics.length;
    const maxPaperCount = Math.max(...visibleTopics.map(t => t.count), 1);

    const width = Math.max(1, stageSize.width);
    const height = Math.max(1, stageSize.height);

    // Scale bubble sizes with screen width:
    // - keep laptops around 1x (so the old layout still feels right)
    // - ramp up on large monitors
    // - slightly shrink on small screens where space is tight
    const viewportScale = (() => {
      const minScale = 0.94;
      const maxScale = 1.4;

      if (width <= 900) return minScale;
      if (width <= 1200) {
        const t = (width - 900) / 300;
        return minScale + t * (1 - minScale);
      }
      if (width <= 2560) {
        const t = (width - 1200) / 1360;
        return 1 + t * (maxScale - 1);
      }
      return maxScale;
    })();

    // Shift the overall bubble cluster slightly left on larger viewports.
    // Keep mobile centered to avoid clipping and preserve balance.
    const bubbleShiftXPx =
      width >= 1100 ? -Math.min(90, width * 0.14) : width >= 900 ? -Math.min(150, width * 0.1) : 0;

    const centerX = width / 2 + bubbleShiftXPx;
    const centerY = height / 2 - 60;

    // Precompute size + motion params
    const sizePxByIndex = visibleTopics.map(t => sizeForTopic(t.count, maxPaperCount, viewportScale));
    const motionByIndex = visibleTopics.map(t => motionForTopic(t.id));

    // Use a shared available radius based on the *largest* bubble/motion so mirrored slots stay symmetric in px.
    const padPx = 10;
    const globalMarginX = Math.max(
      0,
      ...sizePxByIndex.map((sizePx, i) => sizePx / 2 + motionByIndex[i]!.driftPx + padPx)
    );
    const globalMarginY = Math.max(
      0,
      ...sizePxByIndex.map((sizePx, i) => sizePx / 2 + motionByIndex[i]!.floatPx + padPx)
    );

    const halfAvailX = Math.max(0, width / 2 - globalMarginX);
    const halfAvailY = Math.max(0, height / 2 - globalMarginY);

    // Add a small deterministic jitter so the layout feels more organic / scattered.
    // Keep it subtle and reduce on smaller screens to avoid edge clipping.
    const scatterStrength = width >= 1100 ? 0.22 : width >= 900 ? 0.18 : width >= 700 ? 0.14 : 0.1;
    const verticalSpread = width >= 1100 ? 1.3 : width >= 900 ? 1.22 : width >= 700 ? 1.16 : 1.1;

    // Build symmetric slots and assign similarly-sized topics to mirrored slots.
    const slots = makeSymmetricSlots(total);
    const centerSlotIndex = total % 2 === 1 ? 0 : -1;
    const topicOrder = [...visibleTopics.keys()].sort((a, b) => sizePxByIndex[a]! - sizePxByIndex[b]!);

    const slotByTopicIndex: Array<UnitPoint | undefined> = new Array(total);

    if (centerSlotIndex >= 0) {
      const centerTopicIndex = topicOrder.shift();
      if (centerTopicIndex !== undefined) slotByTopicIndex[centerTopicIndex] = slots[centerSlotIndex];
    }

    // Remaining slots are in mirrored pairs: [ux,uy], [-ux,-uy]
    for (let s = centerSlotIndex >= 0 ? 1 : 0; s < slots.length; s += 2) {
      const aSlot = slots[s];
      const bSlot = slots[s + 1];
      if (!aSlot || !bSlot) break;

      const aTopic = topicOrder.shift();
      const bTopic = topicOrder.shift();
      if (aTopic !== undefined) slotByTopicIndex[aTopic] = aSlot;
      if (bTopic !== undefined) slotByTopicIndex[bTopic] = bSlot;
    }

    const initialLayouts = visibleTopics.map((topic, idx) => {
      const slot = slotByTopicIndex[idx] ?? { ux: 0, uy: 0 };
      const { driftPx, floatPx, duration, delay } = motionByIndex[idx]!;
      const sizePx = sizePxByIndex[idx]!;

      const scatterRand = prng(seedFromString(`${topic.id}-scatter`));
      const dux = (scatterRand() - 0.5) * scatterStrength;
      const duy = (scatterRand() - 0.5) * scatterStrength;
      const radial = 1.05 + (scatterRand() - 0.5) * 0.12;

      const jitteredUx = Math.max(-1, Math.min(1, slot.ux * radial + dux));
      const jitteredUy = Math.max(-1, Math.min(1, slot.uy * radial + duy));

      // Symmetric in px, clamped only at the viewport edge.
      const xPx = Math.max(globalMarginX, Math.min(width - globalMarginX, centerX + jitteredUx * halfAvailX));
      const yPx = Math.max(
        globalMarginY,
        Math.min(height - globalMarginY, centerY + jitteredUy * halfAvailY * verticalSpread)
      );

      return {
        topic,
        layout: { xPx, yPx, sizePx, driftPx, floatPx, duration, delay }
      };
    });

    // Final centering pass: align the (size-weighted) centroid to the stage center.
    // This guards against any subtle width quirks and keeps the *visual* mass centered.
    const weightSum = initialLayouts.reduce((sum, b) => sum + b.layout.sizePx * b.layout.sizePx, 0);
    const weightedMeanX =
      weightSum > 0
        ? initialLayouts.reduce((sum, b) => sum + b.layout.xPx * (b.layout.sizePx * b.layout.sizePx), 0) / weightSum
        : centerX;
    const deltaX = centerX - weightedMeanX;

    const centeredLayouts = initialLayouts.map((b) => {
      const marginX = b.layout.sizePx / 2 + b.layout.driftPx + padPx;
      const xPx = Math.max(marginX, Math.min(width - marginX, b.layout.xPx + deltaX));
      return { ...b, layout: { ...b.layout, xPx } };
    });

    // Nudge the 4th bubble (by x position) slightly left.
    // This is clamped so it remains responsive and never clips past the viewport edges.
    if (centeredLayouts.length >= 4) {
      const sortedByX = [...centeredLayouts]
        .map((b, idx) => ({ idx, x: b.layout.xPx }))
        .sort((a, b) => a.x - b.x);

      const fourth = sortedByX[3];
      if (fourth) {
        const target = centeredLayouts[fourth.idx]!;
        const marginX = target.layout.sizePx / 2 + target.layout.driftPx + padPx;
        const shiftLeftPx = Math.min(60, Math.max(18, target.layout.sizePx * 0.22));
        const xPx = Math.max(marginX, Math.min(width - marginX, target.layout.xPx - shiftLeftPx));
        centeredLayouts[fourth.idx] = { ...target, layout: { ...target.layout, xPx } };
      }
    }

    return centeredLayouts;
  }, [visibleTopics, stageSize]);

  return (
    <motion.section
      className="topic-landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {onBack && (
        <motion.button
          type="button"
          className="topic-landing-back"
          onClick={onBack}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ x: -4 }}
          aria-label="Back"
          title="Back"
        >
          {copy.backButton?.text ?? '← Back'}
        </motion.button>
      )}
      
      <div className="topic-landing-hero">
        <motion.h1
          className="topic-landing-title"
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          {copy.title?.text ?? 'Choose a research topic'}
        </motion.h1>
        <motion.p
          className="topic-landing-subtitle"
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.55, ease: 'easeOut' }}
        >
          {copy.subtitle?.text ?? ''}
        </motion.p>
      </div>

      <div className="topic-landing-stage" aria-label="Topic bubbles">
        <div className="topic-landing-glow" />

        <div className="topic-landing-stage-inner" ref={stageInnerRef}>
          {bubbles.map(({ topic, layout }) => {
            const active = topic.id === selectedTopicId;

            return (
              <motion.button
                key={topic.id}
                type="button"
                className={`topic-bubble ${active ? 'active' : ''}`}
                style={{
                  left: `${layout.xPx}px`,
                  top: `${layout.yPx}px`,
                  width: `${layout.sizePx}px`,
                  height: `${layout.sizePx}px`
                }}
                initial={{ scale: 0.86, opacity: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -layout.floatPx, 0, layout.floatPx * 0.6, 0],
                  x: [0, layout.driftPx, 0, -layout.driftPx * 0.8, 0]
                }}
                transition={{
                  opacity: { duration: 0.35, delay: layout.delay },
                  scale: { duration: 0.4, delay: layout.delay },
                  y: { duration: layout.duration, repeat: Infinity, ease: 'easeInOut', delay: layout.delay },
                  x: { duration: layout.duration * 1.2, repeat: Infinity, ease: 'easeInOut', delay: layout.delay }
                }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectTopic(topic.id)}
                aria-label={`${topic.label} (${topic.count} papers)`}
                title={`${topic.label} (${topic.count})`}
              >
                {(() => {
                  const iconUrl = iconUrlForTopicLabel(topic.label);
                  if (!iconUrl) return null;
                  return <img className="topic-bubble-icon" src={iconUrl} alt="" aria-hidden="true" draggable={false} />;
                })()}
                <span className="topic-bubble-label">{toTitleCase(topic.label)}</span>
                <span className="topic-bubble-count">{topic.count}</span>
                <span className="topic-bubble-ring" aria-hidden="true" />
              </motion.button>
            );
          })}

          <AnimatePresence>
            {visibleTopics.length === 0 && (
              <motion.div
                className="topic-landing-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {copy.empty?.text ?? 'No topics found.'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="topic-landing-footer">
        <button type="button" className="topic-landing-all" onClick={() => onSelectTopic('all')}>
          {copy.allTopicsCta?.text ?? 'Or explore all topics →'}
        </button>
      </div>
    </motion.section>
  );
};

export default TopicLanding;
