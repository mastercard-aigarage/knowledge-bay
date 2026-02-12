import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import './MastercardHero.css';
import MastercardProductBubbleEmitter, { type MastercardBubbleProduct } from './MastercardProductBubbleEmitter';
import { content } from '../content/content';
import { iconForKey } from '../content/iconRegistry';
import aiGarageMarkUrl from '../../assets/ai-garage-mark.gif';

export type MastercardHeroPosition = 'center' | 'center-particles' | 'left' | 'bottom-left' | 'center-focus' | 'center-mid';

interface MastercardHeroProps {
  position: MastercardHeroPosition;
  mode?: 'default' | 'products';
  layout?: 'fixed' | 'inline';
  logoVariant?: 'default' | 'aig-gateway';
  logoCaption?: string;
  onLogoClick?: () => void;
}

const HERO_CONTAINER_SIZE = 400;
const HERO_HALF = HERO_CONTAINER_SIZE / 2;
const HERO_MIN_LEFT_EDGE = 16;
const AI_EVOLUTION_CARDS_WIDTH = 760;

const EDGE_PADDING_PX = 35;
const BOTTOM_LEFT_SCALE = 0.3;

const CENTER_FOCUS_Y_OFFSET_PX = 36;
const CENTER_MID_Y_OFFSET_PX = 100;

const landingParticleBandYOffset = (viewportHeight: number) => -Math.min(56, viewportHeight * 0.055);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const largeScreenHeroScale = (viewportWidth: number) => {
  // Keep laptop sizing unchanged, but gently scale up on large monitors.
  // 1440px -> 1.0, 2560px -> ~1.25
  if (viewportWidth < 1440) return 1;
  const t = clamp((viewportWidth - 1440) / (2560 - 1440), 0, 1);
  return 1 + t * 0.25;
};

const MastercardHero: React.FC<MastercardHeroProps> = ({
  position,
  mode = 'default',
  layout = 'fixed',
  logoVariant = 'default',
  logoCaption,
  onLogoClick
}) => {
  const [viewport, setViewport] = useState<{ width: number; height: number }>(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }));

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const targetX = useMemo(() => {
    if (layout === 'inline') return 0;
    if (position === 'center' || position === 'center-focus' || position === 'center-mid' || position === 'center-particles') return 0;
    if (position === 'bottom-left') return 0;

    const scaleBoost = largeScreenHeroScale(viewport.width);
    const heroSize = HERO_CONTAINER_SIZE * scaleBoost;
    const heroHalf = heroSize / 2;

    // Responsive/symmetric "left" position (used on the AI Evolution page):
    // We want 3 equal spaces: leftSpace == gap == rightSpace.
    // Given viewport width W, hero width H, cards width C:
    //   space = (W - H - C) / 3
    // Hero center should be at (space + H/2).
    const viewportWidth = viewport.width;
    const space = (viewportWidth - heroSize - AI_EVOLUTION_CARDS_WIDTH) / 3;
    const spaceClamped = Math.max(HERO_MIN_LEFT_EDGE, space);
    const desiredHeroCenterX = spaceClamped + heroHalf;
    const desiredShift = desiredHeroCenterX - viewportWidth / 2;

    // Keep the hero from going off-screen on smaller widths.
    // Left edge when centered is (w/2 - HERO_HALF). After translating by x, left edge becomes:
    //   (w/2 - HERO_HALF) + x
    // Enforce >= HERO_MIN_LEFT_EDGE.
    const minX = HERO_MIN_LEFT_EDGE - (viewport.width / 2 - heroHalf);
    return clamp(desiredShift, minX, 0);
  }, [layout, position, viewport.width]);

  const scaleBoost = useMemo(() => {
    if (layout === 'inline') return 1;
    return largeScreenHeroScale(viewport.width);
  }, [layout, viewport.width]);

  const anchorOffset = useMemo(() => {
    if (layout === 'inline') return { x: 0, y: 0 };

    if (position === 'center-particles') {
      // Align the hero with the landing page particle band (which is biased upward).
      return { x: 0, y: landingParticleBandYOffset(viewport.height) };
    }

    if (position === 'center-focus') {
      // Slightly lower on the AI @ Mastercard page.
      return { x: 0, y: CENTER_FOCUS_Y_OFFSET_PX };
    }

    if (position === 'center-mid') {
      // Slightly lower on the AIG AI Gateway page.
      return { x: 0, y: CENTER_MID_Y_OFFSET_PX };
    }

    if (position !== 'bottom-left') return { x: 0, y: 0 };

    const combinedScale = BOTTOM_LEFT_SCALE * scaleBoost;

    // Animate the hero's center point down to the bottom-left in a way that works
    // across viewports (and avoids CSS `top:auto`/`bottom` jumps).
    const scaledHalf = HERO_HALF * combinedScale;
    const minCenterX = EDGE_PADDING_PX + scaledHalf;
    const minCenterY = EDGE_PADDING_PX + scaledHalf;

    const desiredCenterX = minCenterX;
    const desiredCenterY = clamp(viewport.height - minCenterY, minCenterY, viewport.height - minCenterY);

    // Base anchor point is the center of the viewport.
    const baseCenterX = viewport.width / 2;
    const baseCenterY = viewport.height / 2;

    return {
      x: desiredCenterX - baseCenterX,
      y: desiredCenterY - baseCenterY
    };
  }, [layout, position, scaleBoost, viewport.height, viewport.width]);

  const scale =
    (layout === 'inline' ? 1 :
    position === 'bottom-left' ? BOTTOM_LEFT_SCALE :
    position === 'center-focus' ? 0.86 :
    position === 'center-mid' ? 0.50 :
    1) * scaleBoost;

  const products = useMemo<MastercardBubbleProduct[]>(
    () =>
      content.products.map((p) => ({
        id: p.id,
        label: p.label,
        icon: iconForKey(p.iconKey)
      })),
    []
  );

  return (
    <div className={`mc-hero-anchor mc-hero-anchor--${layout}`}>
      <motion.div
        className="mc-hero-anchor-motion"
        animate={anchorOffset}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        <motion.div
          className={`mc-hero mc-hero--${logoVariant}`}
          animate={{ x: targetX, scale }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <div className="mc-hero-circle-container">
            <div className="mc-hero-circle-ring ring-1" />
            <div className="mc-hero-circle-ring ring-2" />
            <div className="mc-hero-circle-ring ring-3" />

            {mode === 'products' && <MastercardProductBubbleEmitter products={products} />}

            {onLogoClick ? (
              <motion.button
                type="button"
                className={`mc-hero-circle mc-hero-circle--${logoVariant} mc-hero-circle--clickable`}
                onClick={onLogoClick}
                aria-label="Go to home"
                title="Go to home"
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(255, 170, 0, 0.25), inset 0 0 25px rgba(255, 170, 0, 0.05)',
                    '0 0 40px rgba(255, 170, 0, 0.35), inset 0 0 35px rgba(255, 170, 0, 0.08)',
                    '0 0 30px rgba(255, 170, 0, 0.25), inset 0 0 25px rgba(255, 170, 0, 0.05)'
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                {logoVariant === 'aig-gateway' ? (
                  <div className="mc-hero-logo-stack">
                    <img
                      src={aiGarageMarkUrl}
                      alt="AI Garage Mark"
                      className="mc-hero-logo"
                      draggable={false}
                    />
                    <div className="mc-hero-logo-caption">{logoCaption ?? 'AI Garage'}</div>
                  </div>
                ) : (
                  <img
                    src={aiGarageMarkUrl}
                    alt="AI Garage Mark"
                    className="mc-hero-logo"
                    draggable={false}
                  />
                )}
              </motion.button>
            ) : (
              <motion.div
                className={`mc-hero-circle mc-hero-circle--${logoVariant}`}
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(255, 170, 0, 0.25), inset 0 0 25px rgba(255, 170, 0, 0.05)',
                    '0 0 40px rgba(255, 170, 0, 0.35), inset 0 0 35px rgba(255, 170, 0, 0.08)',
                    '0 0 30px rgba(255, 170, 0, 0.25), inset 0 0 25px rgba(255, 170, 0, 0.05)'
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                {logoVariant === 'aig-gateway' ? (
                  <div className="mc-hero-logo-stack">
                    <img
                      src={aiGarageMarkUrl}
                      alt="AI Garage Mark"
                      className="mc-hero-logo"
                      draggable={false}
                    />
                    <div className="mc-hero-logo-caption">{logoCaption ?? 'AI Garage'}</div>
                  </div>
                ) : (
                  <img
                    src={aiGarageMarkUrl}
                    alt="AI Garage Mark"
                    className="mc-hero-logo"
                    draggable={false}
                  />
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MastercardHero;
