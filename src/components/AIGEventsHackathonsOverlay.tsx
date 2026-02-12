import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import './AIGEventsHackathonsOverlay.css';
import { content, formatTemplate } from '../content/content';
import { resolveImagePath } from '../utils/resolveImagePath';
import { toTitleCase } from '../utils/toTitleCase';

export type AIGEventsMode = 'events' | 'hackathons';

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

interface AIGEventsHackathonsOverlayProps {
  mode: AIGEventsMode;
  onClose: () => void;
}

type AIGEventItem = {
  name: string;
  destination: string;
  description: string;
  link: string;
  imagePath: string;
  position?: string;
};

const AIGEventsHackathonsOverlay: React.FC<AIGEventsHackathonsOverlayProps> = ({ mode, onClose }) => {
  const copy = content.pages.eventsHackathons;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [mode]);

  const filtered = useMemo<AIGEventItem[]>(() => {
    return mode === 'hackathons' ? content.hackathons : content.events;
  }, [mode]);

  const length = filtered.length;
  const current = length > 0 ? filtered[clampIndex(activeIndex, length)] : null;
  const currentImageSrc = current?.imagePath ? resolveImagePath(current.imagePath) : undefined;

  const focusNext = () => setActiveIndex((prev) => clampIndex(prev + 1, length));
  const focusPrev = () => setActiveIndex((prev) => clampIndex(prev - 1, length));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (length <= 1) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        focusNext();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        focusPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [length, onClose]);

  const title = mode === 'hackathons' ? (copy.hackathonsTitle?.text ?? 'Hackathons') : (copy.eventsTitle?.text ?? 'Events');
  const subtitle =
    mode === 'hackathons'
      ? (copy.hackathonsSubtitle?.text ?? '')
      : (copy.eventsSubtitle?.text ?? '');

  return (
    <div className="aig-events-overlay" role="dialog" aria-modal="true" aria-label={`${title} overlay`}>
      <motion.div
        className="aig-events-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        className="aig-events-panel"
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.985 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <header className="aig-events-header">
          <div className="aig-events-header-left">
            <div className="aig-events-title">{title}</div>
            <div className="aig-events-subtitle">{toTitleCase(subtitle)}</div>
          </div>

          <button type="button" className="aig-events-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="aig-events-body">
          {length === 0 ? (
            <div className="aig-events-status">
              {formatTemplate(copy.noneFound?.text ?? 'No {{kind}} found.', { kind: title.toLowerCase() })}
            </div>
          ) : (
            <>
              <div className="aig-events-carousel">
                <button
                  type="button"
                  className="aig-events-nav aig-events-nav-left"
                  onClick={focusPrev}
                  disabled={length <= 1}
                  aria-label="Previous"
                  title="Previous"
                >
                  ‹
                </button>

                <div className="aig-events-card-shell">
                  <AnimatePresence mode="wait" initial={false}>
                    {current && (
                      <motion.div
                        key={`${current.name}-${activeIndex}`}
                        className="aig-events-card"
                        initial={{ opacity: 0, x: 22, scale: 0.99 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -22, scale: 0.99 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                      >
                        <div className="aig-events-card-imageWrap" aria-hidden="true">
                          {currentImageSrc ? (
                            <img className="aig-events-card-image" src={currentImageSrc} alt="" loading="lazy" />
                          ) : (
                            <div className="aig-events-card-imageFallback" />
                          )}
                          <div className="aig-events-card-gloss" />
                          <div className="aig-events-card-bottomFade" />

                          {mode === 'hackathons' && current.position?.trim() ? (
                            <div className="aig-events-card-badges">
                              <div className="aig-events-card-badge" title={current.position} role="note">
                                {current.position}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="aig-events-card-content">
                          <div className="aig-events-card-text">
                            <div className="aig-events-card-name">{current.name}</div>
                            <div className="aig-events-card-dest">{toTitleCase(current.destination)}</div>
                            <div className="aig-events-card-desc">{current.description}</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  className="aig-events-nav aig-events-nav-right"
                  onClick={focusNext}
                  disabled={length <= 1}
                  aria-label="Next"
                  title="Next"
                >
                  ›
                </button>
              </div>

              <div className="aig-events-footer" aria-hidden="true">
                <div className="aig-events-counter">
                  {clampIndex(activeIndex, length) + 1} / {length}
                </div>
                <div className="aig-events-hint">Use ← → to browse • Esc to close</div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AIGEventsHackathonsOverlay;
