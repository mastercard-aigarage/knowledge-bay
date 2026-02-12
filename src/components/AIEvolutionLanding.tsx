import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import './AIEvolutionLanding.css';
import AIEvolutionCardCarousel, { AIEvolutionCard } from './AIEvolutionCardCarousel';
import { content } from '../content/content';
import { iconForKey } from '../content/iconRegistry';
import { resolveImagePath } from '../utils/resolveImagePath';

interface AIEvolutionLandingProps {
  onSelectTopic: (topicId: string) => void;
  onBack: () => void;
}

/* Cards are driven by Excel -> JSON (src/content/generated/ai-evolution-cards.json) */

const containerAnim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 }
};

const containerTransition = {
  duration: 0.5,
  ease: 'easeOut'
};

const AIEvolutionLanding: React.FC<AIEvolutionLandingProps> = ({ onSelectTopic, onBack }) => {
  const handleSelect = useCallback((id: string) => {
    onSelectTopic(id);
  }, [onSelectTopic]);

  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  const cards = useMemo<AIEvolutionCard[]>(
    () =>
      content.aiEvolutionCards.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        accent: c.accent,
        icon: iconForKey(c.iconKey)
      })),
    []
  );

  return (
    <section className="ai-evolution-landing">
      <motion.div
        className="ai-evolution-landing-inner"
        variants={containerAnim}
        initial="initial"
        animate="animate"
        transition={containerTransition}
      >
        <button
          type="button"
          className="back-button"
          onClick={handleBack}
          aria-label="Home"
          title="Home"
        >
          <img 
            src={resolveImagePath('assets/images/home.png')}
            alt="" 
            className="back-button-icon" 
            width="25" 
            height="25"
            aria-hidden="true"
          />
          Home
        </button>

        <div className="evolution-cards-section">
          <div className="evolution-carousel-section">
            <AIEvolutionCardCarousel
              cards={cards}
              onSelect={handleSelect}
              autoRotateMs={3500}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default React.memo(AIEvolutionLanding);
