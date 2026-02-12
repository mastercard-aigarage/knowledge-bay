import { motion } from 'framer-motion';
import './AIGUniversityCollaborationsPage.css';
import { content } from '../content/content';
import { useMemo } from 'react';
import UniversityCollaborationsGlobe from './UniversityCollaborationsGlobe';
import { toTitleCase } from '../utils/toTitleCase';

interface AIGUniversityCollaborationsPageProps {
  onBack: () => void;
}

const AIGUniversityCollaborationsPage: React.FC<AIGUniversityCollaborationsPageProps> = ({ onBack }) => {
  const node = content.aigGatewayNodes.find((n) => n.id === 'university-collaborations');
  const items = content.universityCollaborations;
  const backLabel = content.pages.aigGateway.backButton?.text ?? '← Back';

  const { globeItems, missingCoordCount } = useMemo(() => {
    const withCoords = items.filter((d) => typeof d.lat === 'number' && typeof d.lng === 'number');
    return { globeItems: withCoords, missingCoordCount: items.length - withCoords.length };
  }, [items]);

  return (
    <motion.section
      className="aig-uni-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      aria-label={node?.title ?? 'University Collaborations'}
    >
      <button type="button" className="aig-uni-back" onClick={onBack} aria-label="Back" title="Back">
        {backLabel}
      </button>

      <header className="aig-uni-hero">
        <h1 className="aig-uni-title">{node?.title ?? 'University Collaborations'}</h1>
        <p className="aig-uni-subtitle">{toTitleCase(node?.subtitle ?? '')}</p>
        {missingCoordCount > 0 && (
          <p className="aig-uni-note">
            {missingCoordCount} entr{missingCoordCount === 1 ? 'y is' : 'ies are'} missing coordinates and won't appear on the globe until Lat/Lng are filled in Excel.
          </p>
        )}
      </header>

      <div className="aig-uni-globe">
        {globeItems.length > 0 ? (
          <UniversityCollaborationsGlobe data={globeItems} />
        ) : (
          <div className="aig-uni-empty">No collaborations with coordinates found.</div>
        )}
      </div>
    </motion.section>
  );
};

export default AIGUniversityCollaborationsPage;
