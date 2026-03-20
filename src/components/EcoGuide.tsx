/**
 * EcoGuide.tsx — Eco Guide / Species Spotlight Page
 *
 * Displays a beautiful showcase of Flora & Fauna from the offline DB
 * with interactive species cards, interdependence diagram, and community data.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Globe, ChevronRight, Settings } from 'lucide-react';
import { getAllScans, type SpeciesScan } from '../db/db';

function SpeciesCard({ scan, side }: { scan: SpeciesScan; side: 'flora' | 'fauna' }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="glass-card"
      style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(52,211,153,0.07)',
      }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#a3e6c8', fontSize: '0.85rem' }}>
          {side === 'flora' ? 'Flora Focus' : 'Fauna Focus'}
        </div>
        <Settings size={14} color="#4b7a63" />
      </div>

      {/* Visual area */}
      <div style={{
        height: 220,
        background: 'linear-gradient(135deg, rgba(5,46,22,0.8), rgba(3,10,6,0.9))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glowing wireframe silhouette */}
        <div style={{
          width: 160, height: 160,
          borderRadius: '50%',
          border: '2px solid rgba(52,211,153,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            width: 120, height: 120,
            borderRadius: '50%',
            border: '1px solid rgba(52,211,153,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Leaf size={52} color="#34d399" style={{ opacity: 0.6 }} />
          </div>
          {/* Orbit dots */}
          {[0, 60, 120, 180, 240, 300].map(deg => (
            <div key={deg} style={{
              position: 'absolute',
              width: 6, height: 6,
              borderRadius: '50%',
              background: '#34d399',
              opacity: 0.4,
              top: `calc(50% + ${Math.sin(deg * Math.PI / 180) * 78}px)`,
              left: `calc(50% + ${Math.cos(deg * Math.PI / 180) * 78}px)`,
              transform: 'translate(-50%, -50%)',
            }} />
          ))}
        </div>

        {/* Glowing text overlay */}
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(5,46,22,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: '#34d399', marginBottom: 8 }}>
                ECOSYSTEM ROLE
              </div>
              <div style={{ color: '#a3e6c8', fontSize: '0.82rem', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>
                {scan.ecosystem_role}
              </div>
            </div>
          </motion.div>
        )}

        {/* Category label */}
        <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
          <span className="badge badge-green">
            {scan.conservation_status}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: 16 }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: '#4b7a63', marginBottom: 4 }}>
          Species Spotlight:
        </div>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#f0fdf4', marginBottom: 14 }}>
          {scan.species}
        </div>

        {[
          { label: 'Native Range', value: scan.native_range },
          { label: 'Conservation Status', value: scan.conservation_status },
          { label: side === 'flora' ? 'Care Level' : 'Diet', value: side === 'flora' ? 'Moderate' : 'Specialist' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ color: '#4b7a63', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif' }}>{label}:</span>
            <span style={{ color: '#a3e6c8', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
          </div>
        ))}

        <button className="btn-glow" style={{ width: '100%', justifyContent: 'center', marginTop: 14, padding: '8px 16px', fontSize: '0.8rem' }}>
          {side === 'flora' ? 'View Care Plan' : 'Learn Wildlife Habits'}
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Interdependence visual ────────────────────────────────────────────────────
function InterdependenceBox({ flora, fauna }: { flora?: SpeciesScan; fauna?: SpeciesScan }) {
  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#f0fdf4', fontSize: '0.9rem' }}>
          Interdependence
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Settings size={13} color="#4b7a63" />
          <Globe size={13} color="#4b7a63" />
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '24px 0',
        borderRadius: 12,
        background: 'rgba(52,211,153,0.03)',
        border: '1px solid rgba(52,211,153,0.08)',
        marginBottom: 14,
      }}>
        {/* Flora icon */}
        <div style={{
          width: 56, height: 56,
          borderRadius: '50%',
          border: '2px solid rgba(52,211,153,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(52,211,153,0.06)',
        }}>
          <Leaf size={24} color="#34d399" />
        </div>

        {/* Arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4b7a63' }}>
          <div style={{ width: 30, height: 1, background: 'rgba(52,211,153,0.3)' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
          <div style={{ width: 30, height: 1, background: 'rgba(52,211,153,0.3)' }} />
        </div>

        {/* Fauna icon */}
        <div style={{
          width: 56, height: 56,
          borderRadius: '50%',
          border: '2px solid rgba(96,165,250,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(96,165,250,0.06)',
        }}>
          <span style={{ fontSize: 24 }}>🐾</span>
        </div>
      </div>

      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', color: '#4b7a63', textAlign: 'center' }}>
        Local Plant/Animal Interdependence
      </div>

      <div style={{
        marginTop: 12,
        background: 'rgba(52,211,153,0.04)',
        border: '1px solid rgba(52,211,153,0.08)',
        borderRadius: 10,
        padding: '10px 12px',
      }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, color: '#34d399', fontSize: '0.8rem', marginBottom: 4 }}>
          Eco-Sync
        </div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', color: '#4b7a63', marginBottom: 8 }}>
          Local Plant/Animal Interdependence
        </div>
        <div style={{ color: '#a3e6c8', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>
          {fauna
            ? `Did you know? ${fauna.commonName}s are critical for local ecosystem pollination. Use local AI to map your ecosystem relations.`
            : 'Scan flora and fauna to discover their local interdependency relationships.'}
        </div>
      </div>
    </div>
  );
}

// ── Community Data Box ────────────────────────────────────────────────────────
function CommunityDataBox() {
  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#f0fdf4', fontSize: '0.9rem' }}>
          Community Data
        </div>
        <Settings size={13} color="#4b7a63" />
      </div>

      {/* Map illustration */}
      <div style={{
        height: 130,
        borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(5,46,22,0.6), rgba(3,10,6,0.9))',
        border: '1px solid rgba(52,211,153,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Simulated map dots */}
        {[
          { top: '20%', left: '15%' }, { top: '40%', left: '35%' }, { top: '60%', left: '55%' },
          { top: '30%', left: '70%' }, { top: '70%', left: '20%' }, { top: '50%', left: '80%' },
          { top: '80%', left: '45%' }, { top: '15%', left: '50%' }, { top: '55%', left: '10%' },
        ].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: pos.top, left: pos.left,
            width: 6, height: 6,
            borderRadius: '50%',
            background: '#34d399',
            opacity: 0.5 + Math.random() * 0.5,
            boxShadow: '0 0 8px rgba(52,211,153,0.5)',
          }} />
        ))}
        <Globe size={28} color="#34d399" style={{ opacity: 0.2 }} />
        <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
          <span className="badge badge-green" style={{ fontSize: '0.55rem' }}>154 Species Shared</span>
        </div>
      </div>

      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, color: '#a3e6c8', fontSize: '0.82rem', marginBottom: 6 }}>
        Global Community Map: 154 Flora/Fauna Shared
      </div>
      <div style={{ color: '#4b7a63', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>
        Share and explore biodiversity locally. Data is aggregated anonymously and processed without cloud data transfer.
      </div>
    </div>
  );
}

// ── Main EcoGuide page ────────────────────────────────────────────────────────
export default function EcoGuide() {
  const [scans, setScans] = useState<SpeciesScan[]>([]);

  useEffect(() => {
    getAllScans().then(setScans);
  }, []);

  const flora = scans.find(s => s.type === 'flora');
  const fauna = scans.find(s => s.type === 'fauna');

  // Fallback demo species if no scans exist
  const demoFlora: SpeciesScan = {
    id: 0,
    scannedAt: 0,
    species: 'Sequoia sempervirens',
    commonName: 'Coast Redwood',
    type: 'flora',
    confidence: 0.95,
    imageDataUrl: '',
    care_tasks: [],
    fun_facts: ['The tallest trees on Earth!'],
    toxicity_warnings: [],
    conservation_status: 'Endangered',
    native_range: 'California Coast',
    ecosystem_role: 'Keystone habitat provider for 300+ species.',
    health_notes: 'Monitor for bark beetles.',
  };

  const demoFauna: SpeciesScan = {
    id: 0,
    scannedAt: 0,
    species: 'Ailurus fulgens',
    commonName: 'Red Panda',
    type: 'fauna',
    confidence: 0.91,
    imageDataUrl: '',
    care_tasks: [],
    fun_facts: ['The original panda!'],
    toxicity_warnings: [],
    conservation_status: 'Endangered',
    native_range: 'Eastern Himalayas',
    ecosystem_role: 'Bamboo forest seed dispersal.',
    health_notes: 'Keep habitat cool (<24°C).',
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, padding: '80px 24px 32px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: '2.2rem',
          color: '#f0fdf4',
          marginBottom: 8,
        }}>
          Symbiotix Eco Guide:{' '}
          <span style={{
            background: 'linear-gradient(135deg, #34d399, #60a5fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Flora & Fauna in Harmony
          </span>
        </h1>
        <p style={{ color: '#4b7a63', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
          Discover ecological relationships between local species — all data processed locally on your device.
        </p>
      </motion.div>

      {/* 2-column spotlight grid + bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <SpeciesCard scan={flora ?? demoFlora} side="flora" />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <SpeciesCard scan={fauna ?? demoFauna} side="fauna" />
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <InterdependenceBox flora={flora ?? demoFlora} fauna={fauna ?? demoFauna} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <CommunityDataBox />
        </motion.div>
      </div>
    </div>
  );
}
