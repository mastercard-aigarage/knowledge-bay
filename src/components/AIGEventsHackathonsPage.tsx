import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import './AIGEventsHackathonsPage.css';
import './AIGEventsHackathonsOverlay.css';
import { content, formatTemplate } from '../content/content';
import { resolveImagePath } from '../utils/resolveImagePath';
import { toTitleCase } from '../utils/toTitleCase';

export type AIGEventsMode = 'events' | 'hackathons';

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

interface AIGEventsHackathonsPageProps {
  mode: AIGEventsMode;
  onBack: () => void;
}

type AIGEventItem = {
  name: string;
  destination: string;
  description: string;
  link: string;
  imagePath: string;
  year?: number;
  position?: string;
};

const AIGEventsHackathonsPage: React.FC<AIGEventsHackathonsPageProps> = ({ mode, onBack }) => {
  const copy = content.pages.eventsHackathons;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // Reset carousel index when switching modes.
    setActiveIndex(0);
  }, [mode]);

  const filtered = useMemo<AIGEventItem[]>(() => {
    if (mode === 'hackathons') return content.hackathons;
    return [...content.events].sort((a, b) => {
      const ay = a.year ?? -Infinity;
      const by = b.year ?? -Infinity;
      if (by !== ay) return by - ay;
      return a.name.localeCompare(b.name);
    });
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
        onBack();
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
  }, [length, onBack]);

  const title = mode === 'hackathons' ? (copy.hackathonsTitle?.text ?? 'Hackathons') : (copy.eventsTitle?.text ?? 'Events');
  const subtitle =
    mode === 'hackathons'
      ? (copy.hackathonsSubtitle?.text ?? '')
      : (copy.eventsSubtitle?.text ?? '');

  return (
    <>
      <button type="button" className="aig-events-page-back" onClick={onBack} aria-label="Back to AIG AI Gateway" title="Back">
        ← Back
      </button>
      <motion.section
        className="aig-events-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        aria-label={`${title} page`}
      >
        <motion.header
          className="header"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <motion.h1
            className="title"
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {title}
          </motion.h1>
          <motion.p
            className="subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.55, ease: 'easeOut' }}
          >
            {toTitleCase(subtitle)}
          </motion.p>
        </motion.header>

        <div className="aig-events-page-inner">
          <motion.div
            className="aig-events-panel"
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
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
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={focusPrev}
                      disabled={length <= 1}
                      aria-label="Previous"
                      title="Previous"
                    >
                      <span className="aig-events-nav-icon" aria-hidden="true">
                        ‹
                      </span>
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

                              {mode === 'events' && typeof current.year === 'number' ? (
                                <div className="aig-events-card-badges">
                                  <div className="aig-events-card-badge aig-events-card-badge--year" title={String(current.year)} role="note">
                                    {current.year}
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
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={focusNext}
                      disabled={length <= 1}
                      aria-label="Next"
                      title="Next"
                    >
                      <span className="aig-events-nav-icon" aria-hidden="true">
                        ›
                      </span>
                    </button>
                  </div>

                  {/* <div className="aig-events-footer" aria-hidden="true">
                    <div className="aig-events-counter">
                      {clampIndex(activeIndex, length) + 1} / {length}
                    </div>
                    <div className="aig-events-hint">Use ← → to browse • Esc to go back</div>
                  </div> */}
                </>
              )}
            </div>
        </motion.div>
      </div>
      </motion.section>
    </>
  );
};

export default AIGEventsHackathonsPage;
