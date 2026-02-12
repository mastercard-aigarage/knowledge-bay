import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paper, PublicationVenueLocation } from '../types';
import './PaperModal.css';

interface PaperModalProps {
  location: PublicationVenueLocation | null;
  onClose: () => void;
}

const PaperModal: React.FC<PaperModalProps> = ({ location, onClose }) => {
  if (!location) return null;

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
              <h2 className="modal-title">{location.city}, {location.country}</h2>
            </div>
            <button className="close-button" onClick={onClose} aria-label="Close" title="Close">
              <span className="close-button-icon" aria-hidden="true">×</span>
            </button>
          </div>

          <div className="modal-body">
            <div className="papers-list">
              {location.conferences.map((conf, confIndex) => (
                <div key={`${conf.conferenceId}-${conf.year}`} style={{ marginBottom: '20px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <h3 className="paper-title" style={{ marginBottom: '4px' }}>
                      {conf.conferenceName} ({conf.year})
                    </h3>
                    {conf.date && <p className="modal-date">{conf.date}</p>}
                  </div>

                  {conf.papers.map((paper: Paper, index: number) => (
                    <motion.div
                      key={`${conf.conferenceId}-${conf.year}-${paper.id}`}
                      className="paper-card"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (confIndex * 0.05) + (index * 0.05) }}
                    >
                      <div className="paper-header">
                        <h4 className="paper-title">{paper.title}</h4>
                        <span className="paper-year">{paper.year}</span>
                      </div>

                      <div className="paper-authors">
                        {paper.authors.map((author, idx) => (
                          <span key={idx} className="author">
                            {author}
                            {idx < paper.authors.length - 1 && ', '}
                          </span>
                        ))}
                      </div>

                      <p className="paper-abstract">{paper.abstract}</p>

                      <div className="paper-keywords">
                        {paper.keywords.map((keyword, idx) => (
                          <span key={idx} className="keyword">{keyword}</span>
                        ))}
                      </div>

                      {paper.doi && (
                        <div className="paper-doi">
                          <span className="doi-label">DOI:</span>
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="doi-link"
                          >
                            {paper.doi}
                          </a>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaperModal;
