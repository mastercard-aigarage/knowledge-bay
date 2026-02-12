import { useEffect, useState } from 'react';
import './AITimelineView.css';
import TimelineApp from './TimelineApp';

type AITimelineViewProps = {
  onBack: () => void;
};

function ensureTimelineStyles(): { dispose: () => void; alreadyPresent: boolean } {
  const id = 'ai-timeline-styles';
  const overrideId = 'ai-timeline-style-overrides';
  const existing = document.getElementById(id);
  if (existing) {
    // Ensure our overrides exist even if the main stylesheet is already present.
    if (!document.getElementById(overrideId)) {
      const overrides = document.createElement('style');
      overrides.id = overrideId;
      overrides.textContent = `
html, body {
  background: #020409 !important;
  background-image: none !important;
}

#emergent-canvas {
  display: none !important;
}
      `.trim();
      document.head.appendChild(overrides);
    }

    return { dispose: () => {}, alreadyPresent: true };
  }

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  // Use Vite's base URL so the stylesheet resolves correctly when the app is hosted under a subpath
  // (e.g. GitHub Pages at https://username.github.io/repo/).
  // import.meta.env.BASE_URL is set by Vite at build time.
  link.href = `${import.meta.env.BASE_URL}ai-timeline/timeline.css`;
  document.head.appendChild(link);

  // Override the timeline's global `body` background so it matches the rest of the app.
  // (timeline.css is a prebuilt bundle that sets its own body background-image.)
  const overrides = document.createElement('style');
  overrides.id = overrideId;
  overrides.textContent = `
html, body {
  background: #020409 !important;
  background-image: none !important;
}

#emergent-canvas {
  display: none !important;
}
  `.trim();
  document.head.appendChild(overrides);

  return {
    dispose: () => {
      link.remove();
      overrides.remove();
    },
    alreadyPresent: false
  };
}

export default function AITimelineView({ onBack }: AITimelineViewProps) {
  const [stylesReady, setStylesReady] = useState(false);

  useEffect(() => {
    // This view relies on window/document scrolling.
    const prevOverflowX = document.body.style.overflowX;
    const prevOverflowY = document.body.style.overflowY;
    document.body.style.overflowX = 'hidden';
    document.body.style.overflowY = 'auto';

    return () => {
      document.body.style.overflowX = prevOverflowX;
      document.body.style.overflowY = prevOverflowY;
    };
  }, []);

  useEffect(() => {
    const { alreadyPresent, dispose } = ensureTimelineStyles();

    if (alreadyPresent) {
      setStylesReady(true);
      return;
    }

    const link = document.getElementById('ai-timeline-styles') as HTMLLinkElement | null;
    if (!link) {
      setStylesReady(true);
      return;
    }

    const handleLoad = () => setStylesReady(true);
    const handleError = () => setStylesReady(true);

    link.addEventListener('load', handleLoad);
    link.addEventListener('error', handleError);

    // If the stylesheet is cached, load may not fire.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sheet = (link as any).sheet as CSSStyleSheet | null;
    if (sheet) setStylesReady(true);

    return () => {
      link.removeEventListener('load', handleLoad);
      link.removeEventListener('error', handleError);
      dispose();
    };
  }, []);

  return (
    <div className="ai-timeline-host">
      <button
        type="button"
        className="ai-timeline-back"
        onClick={onBack}
        aria-label="Back to AI Evolution"
        title="Back to AI Evolution"
      >
        <svg className="ai-timeline-back-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M19 12H5M5 12L12 19M5 12L12 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>

      {!stylesReady ? (
        <div className="ai-timeline-loading">Loading timeline…</div>
      ) : null}

      <TimelineApp />
    </div>
  );
}
