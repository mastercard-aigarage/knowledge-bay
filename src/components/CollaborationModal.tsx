import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { UniversityCollaborationLocation } from '../types';
import './PaperModal.css';

function looksLikeUrl(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v.startsWith('http://') || v.startsWith('https://');
}

interface CollaborationModalProps {
  location: UniversityCollaborationLocation | null;
  onClose: () => void;
}

const CollaborationModal: React.FC<CollaborationModalProps> = ({ location, onClose }) => {
  if (!location) return null;

  const subtitleParts = [location.city, location.country].map((s) => s.trim()).filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <h2 className="modal-title">{location.institution}</h2>
              {subtitleParts.length > 0 && <p className="modal-subtitle">{subtitleParts.join(', ')}</p>}
              <p className="modal-date">University collaboration</p>
            </div>
            <button className="close-button" onClick={onClose} aria-label="Close">
              <span className="close-button-icon" aria-hidden="true">×</span>
            </button>
          </div>

          <div className="modal-body">
            <div className="papers-list">
              <motion.div
                className="paper-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="paper-header">
                  <h3 className="paper-title">Collaboration Details</h3>
                  {(location.city || location.country) && (
                    <span className="paper-year">
                      {[location.city, location.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>

                {location.description && <p className="paper-abstract">{location.description}</p>}

                {location.focusAreas.length > 0 && (
                  <div className="paper-keywords">
                    {location.focusAreas.map((t) => (
                      <span key={t} className="keyword">{t}</span>
                    ))}
                  </div>
                )}

                {location.websiteLink && looksLikeUrl(location.websiteLink) && (
                  <div className="paper-doi">
                    <span className="doi-label">Website:</span>
                    <a
                      href={location.websiteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doi-link"
                    >
                      Visit website
                    </a>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CollaborationModal;
