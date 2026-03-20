/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Symbiotix — Root Application
 *
 * Manages top-level routing (no React Router needed for this SPA),
 * Framer Motion page transitions, and state shared between pages.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import EcoGuide from './components/EcoGuide';
import type { SpeciesScan } from './db/db';

// Page route type — exported so child components can navigate programmatically
export type Page = 'home' | 'scanner' | 'dashboard' | 'eco-guide';

// ── Page transition variants ──────────────────────────────────────────────────
const pageVariants = {
  initial:  { opacity: 0, y: 16, filter: 'blur(4px)' },
  enter:    { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:     { opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.3 } },
};

// ── Background gradient mesh ──────────────────────────────────────────────────
function BackgroundMesh() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {/* Primary emerald radial */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '60vw',
        height: '60vh',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(5,46,22,0.35) 0%, transparent 70%)',
      }} />
      {/* Secondary bottom-left glow */}
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-5%',
        width: '50vw',
        height: '50vh',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(5,46,22,0.25) 0%, transparent 70%)',
      }} />
      {/* Subtle green grid lines */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(52,211,153,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(52,211,153,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
      }} />
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [latestScan, setLatestScan] = useState<SpeciesScan | null>(null);

  const handleScanComplete = (scan: SpeciesScan) => {
    setLatestScan(scan);
    // Auto-navigate to dashboard after successful scan
    setTimeout(() => setCurrentPage('dashboard'), 600);
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--clr-bg)' }}>
      {/* Decorative background */}
      <BackgroundMesh />

      {/* Navbar (always visible, except on landing) */}
      {currentPage !== 'home' && (
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      )}

      {/* Page content – animated transitions */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div key="home" variants={pageVariants} initial="initial" animate="enter" exit="exit">
              {/* Minimal top bar for landing */}
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                padding: '16px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(180deg, rgba(3,10,6,0.98) 0%, rgba(3,10,6,0.8) 100%)',
                borderBottom: '1px solid rgba(52,211,153,0.06)',
                backdropFilter: 'blur(20px)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32,
                    background: 'linear-gradient(135deg, #059669, #34d399)',
                    borderRadius: '9px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(52,211,153,0.4)',
                  }}>
                    <span style={{ fontSize: 16 }}>🌿</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#f0fdf4', fontSize: '1rem' }}>
                      Symbiotix
                    </div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', color: '#4b7a63' }}>
                      SMART ECO ASSISTANT · OFFLINE AI
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {(['scanner', 'dashboard', 'eco-guide'] as Page[]).map(p => (
                    <button
                      key={p}
                      onClick={() => handleNavigate(p)}
                      style={{
                        padding: '6px 14px', borderRadius: 8,
                        background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)',
                        color: '#4b7a63', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
                        fontWeight: 600, fontSize: '0.82rem', textTransform: 'capitalize',
                      }}
                    >
                      {p.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <LandingHero onStart={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'scanner' && (
            <motion.div key="scanner" variants={pageVariants} initial="initial" animate="enter" exit="exit">
              <Scanner onScanComplete={handleScanComplete} />
            </motion.div>
          )}

          {currentPage === 'dashboard' && (
            <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="enter" exit="exit">
              <Dashboard latestScan={latestScan} />
            </motion.div>
          )}

          {currentPage === 'eco-guide' && (
            <motion.div key="eco-guide" variants={pageVariants} initial="initial" animate="enter" exit="exit">
              <EcoGuide />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
