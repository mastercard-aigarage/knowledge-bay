import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
// import ParticleBackground from './components/ParticleBackground';
import GridBackground from './components/GridBackground';
import ResearchGlobe from './components/ResearchGlobe';
import PaperModal from './components/PaperModal';
import TopicSidebar, { TopicOption } from './components/TopicSidebar';
import TopicLanding from './components/TopicLanding';
import LandingPage from './components/LandingPage';
import AIEvolutionLanding from './components/AIEvolutionLanding';
import AIGAIGateway from './components/AIGAIGateway';
import AIGEventsHackathonsPage, { AIGEventsMode } from './components/AIGEventsHackathonsPage';
import AIGUniversityCollaborationsPage from './components/AIGUniversityCollaborationsPage';
import MastercardHero from './components/MastercardHero';
import MastercardAIProductsView from './components/MastercardAIProductsView';
import AITimelineView from './aiTimeline/AITimelineView';
import { publicationVenues } from './data';
import { PublicationVenueLocation } from './types';
import { content } from './content/content';
import mcLogoUrl from '../assets/mc_logo.png';
import './App.css';

function App() {
  const [selectedLocation, setSelectedLocation] = useState<PublicationVenueLocation | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [view, setView] = useState<'initial' | 'landing' | 'ai-evolution' | 'ai-timeline' | 'aig-bridge' | 'aig-events' | 'aig-university' | 'globe' | 'mc-products'>('initial');
  const [aigEventsMode, setAigEventsMode] = useState<AIGEventsMode | null>(null);

  const viewFade = useMemo(
    () => ({ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.25 } }),
    []
  );

  const handleLocationClick = (location: PublicationVenueLocation) => {
    setSelectedLocation(location);
  };

  const handleCloseModal = () => {
    setSelectedLocation(null);
  };

  const topics: TopicOption[] = useMemo(() => {
    const counts = new Map<string, number>();
    let total = 0;

    for (const venue of publicationVenues) {
      for (const conf of venue.conferences) {
        for (const paper of conf.papers) {
          total += 1;
          counts.set(paper.topic, (counts.get(paper.topic) ?? 0) + 1);
        }
      }
    }

    const minTotal = 100;
    if (total < minTotal) {
      const deficit = minTotal - total;
      const othersKey = Array.from(counts.keys()).find((key) => key.toLowerCase() === 'others') ?? 'Others';
      counts.set(othersKey, (counts.get(othersKey) ?? 0) + deficit);
      total = minTotal;
    }

    const sorted = Array.from(counts.entries())
      .map(([id, count]) => ({ id, label: id, count }))
      .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label));

    return [{ id: 'all', label: 'All Topics', count: total }, ...sorted];
  }, []);

  const filteredVenueData = useMemo(() => {
    if (selectedTopicId === 'all') return publicationVenues;

    return publicationVenues
      .map((venue) => ({
        ...venue,
        conferences: venue.conferences
          .map((conf) => ({
            ...conf,
            papers: conf.papers.filter((p) => p.topic === selectedTopicId)
          }))
          .filter((conf) => conf.papers.length > 0)
      }))
      .filter((venue) => venue.conferences.length > 0);
  }, [selectedTopicId]);

  useEffect(() => {
    if (!selectedLocation) return;

    const stillVisible = filteredVenueData.find((l) => l.id === selectedLocation.id);
    if (!stillVisible) {
      setSelectedLocation(null);
      return;
    }

    setSelectedLocation(stillVisible);
  }, [filteredVenueData, selectedLocation]);

  useEffect(() => {
    // Safety: if we leave the AIG Events/Hackathons page, ensure mode can't linger.
    if (view !== 'aig-events') setAigEventsMode(null);
  }, [view]);

  const totalPapers = filteredVenueData.reduce(
    (sum, venue) => sum + venue.conferences.reduce((s, conf) => s + conf.papers.length, 0),
    0
  );
  const totalConferences = filteredVenueData.reduce((sum, venue) => sum + venue.conferences.length, 0);

  const displayPapers = useMemo(() => {
    const selected = topics.find((topic) => topic.id === selectedTopicId);
    return selected?.count ?? totalPapers;
  }, [topics, selectedTopicId, totalPapers]);

  const selectedTopicLabel = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId)?.label ?? 'All Topics';
  }, [topics, selectedTopicId]);

  const appCopy = content.pages.app;

  return (
    <div className={`app ${view === 'ai-timeline' ? 'app--ai-timeline' : ''}`}>
      {/* <ParticleBackground /> */}
      <GridBackground hidden={view === 'initial'} />

      <img
        className="mc-top-right-logo"
        src={mcLogoUrl}
        alt="Mastercard"
        draggable={false}
      />

      <MastercardHero 
        position={
          view === 'initial' ? 'center-particles' : 
          view === 'mc-products' ? 'bottom-left' :
          view === 'aig-events' ? 'bottom-left' :
          view === 'aig-bridge' ? 'center-mid' :
          view === 'ai-evolution' ? 'bottom-left' :
          view === 'ai-timeline' ? 'bottom-left' :
          'bottom-left'
        } 
        mode={'default'}
        logoVariant={view === 'aig-bridge' ? 'aig-gateway' : 'default'}
        logoCaption={view === 'aig-bridge' ? 'AI Garage' : undefined}
        onLogoClick={() => {
          setSelectedLocation(null);
          setView('initial');
        }}
      />

      <div className="content">
        <AnimatePresence mode="wait" initial={false}>
          {view === 'initial' ? (
            <motion.div key="initial" className="view-shell" {...viewFade}>
              <LandingPage
                onStart={() => {
                  setView('ai-evolution');
                }}
              />
            </motion.div>
          ) : view === 'ai-evolution' ? (
            <motion.div key="ai-evolution" className="view-shell" {...viewFade}>
              <AIEvolutionLanding
                onSelectTopic={(topicId) => {
                  if (topicId === 'ai-evolution') {
                    setSelectedLocation(null);
                    setView('ai-timeline');
                    return;
                  }

                  if (topicId === 'ai-mastercard') {
                    setSelectedLocation(null);
                    setView('mc-products');
                    return;
                  }

                  if (topicId === 'ai-aig') {
                    setSelectedLocation(null);
                    setView('aig-bridge');
                    return;
                  }

                  setSelectedTopicId(topicId);
                  setSelectedLocation(null);
                  setView('landing');
                }}
                onBack={() => {
                  setView('initial');
                }}
              />
            </motion.div>
          ) : view === 'ai-timeline' ? (
            <motion.div key="ai-timeline" className="view-shell" {...viewFade}>
              <AITimelineView
                onBack={() => {
                  setView('ai-evolution');
                }}
              />
            </motion.div>
          ) : view === 'aig-bridge' ? (
            <AIGAIGateway
              key="aig-bridge"
              onBack={() => {
                setView('ai-evolution');
              }}
              onOpenEventsHackathons={(mode) => {
                setAigEventsMode(mode);
                setView('aig-events');
              }}
              onSelect={(categoryId) => {
                if (categoryId === 'university-collaborations') {
                  setView('aig-university');
                  return;
                }

                // publications (and other categories) lead into the publications globe flow.
                setSelectedTopicId('all');
                setSelectedLocation(null);
                setView('landing');
              }}
            />
          ) : view === 'aig-events' ? (
            <motion.div key="aig-events" className="view-shell" {...viewFade}>
              <AIGEventsHackathonsPage
                mode={aigEventsMode ?? 'events'}
                onBack={() => {
                  setView('aig-bridge');
                }}
              />
            </motion.div>
          ) : view === 'aig-university' ? (
            <motion.div key="aig-university" className="view-shell" {...viewFade}>
              <AIGUniversityCollaborationsPage
                onBack={() => {
                  setView('aig-bridge');
                }}
              />
            </motion.div>
          ) : view === 'mc-products' ? (
            <MastercardAIProductsView
              key="mc-products"
              onBack={() => {
                setView('ai-evolution');
              }}
            />
          ) : view === 'landing' ? (
            <TopicLanding
              key="landing"
              topics={topics}
              selectedTopicId={selectedTopicId}
              onSelectTopic={(topicId) => {
                setSelectedTopicId(topicId);
                setSelectedLocation(null);
                setView('globe');
              }}
              onBack={() => {
                setView('aig-bridge');
              }}
            />
          ) : (
            <motion.div
              key="globe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="globe-view"
            >
              <TopicSidebar
                topics={topics}
                selectedTopicId={selectedTopicId}
                onSelectTopic={(topicId) => {
                  setSelectedTopicId(topicId);
                }}
              />

              <button
                type="button"
                className="home-button"
                onClick={() => {
                  setSelectedLocation(null);
                  setView('landing');
                }}
                aria-label="Back to topics"
                title="Back to topics"
              >
                {appCopy.backToTopics?.text ?? '← Back'}
              </button>

              <motion.header 
                className="header"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <motion.h1 
                  className="title"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                >
                  {selectedTopicId === 'all' ? 'AI Garage Papers' : selectedTopicLabel}
                </motion.h1>
                <motion.p 
                  className="subtitle subtitle--sentence"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  {'Explore our global research footprint'}
                </motion.p>
                
                
                <motion.div 
                  className="stats"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  <div className="stat-item">
                    <span className="stat-number">{displayPapers}</span>
                    <span className="stat-label">Papers Published</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-number">{totalConferences}</span>
                    <span className="stat-label">Conferences</span>
                  </div>
                </motion.div>
              </motion.header>

              <motion.div 
                className="globe-container"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 1, ease: 'easeOut' }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedTopicId}
                    className="globe-fade"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ResearchGlobe data={filteredVenueData} onLocationClick={handleLocationClick} />
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              <motion.div 
                className="instructions"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <div className="instruction-item">
                  <span className="instruction-icon">🖱️</span>
                  <span className="instruction-text">Click markers to view papers</span>
                </div>
                <div className="instruction-item">
                  <span className="instruction-icon">🌐</span>
                  <span className="instruction-text">Drag to rotate • Scroll to zoom</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedLocation && (
        <PaperModal location={selectedLocation} onClose={handleCloseModal} />
      )}
    </div>
  );
}

export default App;
