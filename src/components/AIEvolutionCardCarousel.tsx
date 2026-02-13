import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './AIEvolutionCardCarousel.css';

export type AIEvolutionCard = {
  id: string;
  title: string;
  description: string;
  accent: string;
  icon: React.ReactNode;
};

type Slot = 'center' | 'left' | 'right';

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

function slotFor(index: number, activeIndex: number, length: number): Slot {
  if (length <= 0) return 'center';

  const idx = clampIndex(index, length);
  const active = clampIndex(activeIndex, length);

  if (idx === active) return 'center';

  const next = clampIndex(active + 1, length);
  const prev = clampIndex(active - 1, length);

  if (idx === next) return 'right';
  if (idx === prev) return 'left';

  // With exactly 3 items, we should never hit this, but keep a safe default.
  return 'left';
}

interface AIEvolutionCardCarouselProps {
  cards: AIEvolutionCard[];
  onSelect: (id: string) => void;
  autoRotateMs?: number;
}

const SPRING = { type: 'spring', stiffness: 190, damping: 24, mass: 0.9 } as const;

const AIEvolutionCardCarousel: React.FC<AIEvolutionCardCarouselProps> = ({
  cards,
  onSelect,
  autoRotateMs = 4200
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const lastInteractionRef = useRef<number>(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [sideOffsetPx, setSideOffsetPx] = useState(270);

  const length = cards.length;

  const orderedCards = useMemo(() => {
    // Keep stable order; rendering order matters for focus and pointer events.
    return cards.map((card, index) => ({ card, index }));
  }, [cards]);

  useEffect(() => {
    if (length <= 1) return;
    if (paused) return;

    const timeoutId = window.setTimeout(() => {
      setActiveIndex((prev) => clampIndex(prev + 1, length)); // clockwise loop
    }, autoRotateMs);

    return () => window.clearTimeout(timeoutId);
  }, [activeIndex, autoRotateMs, length, paused]);

  useEffect(() => {
    // If the card list changes, keep activeIndex in range.
    setActiveIndex((prev) => clampIndex(prev, length));
  }, [length]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const update = () => {
      // Keep the side cards aligned/overlapped proportionally as the carousel grows.
      // Use a tighter factor on laptop-sized screens so cards sit closer together.
      const width = stage.clientWidth;
      const isLaptop = window.innerWidth <= 2000;
      const factor = isLaptop ? 0.22 : 0.32;
      const maxOff = isLaptop ? 300 : 420;
      const nextOffset = Math.round(Math.min(maxOff, Math.max(160, width * factor)));
      setSideOffsetPx(nextOffset);
    };

    update();

    // ResizeObserver keeps this responsive without window listeners.
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const setActive = (index: number) => {
    lastInteractionRef.current = Date.now();
    setActiveIndex(clampIndex(index, length));
  };

  const focusNext = () => setActive(activeIndex + 1);
  const focusPrev = () => setActive(activeIndex - 1);

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (length <= 1) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusNext();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusPrev();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const activeCard = cards[clampIndex(activeIndex, length)];
      if (activeCard) onSelect(activeCard.id);
    }
  };

  return (
    <div
      className="ai-evo-carousel"
      tabIndex={0}
      role="region"
      aria-label="AI Evolution interactive cards"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
    >
      <div className="ai-evo-carousel-hud" aria-hidden="true">
        <div className="ai-evo-hud-line ai-evo-hud-line-1" />
        <div className="ai-evo-hud-line ai-evo-hud-line-2" />
        <div className="ai-evo-hud-line ai-evo-hud-line-3" />
        <div className="ai-evo-hud-glow" />
      </div>

      <div className="ai-evo-carousel-stage" ref={stageRef}>
        {length > 1 && (
          <div className="ai-evo-carousel-clickzones" aria-hidden="true">
            <button
              type="button"
              className="ai-evo-clickzone ai-evo-clickzone-left"
              tabIndex={-1}
              onClick={focusPrev}
            />
            <button
              type="button"
              className="ai-evo-clickzone ai-evo-clickzone-right"
              tabIndex={-1}
              onClick={focusNext}
            />
          </div>
        )}

        {orderedCards.map(({ card, index }) => {
          const slot = slotFor(index, activeIndex, length);
          const isCenter = slot === 'center';

          const motionTarget =
            slot === 'center'
              ? { x: 0, scale: 1, rotateY: 0, z: 0, opacity: 1 }
              : slot === 'left'
                ? { x: -sideOffsetPx, scale: 0.92, rotateY: 18, z: -90, opacity: 0.72 }
                : { x: sideOffsetPx, scale: 0.92, rotateY: -18, z: -90, opacity: 0.72 };

          return (
            <motion.button
              key={card.id}
              type="button"
              className={`ai-evo-card ai-evo-card-${slot} ${isCenter ? 'is-center' : ''}`}
              style={{
                ['--ai-evo-accent' as never]: card.accent
              }}
              animate={motionTarget}
              transition={SPRING}
              whileHover={
                isCenter
                  ? {
                      scale: 1.02,
                      boxShadow: '0 18px 70px rgba(0,0,0,0.55)'
                    }
                  : { scale: 0.94 }
              }
              whileTap={isCenter ? { scale: 0.99 } : { scale: 0.9 }}
              onClick={() => {
                if (!isCenter) {
                  setActive(index);
                  return;
                }
                onSelect(card.id);
              }}
              aria-label={`${card.title}: ${card.description}`}
              aria-current={isCenter ? 'true' : undefined}
            >
              <span className="ai-evo-card-sheen" aria-hidden="true" />
              <span className="ai-evo-card-border" aria-hidden="true" />

              <div className="ai-evo-card-content ai-evo-card-content-sharp">
                <div className="ai-evo-card-icon" aria-hidden="true">
                  {card.icon}
                </div>

                <div className="ai-evo-card-text">
                  <div className="ai-evo-card-title">{card.title}</div>
                  <div className="ai-evo-card-desc">{card.description}</div>
                </div>

                <div className="ai-evo-card-meta" aria-hidden="true">
                  <span className="ai-evo-meta-dot" />
                  <span className="ai-evo-meta-dot" />
                  <span className="ai-evo-meta-dot" />
                </div>

                {isCenter ? (
                  <div className="ai-evo-card-cta" aria-hidden="true">
                    Enter →
                  </div>
                ) : (
                  <div className="ai-evo-card-cta" aria-hidden="true" />
                )}
              </div>

              <div className="ai-evo-card-content ai-evo-card-content-blur" aria-hidden="true">
                <div className="ai-evo-card-icon" aria-hidden="true">
                  {card.icon}
                </div>

                <div className="ai-evo-card-text">
                  <div className="ai-evo-card-title">{card.title}</div>
                  <div className="ai-evo-card-desc">{card.description}</div>
                </div>

                <div className="ai-evo-card-meta" aria-hidden="true">
                  <span className="ai-evo-meta-dot" />
                  <span className="ai-evo-meta-dot" />
                  <span className="ai-evo-meta-dot" />
                </div>

                {isCenter ? (
                  <div className="ai-evo-card-cta" aria-hidden="true">
                    Enter →
                  </div>
                ) : (
                  <div className="ai-evo-card-cta" aria-hidden="true" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="ai-evo-carousel-hint" aria-hidden="true">
      </div>
    </div>
  );
};

export default AIEvolutionCardCarousel;
