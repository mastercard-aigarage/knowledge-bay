// @ts-nocheck
// src/components/Timeline.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
  useCallback,
} from "react";
import { TIMELINE_DATA, CATEGORIES } from "../data/timelineData";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { iconForKey } from "../../content/iconRegistry";

const MIN_CARD_WIDTH = 180;
const ROW_GAP = 10;
const TIME_MARKER_HEIGHT = 40;
const Z_INDEX_BASE = 20;
const Z_INDEX_HOVER = 100;
const MIN_CARD_HEIGHT = 70;
const MIN_EXPANDED_HEIGHT = 120;
const ROW_HEIGHT = 70;
const ZOOM_LEVELS = [1, 2, 3, 4, 6, 8];
// Cards view spine range
const SPINE_START_YEAR = 1950;
const SPINE_END_YEAR = 2025;

const SPINE_TOTAL_HEIGHT_PX = 2400;
const SPINE_TOP_PADDING_PX = 60;
// Larger bottom padding prevents the spine dot/labels from drifting below the last card
// when the page reaches max scroll and the spine translation clamps.
const SPINE_BOTTOM_PADDING_PX = 240;

const resolvePublicUrl = (url) => {
  if (!url) return url;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
  const normalized = url.startsWith('/') ? url.slice(1) : url;
  return `${import.meta.env.BASE_URL}${normalized}`;
};

// Helper function to detect and parse long-duration events
const getEventDuration = (event) => {
  if (!event.custom_date) return null;
  
  // Match patterns like "1970s-1980s" or "1990s"
  const decadeRangeMatch = event.custom_date.match(/(\d{4})s\s*-\s*(\d{4})s/);
  if (decadeRangeMatch) {
    const startYear = parseInt(decadeRangeMatch[1]);
    const endYear = parseInt(decadeRangeMatch[2]);
    const duration = endYear - startYear;
    if (duration >= 10) {
      return { startYear, endYear, duration, type: 'decade-range' };
    }
  }
  
  return null;
};

const BASE_ROW_COUNT_CARDS = 5;
const BASE_TIMELINE_ROWS = 6;
const MIN_ROW_COUNT = 4;
const MAX_ROW_COUNT = 12;

// Cards view components
const CardsView = React.memo(function CardsView({
  events,
  activeCategories,
  hoveredEvent,
  setHoveredEvent,
  autoScroll,
  setAutoScroll,
}) {
  const timelineRef = useRef(null);
  const spineRef = useRef(null);
  const { i18n, t } = useTranslation();
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [spineOffset, setSpineOffset] = useState(0);
  const [backgroundProgress, setBackgroundProgress] = useState(0);
  const [scrollSpeed, setScrollSpeed] = useState(0.3);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const autoScrollRef = useRef(null);
  const scrollCarryRef = useRef(0);
  const pausedUntilRef = useRef(0);
  const previousActiveIndexRef = useRef(0);
  const isResettingRef = useRef(false);
  const AUTO_SCROLL_SPEED = scrollSpeed; // pixels per frame

  const filteredEvents = useMemo(
    () => events.filter((event) => activeCategories[event.category]),
    [events, activeCategories]
  );
  const currentEvent = filteredEvents[activeEventIndex];

  // Calculate which event is in view and update scroll progress
  useEffect(() => {
    let ticking = false;

    const updateActiveCardAndSpine = () => {
      if (!timelineRef.current) return;
      // Skip updates during reset to prevent glitchy card highlighting
      if (isResettingRef.current) return;

      const cards = timelineRef.current.getElementsByClassName('event-card');
      if (!cards || cards.length === 0) return;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const maxScroll = documentHeight - viewportHeight;

      // Find the card closest to the middle of the viewport
      let closestCard = 0;

      if (scrollY >= maxScroll - 10) {
        closestCard = cards.length - 1;
      } else {
        const viewportMiddle = scrollY + viewportHeight / 2;
        let minDistance = Infinity;

        Array.from(cards).forEach((card, index) => {
          const rect = card.getBoundingClientRect();
          const cardMiddle = scrollY + rect.top + rect.height / 2;
          const distance = Math.abs(cardMiddle - viewportMiddle);

          if (distance < minDistance) {
            minDistance = distance;
            closestCard = index;
          }
        });
      }

      if (closestCard !== activeEventIndex) setActiveEventIndex(closestCard);

      const eventForSpine = filteredEvents[closestCard];
      if (!eventForSpine) return;

      const currentDate = new Date(
        eventForSpine.start_date.year,
        eventForSpine.start_date.month - 1,
        eventForSpine.start_date.day
      );
      const startDate = new Date(SPINE_START_YEAR, 0, 1);
      const endDate = new Date(SPINE_END_YEAR, 11, 31);
      const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
      const daysPassed = (currentDate - startDate) / (1000 * 60 * 60 * 24);
      const progress = daysPassed / totalDays;

      const normalizedProgress = Math.max(0, Math.min(1, progress));
      setBackgroundProgress(normalizedProgress);

      // Align the dot (and thus the timeline spine) to the active card's center on-screen.
      const spineHeight = SPINE_TOTAL_HEIGHT_PX;
      const dotPosition =
        SPINE_TOP_PADDING_PX +
        progress * (spineHeight - SPINE_TOP_PADDING_PX - SPINE_BOTTOM_PADDING_PX);
      const activeCardEl = cards[closestCard];
      const activeRect = activeCardEl.getBoundingClientRect();
      const desiredDotY = activeRect.top + activeRect.height / 2;

      const minOffset = -(spineHeight - viewportHeight);
      const targetOffset = Math.max(minOffset, Math.min(0, desiredDotY - dotPosition));
      setSpineOffset(targetOffset);
    };

    const handleScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateActiveCardAndSpine();
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    handleScrollOrResize();

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeEventIndex, filteredEvents]);

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll) {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
        autoScrollRef.current = null;
      }
      scrollCarryRef.current = 0;
      return;
    }

    let startTime = null;
    let isActive = true;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    const animate = (currentTime) => {
      if (!isActive) return;
      
      if (!startTime) startTime = currentTime;

      const currentScroll = window.scrollY;

      // Check if we've reached the bottom
      if (currentScroll >= maxScroll - 10) {
        // Highlight the last event first
        if (timelineRef.current) {
          const cards = timelineRef.current.getElementsByClassName("event-card");
          setActiveEventIndex(cards.length - 1);
        }
        
        // Small delay to show the last card highlighted, then reset
        setTimeout(() => {
          if (!isActive) return;
          
          // Flag that we're resetting to prevent scroll handler interference
          isResettingRef.current = true;
          
          // Reset to first event to sync spine before scrolling
          setActiveEventIndex(0);
          previousActiveIndexRef.current = 0;
          
          // Smoothly scroll back to absolute top
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
          
          // Wait for scroll to complete before restarting
          setTimeout(() => {
            if (!isActive) return;
            
            // Ensure we're at the very top and at first event
            setActiveEventIndex(0);
            previousActiveIndexRef.current = 0;
            // Ensure absolutely at top
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            
            // Re-enable scroll handler
            isResettingRef.current = false;
            
            startTime = null;
            autoScrollRef.current = requestAnimationFrame(animate);
          }, 1200);
        }, 1000);
        
        // Don't schedule another frame during reset
        return;
      } else {
        // Check if we're paused
        const now = Date.now();
        if (now < pausedUntilRef.current) {
          // Still paused, skip scrolling but schedule next frame
          autoScrollRef.current = requestAnimationFrame(animate);
          return;
        }
        
        // Continue scrolling down (accumulate sub-pixel movement)
        scrollCarryRef.current += AUTO_SCROLL_SPEED;
        const delta = Math.floor(scrollCarryRef.current);
        if (delta > 0) {
          scrollCarryRef.current -= delta;
          window.scrollBy(0, delta);
        }
        
        // Manually trigger update for active card to keep dot in sync
        if (timelineRef.current) {
          const cards = timelineRef.current.getElementsByClassName("event-card");
          const viewportHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const maxScrollCheck = documentHeight - viewportHeight;
          const currentScrollCheck = window.scrollY;

          // If we're at the bottom, highlight the last card
          if (currentScrollCheck >= maxScrollCheck - 10) {
            setActiveEventIndex(cards.length - 1);
          } else {
            const viewportMiddle = window.scrollY + viewportHeight / 2;

            let closestCard = 0;
            let minDistance = Infinity;

            Array.from(cards).forEach((card, index) => {
              const rect = card.getBoundingClientRect();
              const cardMiddle = window.scrollY + rect.top + rect.height / 2;
              const distance = Math.abs(cardMiddle - viewportMiddle);

              if (distance < minDistance) {
                minDistance = distance;
                closestCard = index;
              }
            });

            // Check if active card changed and pause if so
            if (closestCard !== previousActiveIndexRef.current) {
              previousActiveIndexRef.current = closestCard;
              pausedUntilRef.current = Date.now() + 10; // Pause for 10ms (0.01 seconds)
            }
            setActiveEventIndex(closestCard);
          }
        }
        
        autoScrollRef.current = requestAnimationFrame(animate);
      }
    };

    autoScrollRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    };
  }, [autoScroll, scrollSpeed]);

  const scrollToEvent = useCallback((index) => {
    const cards = timelineRef.current.getElementsByClassName("event-card");
    if (cards[index]) {
      const card = cards[index];
      const cardRect = card.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const offset =
        window.scrollY +
        cardRect.top -
        viewportHeight / 2 +
        cardRect.height / 2;

      // Handle edge cases
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const finalOffset = Math.max(0, Math.min(offset, maxScroll));

      // Use native smooth scrolling
      window.scrollTo({
        top: finalOffset,
        behavior: "smooth",
      });
    }
  }, []);

  return (
    <div
      className="relative font-sans cards-view"
      data-scroll-progress={backgroundProgress}
    >
      {/* Auto-scroll controls */}
      <div className="ai-timeline-controls">
        {/* Auto-scroll toggle button */}
        <button
          type="button"
          onClick={() => setAutoScroll(!autoScroll)}
          className="ai-timeline-control ai-timeline-control--play"
          title={autoScroll ? 'Stop auto-scroll' : 'Start auto-scroll'}
          aria-pressed={autoScroll}
        >
          {autoScroll ? (
            <svg className="ai-timeline-control-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="ai-timeline-control-icon" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </button>
        
        {/* Speed selector button */}
        <div className="ai-timeline-speed">
          <button
            type="button"
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="ai-timeline-control ai-timeline-control--speed"
            title="Scroll speed"
            aria-haspopup="menu"
            aria-expanded={showSpeedMenu}
          >
            <svg className="ai-timeline-control-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          
          {/* Speed menu */}
          {showSpeedMenu && (
            <div className="ai-timeline-speed-menu" role="menu">
              <button
                type="button"
                onClick={() => {
                  setScrollSpeed(0.3);
                  setShowSpeedMenu(false);
                }}
                className={`ai-timeline-speed-item ${scrollSpeed === 0.3 ? 'is-active' : ''}`}
                role="menuitemradio"
                aria-checked={scrollSpeed === 0.5}
              >
                Slow
              </button>
              <button
                type="button"
                onClick={() => {
                  setScrollSpeed(0.7);
                  setShowSpeedMenu(false);
                }}
                className={`ai-timeline-speed-item ${scrollSpeed === 0.7 ? 'is-active' : ''}`}
                role="menuitemradio"
                aria-checked={scrollSpeed === 1}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => {
                  setScrollSpeed(1);
                  setShowSpeedMenu(false);
                }}
                className={`ai-timeline-speed-item ${scrollSpeed === 1 ? 'is-active' : ''}`}
                role="menuitemradio"
                aria-checked={scrollSpeed === 1.5}
              >
                Fast
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main timeline */}
      <section
        ref={timelineRef}
        className="grid grid-cols-[120px_1fr]  mb-10 relative"
      >
        {/* Left column: Timeline spine */}
        <div ref={spineRef} className="sticky top-0 pl-8 h-screen">
          {/* Timeline container */}
          <div className="relative h-full">
            <div
              className="relative"
              style={{
                height: `${SPINE_TOTAL_HEIGHT_PX}px`,
                transform: `translateY(${spineOffset}px)`,
                transition: "transform 0.2s ease-out",
                willChange: "transform",
              }}
            >
              {/* Vertical line */}
              <div
                className="absolute left-1/2 transform -translate-x-1/2 w-[2px] bg-white/30"
                style={{ height: "100%" }}
              />

              {/* Moving dot */}
              <div
                className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300"
                style={{
                  top: `${(() => {
                    if (!currentEvent) return 60;
                    const currentDate = new Date(
                      currentEvent.start_date.year,
                      currentEvent.start_date.month - 1,
                      currentEvent.start_date.day
                    );
                    const startDate = new Date(SPINE_START_YEAR, 0, 1);
                    const endDate = new Date(SPINE_END_YEAR, 11, 31);
                    const totalDays =
                      (endDate - startDate) / (1000 * 60 * 60 * 24);
                    const daysPassed =
                      (currentDate - startDate) / (1000 * 60 * 60 * 24);
                    const progress = daysPassed / totalDays;

                    const usableHeight =
                      SPINE_TOTAL_HEIGHT_PX -
                      SPINE_TOP_PADDING_PX -
                      SPINE_BOTTOM_PADDING_PX;
                    return SPINE_TOP_PADDING_PX + progress * usableHeight;
                  })()}px`,
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
                }}
              />

              {/* Duration bars for decade-spanning events - only show for active event */}
              {(() => {
                const startDate = new Date(SPINE_START_YEAR, 0, 1);
                const endDate = new Date(SPINE_END_YEAR, 11, 31);
                const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
                const topPadding = SPINE_TOP_PADDING_PX;
                const bottomPadding = SPINE_BOTTOM_PADDING_PX;
                const usableHeight = SPINE_TOTAL_HEIGHT_PX - topPadding - bottomPadding;

                return filteredEvents.map((event, index) => {
                  // Only show duration bar for the active event
                  if (index !== activeEventIndex) return null;
                  
                  const duration = getEventDuration(event);
                  if (!duration) return null;

                  const startYearDate = new Date(duration.startYear, 0, 1);
                  const endYearDate = new Date(duration.endYear, 11, 31);
                  
                  const startDaysPassed = (startYearDate - startDate) / (1000 * 60 * 60 * 24);
                  const endDaysPassed = (endYearDate - startDate) / (1000 * 60 * 60 * 24);
                  
                  const startProgress = startDaysPassed / totalDays;
                  const endProgress = endDaysPassed / totalDays;
                  
                  const startPosition = topPadding + startProgress * usableHeight;
                  const endPosition = topPadding + endProgress * usableHeight;
                  const barHeight = endPosition - startPosition;

                  return (
                    <div
                      key={`duration-${index}`}
                      className="absolute left-1/2 transform -translate-x-1/2 transition-opacity duration-500"
                      style={{
                        top: `${startPosition}px`,
                        height: `${barHeight}px`,
                        width: '8px',
                      }}
                    >
                      {/* Background bar */}
                      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/30 via-orange-400/30 to-orange-500/30 rounded-full transition-all duration-500" />
                      {/* Glowing edge */}
                      <div className="absolute inset-0 bg-gradient-to-b from-orange-400/40 via-orange-300/40 to-orange-400/40 rounded-full blur-sm transition-all duration-500" />
                      {/* Start marker */}
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-orange-400 rounded-full shadow-lg transition-all duration-500" />
                      {/* End marker */}
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-orange-400 rounded-full shadow-lg transition-all duration-500" />
                    </div>
                  );
                });
              })()}

              {/* Year markers - update positioning */}
              {(() => {
                const years = [1950, 1960, 1970, 1980, 1990, 1997, 2005, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2023, 2024, 2025];
                const startDate = new Date(SPINE_START_YEAR, 0, 1);
                const endDate = new Date(SPINE_END_YEAR, 11, 31);
                const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);

                const totalSpacing = SPINE_TOTAL_HEIGHT_PX;
                const topPadding = SPINE_TOP_PADDING_PX;
                const bottomPadding = SPINE_BOTTOM_PADDING_PX;
                const usableHeight = totalSpacing - topPadding - bottomPadding;

                return years.map((year) => {
                  const yearDate = new Date(year, 0, 1);
                  const daysPassed =
                    (yearDate - startDate) / (1000 * 60 * 60 * 24);
                  const progress = daysPassed / totalDays;
                  const position = topPadding + progress * usableHeight;

                  return (
                    <div
                      key={`year-${year}`}
                      className="absolute left-1/2 transform -translate-x-full pr-4 text-right"
                      style={{
                        top: `${position}px`,
                        transform: "translate(-100%, -50%)",
                      }}
                    >
                      <span className="text-3xl font-bold whitespace-nowrap text-orange-400 year-glow">
                        {year}
                      </span>
                    </div>
                  );
                });
              })()}

              {/* Intermediate markers based on gap size */}
              {(() => {
                const years = [1950, 1960, 1970, 1980, 1990, 1997, 2005, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2023, 2024, 2025];
                const startDate = new Date(SPINE_START_YEAR, 0, 1);
                const endDate = new Date(SPINE_END_YEAR, 11, 31);
                const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
                const markers = [];

                const totalSpacing = SPINE_TOTAL_HEIGHT_PX;
                const topPadding = SPINE_TOP_PADDING_PX;
                const bottomPadding = SPINE_BOTTOM_PADDING_PX;
                const usableHeight = totalSpacing - topPadding - bottomPadding;

                // Generate intermediate markers based on gap between consecutive years
                for (let i = 0; i < years.length - 1; i++) {
                  const currentYear = years[i];
                  const nextYear = years[i + 1];
                  const gap = nextYear - currentYear;

                  if (gap >= 10) {
                    // For 10+ year gaps: add 5-year intervals
                    for (let y = currentYear + 5; y < nextYear; y += 5) {
                      const yearDate = new Date(y, 0, 1);
                      const daysPassed = (yearDate - startDate) / (1000 * 60 * 60 * 24);
                      const progress = daysPassed / totalDays;
                      const position = topPadding + progress * usableHeight;

                      markers.push(
                        <div
                          key={`year-${y}`}
                          className="absolute left-1/2 transform -translate-x-full pr-4 text-right"
                          style={{
                            top: `${position}px`,
                            transform: "translate(-100%, -50%)",
                          }}
                        >
                          <span className="text-sm font-medium whitespace-nowrap text-white/50">
                            {y}
                          </span>
                        </div>
                      );
                    }
                  } else if (gap === 2) {
                    // For 2-year gaps: add 1-year interval
                    const y = currentYear + 1;
                    const yearDate = new Date(y, 0, 1);
                    const daysPassed = (yearDate - startDate) / (1000 * 60 * 60 * 24);
                    const progress = daysPassed / totalDays;
                    const position = topPadding + progress * usableHeight;

                    markers.push(
                      <div
                        key={`year-${y}`}
                        className="absolute left-1/2 transform -translate-x-full pr-4 text-right"
                        style={{
                          top: `${position}px`,
                          transform: "translate(-100%, -50%)",
                        }}
                      >
                        <span className="text-sm font-medium whitespace-nowrap text-white/50">
                          {y}
                        </span>
                      </div>
                    );
                  }
                }

                return markers;
              })()}
            </div>
          </div>
        </div>

        <div className="space-y-8 py-12">
          {filteredEvents.map((event, index) => {
            // Use the Chinese version if the current language is 'zh'
            const localizedContent =
              i18n.language === "zh" && event.chinese
                ? event.chinese
                : event.text;

            const duration = getEventDuration(event);
            const isLongDuration = duration && duration.duration >= 10;

            return (
              <div
                key={index}
                className={`event-card p-6 relative ${
                  index === activeEventIndex ? "active" : ""
                } ${
                  isLongDuration ? "border-l-4 border-l-orange-500/50" : ""
                }`}
              >
                {isLongDuration && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500/30 via-orange-400/30 to-orange-500/30" />
                )}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {event.iconKey && iconForKey(event.iconKey) && (
                        <div className="flex-shrink-0 w-12 flex items-center justify-center rounded-full bg-orange-500/10 text-orange-400 self-stretch">
                          <div className="w-12 h-12 flex items-center justify-center">
                            {iconForKey(event.iconKey)}
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                <div className="text-sm text-white/60 font-medium tracking-wide flex items-center gap-2 flex-wrap">
                  <span 
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs border"
                    style={{
                      backgroundColor: 'rgba(255, 200, 31, 0.2)',
                      color: 'rgb(255, 200, 31)',
                      borderColor: 'rgba(255, 200, 31, 0.3)'
                    }}
                  >
                    {t("categories." + event.category)}
                  </span>
                  {event.custom_date || `${event.start_date.year}-${String(
                    event.start_date.month
                  ).padStart(2, "0")}-${String(event.start_date.day).padStart(
                    2,
                    "0"
                  )}`}
                </div>
                <div
                  className="font-serif text-2xl font-normal text-white leading-snug mt-2 ai-timeline-event-title"
                  // Use localized headline
                  dangerouslySetInnerHTML={{
                    __html: localizedContent.headline,
                  }}
                />
                      </div>
                    </div>
                <div
                  className="text-white/80 text-base leading-relaxed mt-3"
                  // Use localized text
                  dangerouslySetInnerHTML={{ __html: localizedContent.text }}
                />
                {/* Image always visible */}
                {event.media?.url && (
                  <div className="mt-4 overflow-hidden rounded-lg event-image-container">
                    <div className="relative" style={{ paddingBottom: '56.25%' }}>
                      <img
                        src={resolvePublicUrl(event.media.url)}
                        alt={event.media.alt || localizedContent.headline}
                        className="absolute inset-0 w-full h-full object-cover event-image-fade"
                        loading="eager"
                        onLoad={(e) => e.target.classList.add('loaded')}
                      />
                    </div>
                    {event.media.caption && (
                      <div className="text-xs text-white/50 mt-2 italic">
                        {event.media.caption}
                      </div>
                    )}
                    {event.media.source && (
                      <div className="text-xs text-white/40 mt-1 text-right">
                        Source: {event.media.source}
                      </div>
                    )}
                  </div>
                )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
});

const EventCard = React.memo(function EventCard({
  event,
  position,
  row,
  totalRows,
  isHovered,
  onHover,
  rowHeight,
  setActiveEventPositions,
}) {
  const { i18n, t } = useTranslation();
  const localizedContent =
    i18n.language === "zh" && event.chinese ? event.chinese : event.text;
  const baseOpacity = (Math.min(event.importance + 0.15, 3) / 3) * 0.4 - 0.2;
  const contentRef = useRef(null);
  const expandedContentRef = useRef(null);
  const [width, setWidth] = useState(MIN_CARD_WIDTH);
  const [expandedHeight, setExpandedHeight] = useState(MIN_EXPANDED_HEIGHT);

  // Add effect to update active position
  useEffect(() => {
    if (isHovered) {
      setActiveEventPositions(new Set([position]));
    }
  }, [isHovered, position]);

  useEffect(() => {
    setWidth(MIN_CARD_WIDTH);
  }, [event.id]);

  useLayoutEffect(() => {
    let mounted = true;
    if (contentRef.current && mounted) {
      const contentWidth = contentRef.current.offsetWidth;
      setWidth(Math.max(MIN_CARD_WIDTH, contentWidth + 40));
    }
    return () => {
      mounted = false;
    };
  }, [event.text.headline, event.id]);

  useEffect(() => {
    if (isHovered && expandedContentRef.current) {
      const baseHeight = contentRef.current.offsetHeight;
      const expandedContent = expandedContentRef.current.scrollHeight;
      const totalHeight = baseHeight + expandedContent + 32;
      setExpandedHeight(Math.max(MIN_EXPANDED_HEIGHT, totalHeight));
    }
  }, [isHovered]);

  const topPos = row * rowHeight + TIME_MARKER_HEIGHT + ROW_GAP * row;

  return (
    <motion.div
      className="event-card absolute"
      style={{
        left: `${position - 20}px`,
        top: `${topPos}px`,
        width: isHovered ? `${width + 40}px` : `${width}px`,
        height: isHovered ? `${expandedHeight}px` : `${MIN_CARD_HEIGHT}px`,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: isHovered ? Z_INDEX_HOVER : Z_INDEX_BASE,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        scale: 1.03,
        zIndex: Z_INDEX_HOVER,
      }}
      onMouseEnter={() => {
        onHover(event);
        setActiveEventPositions(new Set([position]));
      }}
      onMouseLeave={() => {
        onHover(null);
        setActiveEventPositions(new Set());
      }}
    >
      <div
        className={`
                    h-full rounded-lg border p-2 transition-all duration-200
                    ${isHovered ? "border-white/30" : "border-white/5"}
                    ${event.importance >= 2.5 ? "border-white/30" : ""}
                    ${isHovered ? "transform -translate-y-1" : ""} 
                `}
        style={{
          backgroundColor: isHovered
            ? "rgba(58, 58, 102, 0.95)"
            : `rgba(255, 255, 255, ${baseOpacity})`,
          backgroundImage: isHovered
            ? "radial-gradient(transparent 1px, rgba(255, 255, 255, 0.12) 1px)"
            : "radial-gradient(transparent 1px, rgba(255, 255, 255, 0.05) 1px)",
          backgroundSize: "4px 4px",
          WebkitMaskImage: isHovered
            ? "none"
            : "linear-gradient(rgb(0, 0, 0) 60%, rgba(0, 0, 0, 0) 100%)",
          maskImage: isHovered
            ? "none"
            : "linear-gradient(rgb(0, 0, 0) 60%, rgba(0, 0, 0, 0) 100%)",
          boxShadow: isHovered
            ? `
                            0 0 0 1px rgba(255, 255, 255, 0.1),
                            0 4px 6px -1px rgba(0, 0, 0, 0.2),
                            0 12px 24px -4px rgba(0, 0, 0, 0.5),
                            0 0 20px rgba(255, 255, 255, 0.1),
                            inset 0 0 20px rgba(255, 255, 255, 0.05)
                          `
            : "none",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="relative z-10" ref={contentRef}>
          <div
            className={`
                            font-serif leading-snug mb-1 text-lg ai-timeline-event-title
                            ${isHovered ? "text-white" : "text-white/90"}
                        `}
            dangerouslySetInnerHTML={{ __html: localizedContent.headline }}
          />
          <div className="text-sm font-sans text-white/60 font-medium">
            {`${String(event.start_date.month).padStart(2, "0")}/${String(
              event.start_date.day
            ).padStart(2, "0")}/${event.start_date.year}`}
          </div>
          <div
            className={`text-xs font-sans mt-1 ${
              isHovered ? "text-gray/50" : "text-white/0"
            }`}
          >
            {t("categories." + event.category)}
          </div>
          <AnimatePresence>
            {isHovered && (
              <motion.div
                ref={expandedContentRef}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm font-sans text-white/80 mt-1 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: localizedContent.text }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

/* 
  Use React.memo on TimeMarker for the same reason.
*/
const TimeMarker = React.memo(function TimeMarker({ date, position }) {
  return (
    <div
      className="absolute top-0 h-full select-none pointer-events-none z-0"
      style={{ left: `${position}px` }}
    >
      <div className="relative">
        <div className="absolute top-0 text-sm font-sans text-white/40 font-medium whitespace-nowrap transform -translate-x-1/2">
          {`${date.toLocaleDateString("en-US", { month: "short" })} '${date
            .getFullYear()
            .toString()
            .slice(2)}`}
        </div>
        <div className="absolute top-[30px] h-full border-l border-white/10" />
      </div>
    </div>
  );
});

const YearMarker = React.memo(function YearMarker({ year, position }) {
  return (
    <div
      className="absolute -bottom-14 select-none pointer-events-none z-0"
      style={{ left: `${position}px` }}
    >
      <div className="relative">
        <div
          className="
                        absolute text-xl font-sans text-white/60 font-medium
                        whitespace-nowrap transform -translate-x-1/2
                        year-glow
                    "
        >
          {year}
        </div>
        <div />
      </div>
    </div>
  );
});

const TickMarker = React.memo(function TickMarker({
  position,
  isYearTick,
  hasEvent,
  isActive,
  rowHeights,
}) {
  const lineHeight = rowHeights ? rowHeights : "500px";

  return (
    <div
      className="absolute select-none pointer-events-none z-0 -bottom-8"
      style={{ left: `${position}px` }}
    >
      <div className="relative">
        <div
          className={`
                        absolute left-0
                        ${
                          isYearTick
                            ? "border-l h-6 border-white/40"
                            : "border-l h-3 border-white/20"
                        }
                    `}
        />
        {hasEvent && (
          <>
            <div
              className={`
                                absolute w-[2px] transition-opacity duration-300
                                ${
                                  isActive
                                    ? "bg-gradient-to-b from-white/10 via-white/20 to-white/20 opacity-100"
                                    : "bg-gradient-to-b from-transparent via-white/10 to-white/20 opacity-30"
                                }
                            `}
              style={{
                height: lineHeight,
                bottom: "4px",
                left: "3px",
                transform: "translateX(-50%)",
              }}
            />
            <div
              className={`
                                absolute w-[6px] h-[6px] bg-white/60 rounded-full -bottom-2
                                transition-all duration-300
                                ${
                                  isActive
                                    ? "bg-white scale-150"
                                    : "bg-white/60 scale-100"
                                }
                            `}
              style={{ left: "0px" }}
            />
          </>
        )}
      </div>
    </div>
  );
});

export default function Timeline({ autoScroll, setAutoScroll }) {
  const { t } = useTranslation();

  const [activeCategories, setActiveCategories] = useState(() => {
    const categoriesRecord = {};
    Object.values(CATEGORIES).forEach((cat) => {
      categoriesRecord[cat] = true;
    });
    return categoriesRecord;
  });

  const [hoveredEvent, setHoveredEvent] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(2);
  // Force cards-only view
  const viewMode = "cards";
  const pixelsPerDay = ZOOM_LEVELS[zoomIndex];
  const [activeEventPositions, setActiveEventPositions] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Remove mobile-based view switching; always use cards view.

  const toggleCategory = (category) => {
    setActiveCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const events = useMemo(() => {
    return [...TIMELINE_DATA.events].sort((a, b) => {
      const dateA = new Date(
        a.start_date.year,
        a.start_date.month - 1,
        a.start_date.day
      );
      const dateB = new Date(
        b.start_date.year,
        b.start_date.month - 1,
        b.start_date.day
      );
      return dateA - dateB;
    });
  }, []);

  const rowCount = useMemo(() => {
    if (viewMode === "cards") {
      return BASE_ROW_COUNT_CARDS;
    }
    const dynamic = BASE_TIMELINE_ROWS + (3 - zoomIndex) * 2;
    return Math.min(MAX_ROW_COUNT, Math.max(dynamic, MIN_ROW_COUNT));
  }, [viewMode, zoomIndex]);

  const positionedEvents = useMemo(() => {
    const startDate = new Date(2015, 1, 1);
    const filteredEvents = events.filter(
      (event) => activeCategories[event.category]
    );

    // Instead of storing arrays of positions, store the "rightmost X" per row
    let rowRightEdges = Array(rowCount).fill(0);

    // Sort filtered events by ascending date
    const sortedEvents = [...filteredEvents].sort((a, b) => {
      const dateA = new Date(
        a.start_date.year,
        a.start_date.month - 1,
        a.start_date.day
      );
      const dateB = new Date(
        b.start_date.year,
        b.start_date.month - 1,
        b.start_date.day
      );
      return dateA - dateB;
    });

    return sortedEvents.map((event) => {
      const date = new Date(
        event.start_date.year,
        event.start_date.month - 1,
        event.start_date.day
      );
      const daysSinceStart = (date - startDate) / (1000 * 60 * 60 * 24);
      const position = daysSinceStart * pixelsPerDay;

      // Try to find the row with the best fit
      let chosenRow = 0;
      let bestRightEdge = Infinity;

      for (let i = 0; i < rowCount; i++) {
        // If this row's right edge is sufficiently behind this event's position, it won't overlap
        // We can allow some small buffer. Let's say 0.8 * MIN_CARD_WIDTH as a safety margin
        if (rowRightEdges[i] + MIN_CARD_WIDTH * 0.8 < position) {
          // This row is a viable candidate.
          // We choose the row that is the "most behind" but still doesn't overlap
          // so we fill from top to bottom, left to right.
          if (rowRightEdges[i] < bestRightEdge) {
            bestRightEdge = rowRightEdges[i];
            chosenRow = i;
          }
        }
      }

      // If we never updated bestRightEdge (still Infinity), it means no row was sufficiently behind.
      // So just pick whichever row has the smallest right edge, to minimize overlap
      if (bestRightEdge === Infinity) {
        let minRowIndex = 0;
        for (let i = 1; i < rowCount; i++) {
          if (rowRightEdges[i] < rowRightEdges[minRowIndex]) {
            minRowIndex = i;
          }
        }
        chosenRow = minRowIndex;
      }

      // Update that row's right edge. We'll assume a base width for the event.
      // A typical guess might be MIN_CARD_WIDTH to keep it simple, or you could try to store
      // event-specific widths in some array once they're rendered.
      rowRightEdges[chosenRow] = position + MIN_CARD_WIDTH;

      return {
        ...event,
        position,
        row: chosenRow,
      };
    });
  }, [events, pixelsPerDay, activeCategories, rowCount]);

  const timeMarkers = useMemo(() => {
    const startDate = new Date(2015, 1, 1);
    const endDate = new Date(2025, 2, 31);
    const markers = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      markers.push({
        date: new Date(currentDate),
        position:
          ((currentDate - startDate) / (1000 * 60 * 60 * 24)) * pixelsPerDay,
      });
      currentDate.setMonth(currentDate.getMonth() + 2);
    }

    return markers;
  }, [pixelsPerDay]);

  const yearMarkers = useMemo(() => {
    const years = [
      2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
    ];
    const startDate = new Date(2015, 1, 1);

    return years.map((yr) => {
      const yearStart = new Date(yr, 0, 1);
      const nextYearStart = new Date(yr, 0, 1);
      const midYearTime = (yearStart.getTime() + nextYearStart.getTime()) / 2;
      const midYearDate = new Date(midYearTime);

      return {
        year: yr,
        position:
          ((midYearDate - startDate) / (1000 * 60 * 60 * 24)) * pixelsPerDay,
      };
    });
  }, [pixelsPerDay]);

  const tickMarkers = useMemo(() => {
    const startDate = new Date(2015, 1, 1);
    const endDate = new Date(2025, 2, 31);
    const ticks = [];

    // Create a map of positions to row heights
    const positionToRowHeight = {};
    const totalHeight =
      rowCount * (ROW_HEIGHT + ROW_GAP) + TIME_MARKER_HEIGHT + 130;

    positionedEvents.forEach((event) => {
      const rowMiddle =
        event.row * (ROW_HEIGHT + ROW_GAP) +
        ROW_HEIGHT / 2 +
        TIME_MARKER_HEIGHT;
      // Subtract from total height to get the correct line height
      positionToRowHeight[event.position] = `${totalHeight - rowMiddle}px`;
    });

    const eventDates = new Set(
      events.map(
        (event) =>
          new Date(
            event.start_date.year,
            event.start_date.month - 1,
            event.start_date.day
          )
            .toISOString()
            .split("T")[0]
      )
    );

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split("T")[0];
      const position =
        ((currentDate - startDate) / (1000 * 60 * 60 * 24)) * pixelsPerDay;

      ticks.push({
        position,
        isYearTick: false,
        hasEvent: eventDates.has(dateString),
        isActive: activeEventPositions.has(position),
        rowHeight: positionToRowHeight[position],
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    for (let year = 2022; year <= 2025; year++) {
      const janFirst = new Date(year, 0, 1);
      if (janFirst >= startDate && janFirst <= endDate) {
        const dateString = janFirst.toISOString().split("T")[0];
        const position =
          ((janFirst - startDate) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
        ticks.push({
          position,
          isYearTick: true,
          hasEvent: eventDates.has(dateString),
          isActive: activeEventPositions.has(position),
          rowHeight: positionToRowHeight[position],
        });
      }
    }

    ticks.sort((a, b) => a.position - b.position);

    return ticks;
  }, [pixelsPerDay, events, activeEventPositions, positionedEvents, rowCount]);

  const totalWidth = useMemo(() => {
    const startDate = new Date(2015, 1, 1);
    const endDate = new Date(2025, 2, 31);
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    return totalDays * pixelsPerDay + 200;
  }, [pixelsPerDay]);

  const zoomIn = () => {
    setZoomIndex((prev) => (prev < ZOOM_LEVELS.length - 1 ? prev + 1 : prev));
  };
  const zoomOut = () => {
    setZoomIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || viewMode !== "timeline") return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoomIndex((prev) =>
            prev < ZOOM_LEVELS.length - 1 ? prev + 1 : prev
          );
        } else {
          setZoomIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
      } else {
        e.preventDefault();
        container.scrollLeft += e.deltaY;

        if (e.deltaX !== 0) {
          container.scrollLeft += e.deltaX;
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [viewMode]);

  // Add this useEffect to set initial scroll position
  useEffect(() => {
    if (containerRef.current && viewMode === "timeline") {
      // Calculate position for 2022
      const startDate = new Date(2015, 1, 1);
      const targetDate = new Date(2022, 1, 1);
      const daysSinceStart = (targetDate - startDate) / (1000 * 60 * 60 * 24);
      const scrollPosition = daysSinceStart * pixelsPerDay;

      // Set the scroll position after a short delay to ensure the component is fully rendered
      setTimeout(() => {
        containerRef.current.scrollLeft = scrollPosition;
      }, 100);
    }
  }, [viewMode, pixelsPerDay]);

  // Add mouse drag handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container || viewMode !== "timeline") return;

    const handleMouseDown = (e) => {
      setIsDragging(true);
      setStartX(e.pageX - container.offsetLeft);
      setScrollLeft(container.scrollLeft);
      container.style.cursor = "grabbing";
      container.style.userSelect = "none";
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      container.style.cursor = "grab";
      container.style.userSelect = "auto";
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    };

    const handleMouseLeave = () => {
      setIsDragging(false);
      container.style.cursor = "grab";
      container.style.userSelect = "auto";
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [viewMode, isDragging, startX, scrollLeft]);

  return (
    <div className={`relative mx-auto max-w-[2000px] px-4 md:px-12 py-2`}>
      {viewMode === "timeline" && <div className="absolute inset-0" />}

      <div className="relative">
        <div className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
            {/* Category filter buttons removed */}
            {/* Removed view switch and timeline zoom controls */}
          </div>
        </div>
        {/* Cards-only view */}
        <CardsView
          events={events}
          activeCategories={activeCategories}
          hoveredEvent={hoveredEvent}
          setHoveredEvent={setHoveredEvent}
          autoScroll={autoScroll}
          setAutoScroll={setAutoScroll}
        />
      </div>
    </div>
  );
}
