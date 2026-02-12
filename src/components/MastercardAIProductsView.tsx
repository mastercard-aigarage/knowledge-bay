import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import './MastercardAIProductsView.css';
import './AIGEventsHackathonsOverlay.css';
import { content } from '../content/content';

function toSentenceCase(input: string): string {
  const text = input.trim();
  if (!text) return '';

  // Only aggressively downcase when the string looks like ALL CAPS.
  const lettersOnly = text.replace(/[^A-Za-z]+/g, '');
  const isAllCaps = lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase();
  let normalized = isAllCaps ? text.toLowerCase() : text;

  if (isAllCaps) {
    normalized = normalized
      .replace(/\bai\b/g, 'AI')
      .replace(/\baig\b/g, 'AIG')
      .replace(/\bmastercard\b/g, 'Mastercard');
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

interface MastercardAIProductsViewProps {
  onBack: () => void;
}

const MastercardAIProductsView: React.FC<MastercardAIProductsViewProps> = ({ onBack }) => {
  const copy = content.pages.mcProducts;

  const videos = useMemo(
    () => [
      {
        name: 'MC Facts',
        description: '',
        src: new URL('../../assets/videos/0.mp4', import.meta.url).toString()
      },
      {
        name: '3 Points',
        description: '',
        src: new URL('../../assets/videos/1.mp4', import.meta.url).toString()
      },
      {
        name: 'Evolution 4 points',
        description: '',
        src: new URL('../../assets/videos/2.mp4', import.meta.url).toString()
      },
      {
        name: '4 points',
        description: '',
        src: new URL('../../assets/videos/3.mp4', import.meta.url).toString()
      }
    ],
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const length = videos.length;
  const current = length > 0 ? videos[clampIndex(activeIndex, length)] : null;

  const focusNext = () => setActiveIndex((prev) => clampIndex(prev + 1, length));
  const focusPrev = () => setActiveIndex((prev) => clampIndex(prev - 1, length));

  useEffect(() => {
    setIsPlaying(true);
    setProgress(0);
  }, [activeIndex]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const el = videoRef.current;
      setIsFullscreen(Boolean(el && document.fullscreenElement === el));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    onFullscreenChange();
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const togglePlayPause = async () => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      try {
        await el.play();
        setIsPlaying(true);
      } catch {
        // ignore autoplay/play rejections
      }
      return;
    }

    el.pause();
    setIsPlaying(false);
  };

  const seekToRatio = (ratio: number) => {
    const el = videoRef.current;
    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
    const clamped = Math.min(1, Math.max(0, ratio));
    el.currentTime = clamped * el.duration;
    setProgress(clamped);
  };

  const toggleFullscreen = async () => {
    const el = videoRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
      return;
    }

    try {
      await el.requestFullscreen();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
      const isTypingTarget = tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button';

      if (event.key === 'Escape') {
        event.preventDefault();
        onBack();
        return;
      }

      if ((event.code === 'Space' || event.key === ' ') && !isTypingTarget) {
        event.preventDefault();
        void togglePlayPause();
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

  return (
    <motion.section
      className="mc-products-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      aria-label="AI in Mastercard products"
    >
      <motion.button
        type="button"
        className="mc-products-back"
        onClick={onBack}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ x: -4 }}
        aria-label="Back to AI Evolution"
        title="Back"
      >
        {copy.backButton?.text ?? '← AI Evolution'}
      </motion.button>

      <div className="mc-products-hero">
        <motion.h1
          className="mc-products-title"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          {copy.title?.text ?? 'AI in Mastercard'}
        </motion.h1>
        <motion.p
          className="mc-products-subtitle"
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.65, ease: 'easeOut' }}
        >
          {toSentenceCase(copy.subtitle?.text ?? '')}
        </motion.p>
      </div>

      <div className="mc-products-media">
        <div className="aig-events-carousel" aria-label="AI at Mastercard videos">
          <button
            type="button"
            className="aig-events-nav aig-events-nav-left"
            onClick={focusPrev}
            disabled={length <= 1}
            aria-label="Previous video"
            title="Previous"
          >
            <span className="aig-events-nav-icon" aria-hidden="true">
              ‹
            </span>
          </button>

          <div className="aig-events-card-shell">
            <AnimatePresence mode="wait" initial={false}>
              {current ? (
                <motion.div
                  key={`${current.name}-${activeIndex}`}
                  className="aig-events-card"
                  initial={{ opacity: 0, x: 22, scale: 0.99 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -22, scale: 0.99 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <div className="aig-events-card-imageWrap" aria-hidden="true">
                    <video
                      className="aig-events-card-image"
                      src={current.src}
                      muted
                      loop
                      autoPlay
                      playsInline
                      preload="metadata"
                      ref={videoRef}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onLoadedMetadata={(e) => {
                        const el = e.currentTarget;
                        const ratio = el.duration ? el.currentTime / el.duration : 0;
                        setProgress(Number.isFinite(ratio) ? ratio : 0);
                      }}
                      onTimeUpdate={(e) => {
                        const el = e.currentTarget;
                        const ratio = el.duration ? el.currentTime / el.duration : 0;
                        setProgress(Number.isFinite(ratio) ? ratio : 0);
                      }}
                      onClick={() => {
                        void togglePlayPause();
                      }}
                    />
                    <div className="aig-events-card-gloss" />
                    <div className="aig-events-card-bottomFade" />

                    <div className="mc-video-controls" aria-hidden="false">
                      <button
                        type="button"
                        className="mc-video-play"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void togglePlayPause();
                        }}
                        aria-label={isPlaying ? 'Pause video' : 'Play video'}
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        <span aria-hidden="true">{isPlaying ? '❚❚' : '▶'}</span>
                      </button>

                      <button
                        type="button"
                        className="mc-video-play mc-video-fullscreen"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void toggleFullscreen();
                        }}
                        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                      >
                        <span aria-hidden="true">{isFullscreen ? '⤡' : '⤢'}</span>
                      </button>

                      <div className="mc-video-progress" aria-hidden="false">
                        <input
                          className="mc-video-progressRange"
                          type="range"
                          min={0}
                          max={100}
                          step={0.1}
                          value={Math.round(progress * 1000) / 10}
                          aria-label="Seek video"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onChange={(e) => {
                            const next = Number(e.currentTarget.value);
                            if (!Number.isFinite(next)) return;
                            seekToRatio(next / 100);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft') {
                              e.preventDefault();
                              seekToRatio(progress - 0.02);
                            }
                            if (e.key === 'ArrowRight') {
                              e.preventDefault();
                              seekToRatio(progress + 0.02);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="aig-events-nav aig-events-nav-right"
            onClick={focusNext}
            disabled={length <= 1}
            aria-label="Next video"
            title="Next"
          >
            <span className="aig-events-nav-icon" aria-hidden="true">
              ›
            </span>
          </button>
        </div>

        <div className="mc-products-media-footer" aria-hidden="true">
          <div className="aig-events-counter">
            {clampIndex(activeIndex, length) + 1} / {length}
          </div>
          <div className="aig-events-hint">Use ← → to browse • Esc to go back</div>
        </div>
      </div>
    </motion.section>
  );
};

export default MastercardAIProductsView;
