/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Dashboard.tsx — Bento-Box Eco Dashboard
 *
 * Displays identified species data in a premium 2x2 bento grid:
 *  Box 1: Superlist-style interactive care schedule
 *  Box 2: Eco-Sync toxicity / interdependence warnings
 *  Box 3: Fun facts with auto-rotation
 *  Box 4: Ecosystem stats (from Dexie)
 *
 * Left column: R3F 3D species model + species ID badge
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, AlertTriangle, Leaf, RefreshCw, Volume2,
  BarChart3, Zap, Globe, ChevronLeft, ChevronRight, Cpu,
  Activity, Trash2, Clock, Target, TreePine
} from 'lucide-react';
import {
  getAllScans, toggleCareTask, logCareTask,
  getEcosystemStats, deleteScan,
  type SpeciesScan, type EcosystemStats
} from '../db/db';
import { speakSummary } from '../lib/runAnywhereClient';
import { ParticleField, CoreIcosahedron, OrbitRing, HelixRing } from './three/ParticleScanner';

// ── 3D Entity Viewer ──────────────────────────────────────────────────────────
function EntityViewer({ scan }: { scan: SpeciesScan }) {
  const isFlora = scan.type === 'flora';
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Photo background */}
      {scan.imageDataUrl && (
        <img
          src={scan.imageDataUrl}
          alt={scan.commonName}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: 0.2,
          }}
        />
      )}
      {/* R3F 3D overlay */}
      <Canvas camera={{ position: [0, 0, 5.5], fov: 55 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} color={isFlora ? '#34d399' : '#60a5fa'} intensity={3} />
        <pointLight position={[-4, -4, -2]} color={isFlora ? '#059669' : '#3b82f6'} intensity={1.5} />
        <CoreIcosahedron />
        <ParticleField count={280} />
        {isFlora && <HelixRing />}
        <OrbitRing radius={2.0} speed={0.8} color={isFlora ? '#34d399' : '#60a5fa'} />
        <OrbitRing radius={2.6} speed={-0.5} color={isFlora ? '#059669' : '#3b82f6'} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.2} />
      </Canvas>
    </div>
  );
}

// ── Care Schedule Box ─────────────────────────────────────────────────────────
function CareScheduleBox({ scan, onRefresh }: { scan: SpeciesScan; onRefresh: () => void }) {
  const [tasks, setTasks] = useState(scan.care_tasks);

  const handleToggle = async (taskId: string, completed: boolean) => {
    if (!scan.id) return;
    await toggleCareTask(scan.id, taskId, completed);
    if (completed) await logCareTask(scan.id, taskId, tasks.find(t => t.id === taskId)?.task ?? '');
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const pct = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#f0fdf4', fontSize: '0.9rem' }}>
            Care Schedule
          </div>
          <div style={{ color: '#4b7a63', fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', marginTop: 2 }}>
            Interactive task list
          </div>
        </div>
        <div className="badge badge-green">
          {completedCount}/{tasks.length} done
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar-track" style={{ marginBottom: 14 }}>
        <motion.div className="progress-bar-fill" animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map(task => (
          <motion.label
            key={task.id}
            layout
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              background: task.completed ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${task.completed ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="checkbox"
              className="eco-checkbox"
              checked={task.completed}
              onChange={e => handleToggle(task.id, e.target.checked)}
              style={{ marginTop: 1 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.82rem',
                color: task.completed ? '#4b7a63' : '#a3e6c8',
                textDecoration: task.completed ? 'line-through' : 'none',
                lineHeight: 1.4,
              }}>
                {task.task}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Clock size={10} color="#4b7a63" />
                <span style={{ color: '#4b7a63', fontFamily: 'Space Mono, monospace', fontSize: '0.62rem' }}>
                  {task.frequency}
                </span>
              </div>
            </div>
            {task.completed && <CheckCircle2 size={14} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} />}
          </motion.label>
        ))}
      </div>
    </div>
  );
}

// ── Eco-Sync Box ──────────────────────────────────────────────────────────────
function EcoSyncBox({ scan }: { scan: SpeciesScan }) {
  const [relatedScans, setRelatedScans] = useState<SpeciesScan[]>([]);

  useEffect(() => {
    getAllScans().then(all => {
      // Cross reference: exclude current scan
      const others = all.filter(s => s.id !== scan.id);
      setRelatedScans(others.slice(0, 3));
    });
  }, [scan]);

  const hasWarnings = scan.toxicity_warnings.length > 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28,
          background: hasWarnings ? 'rgba(251,146,60,0.12)' : 'rgba(52,211,153,0.12)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={14} color={hasWarnings ? '#fb923c' : '#34d399'} />
        </div>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#f0fdf4', fontSize: '0.9rem' }}>
            Eco-Sync
          </div>
          <div style={{ color: '#4b7a63', fontFamily: 'Space Mono, monospace', fontSize: '0.62rem' }}>
            Toxicity & Interdependence
          </div>
        </div>
        {hasWarnings && (
          <span className="badge badge-orange" style={{ marginLeft: 'auto' }}>
            {scan.toxicity_warnings.length} ALERT{scan.toxicity_warnings.length > 1 ? 'S' : ''}
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hasWarnings ? (
          scan.toxicity_warnings.map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: w.severity === 'high' ? 'rgba(248,113,113,0.06)' :
                             w.severity === 'medium' ? 'rgba(251,146,60,0.06)' : 'rgba(234,179,8,0.06)',
                border: `1px solid ${w.severity === 'high' ? 'rgba(248,113,113,0.2)' :
                         w.severity === 'medium' ? 'rgba(251,146,60,0.2)' : 'rgba(234,179,8,0.2)'}`,
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#f0fdf4' }}>
                  ⚠ {w.targetSpecies}
                </div>
                <span className={`badge ${w.severity === 'high' ? 'badge-red' : w.severity === 'medium' ? 'badge-orange' : 'badge-blue'}`}>
                  {w.severity.toUpperCase()}
                </span>
              </div>
              <div style={{ color: '#a3e6c8', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                {w.description}
              </div>
            </motion.div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle2 size={32} color="#34d399" style={{ margin: '0 auto 8px' }} />
            <div style={{ color: '#34d399', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.9rem' }}>
              No Toxicity Conflicts
            </div>
            <div style={{ color: '#4b7a63', fontSize: '0.75rem', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
              Safe to coexist with scanned species
            </div>
          </div>
        )}

        {/* Cross-referenced species */}
        {relatedScans.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: '#4b7a63', fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', marginBottom: 8 }}>
              CROSS-REFERENCED WITH PAST SCANS
            </div>
            {relatedScans.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: s.type === 'flora' ? '#34d399' : '#60a5fa',
                  flexShrink: 0,
                }} />
                <span style={{ color: '#a3e6c8', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                  {s.commonName}
                </span>
                <span className={`badge ${s.type === 'flora' ? 'badge-green' : 'badge-blue'}`} style={{ marginLeft: 'auto', fontSize: '0.55rem' }}>
                  {s.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fun Facts Box ─────────────────────────────────────────────────────────────
function FunFactsBox({ scan }: { scan: SpeciesScan }) {
  const [factIdx, setFactIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFactIdx(i => (i + 1) % scan.fun_facts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [scan.fun_facts.length]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28,
          background: 'rgba(52,211,153,0.12)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={14} color="#34d399" />
        </div>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#f0fdf4', fontSize: '0.9rem' }}>
            Fun Facts
          </div>
          <div style={{ color: '#4b7a63', fontFamily: 'Space Mono, monospace', fontSize: '0.62rem' }}>
            Did you know?
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {scan.fun_facts.map((_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: i === factIdx ? '#34d399' : 'rgba(52,211,153,0.25)',
              transition: 'background 0.3s',
              cursor: 'pointer',
            }} onClick={() => setFactIdx(i)} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={factIdx}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          style={{
            flex: 1,
            background: 'rgba(52,211,153,0.04)',
            border: '1px solid rgba(52,211,153,0.1)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.65rem',
            color: '#34d399',
            letterSpacing: '0.1em',
          }}>
            FACT #{factIdx + 1} OF {scan.fun_facts.length}
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.88rem',
            color: '#a3e6c8',
            lineHeight: 1.65,
            flex: 1,
          }}>
            {scan.fun_facts[factIdx]}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Ecosystem role */}
      <div style={{
        marginTop: 10,
        background: 'rgba(52,211,153,0.04)',
        border: '1px solid rgba(52,211,153,0.08)',
        borderRadius: 10,
        padding: '10px 12px',
      }}>
        <div style={{ color: '#4b7a63', fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', marginBottom: 4 }}>
          ECOSYSTEM ROLE
        </div>
        <div style={{ color: '#a3e6c8', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
          {scan.ecosystem_role}
        </div>
      </div>
    </div>
  );
}

// ── Ecosystem Stats Box ───────────────────────────────────────────────────────
function EcosystemStatsBox({ stats, allScans }: { stats: EcosystemStats | null; allScans: SpeciesScan[] }) {
  const recentScans = allScans.slice(0, 4);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28,
          background: 'rgba(96,165,250,0.12)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Globe size={14} color="#60a5fa" />
        </div>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#f0fdf4', fontSize: '0.9rem' }}>
            Ecosystem Metrics
          </div>
          <div style={{ color: '#4b7a63', fontFamily: 'Space Mono, monospace', fontSize: '0.62rem' }}>
            Local data only · Stored offline
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Total Scans', value: stats?.totalScans ?? 0, icon: <Target size={12} />, color: '#34d399' },
          { label: 'Biodiversity', value: stats?.biodiversityIndex?.toFixed(1) ?? '0.0', icon: <Activity size={12} />, color: '#60a5fa' },
          { label: 'Flora', value: stats?.floraCount ?? 0, icon: <TreePine size={12} />, color: '#34d399' },
          { label: 'Fauna', value: stats?.faunaCount ?? 0, icon: <Cpu size={12} />, color: '#60a5fa' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 10,
            padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color, marginBottom: 4 }}>
              {icon}
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', color: '#4b7a63' }}>{label}</span>
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.4rem', color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent scans list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ color: '#4b7a63', fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', marginBottom: 8 }}>
          RECENT SCANS (LOCAL DB)
        </div>
        {recentScans.map(s => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: s.type === 'flora' ? 'rgba(52,211,153,0.1)' : 'rgba(96,165,250,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {s.type === 'flora' ? <Leaf size={12} color="#34d399" /> : <Cpu size={12} color="#60a5fa" />}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ color: '#a3e6c8', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.commonName}
              </div>
              <div style={{ color: '#4b7a63', fontSize: '0.62rem', fontFamily: 'Space Mono, monospace' }}>
                {new Date(s.scannedAt).toLocaleDateString()}
              </div>
            </div>
            <span className="badge badge-green" style={{ fontSize: '0.55rem' }}>
              {(s.confidence * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 10,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 12px',
        background: 'rgba(52,211,153,0.04)',
        borderRadius: 8,
        border: '1px solid rgba(52,211,153,0.08)',
      }}>
        <BarChart3 size={11} color="#34d399" />
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', color: '#34d399' }}>
          ✈ AIRPLANE MODE ACTIVE · DATA STORED LOCALLY
        </span>
      </div>
    </div>
  );
}

// ── Species Selector Sidebar ──────────────────────────────────────────────────
function SpeciesSidebar({
  scans,
  selectedId,
  onSelect,
  onDelete,
}: {
  scans: SpeciesScan[];
  selectedId: number | undefined;
  onSelect: (scan: SpeciesScan) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div style={{
      width: 240,
      background: 'rgba(10,26,15,0.7)',
      border: '1px solid rgba(52,211,153,0.1)',
      borderRadius: 16,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      maxHeight: 560,
      overflowY: 'auto',
    }}>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#a3e6c8', fontSize: '0.82rem', marginBottom: 8 }}>
        Scan History
      </div>
      {scans.length === 0 && (
        <div style={{ color: '#4b7a63', fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', textAlign: 'center', padding: '20px 0' }}>
          No scans yet.<br />Use the scanner to start.
        </div>
      )}
      {scans.map(scan => (
        <div key={scan.id}
          onClick={() => onSelect(scan)}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: selectedId === scan.id ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${selectedId === scan.id ? 'rgba(52,211,153,0.25)' : 'transparent'}`,
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.8rem', color: selectedId === scan.id ? '#34d399' : '#a3e6c8' }}>
                {scan.commonName}
              </div>
              <div style={{ color: '#4b7a63', fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', marginTop: 2 }}>
                {new Date(scan.scannedAt).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); if (scan.id) onDelete(scan.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b7a63', padding: 2 }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          <span className={`badge ${scan.type === 'flora' ? 'badge-green' : 'badge-blue'}`} style={{ marginTop: 6, fontSize: '0.55rem' }}>
            {scan.type === 'flora' ? '🌿' : '🐾'} {scan.type}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
interface DashboardProps {
  latestScan: SpeciesScan | null;
}

export default function Dashboard({ latestScan }: DashboardProps) {
  const [allScans, setAllScans] = useState<SpeciesScan[]>([]);
  const [selectedScan, setSelectedScan] = useState<SpeciesScan | null>(null);
  const [stats, setStats] = useState<EcosystemStats | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [scans, ecosystemStats] = await Promise.all([getAllScans(), getEcosystemStats()]);
    setAllScans(scans);
    setStats(ecosystemStats ?? null);
    if (!selectedScan && scans.length > 0) setSelectedScan(scans[0]);
    setLoading(false);
  }, [selectedScan]);

  useEffect(() => { loadData(); }, []);

  // When a new scan comes in from parent, refresh
  useEffect(() => {
    if (latestScan) {
      loadData();
      setSelectedScan(latestScan);
    }
  }, [latestScan]);

  const handleDelete = async (id: number) => {
    await deleteScan(id);
    if (selectedScan?.id === id) setSelectedScan(null);
    await loadData();
  };

  const handleSpeak = async () => {
    if (!selectedScan) return;
    setIsSpeaking(true);
    await speakSummary(selectedScan);
    setIsSpeaking(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="shimmer" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px' }} />
          <div style={{ color: '#4b7a63', fontFamily: 'Space Mono, monospace', fontSize: '0.8rem' }}>
            Loading offline database…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, padding: '80px 24px 32px' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="badge badge-green" style={{ marginBottom: 8, display: 'inline-flex' }}>
              <BarChart3 size={10} /> ECO DASHBOARD · OFFLINE DATA
            </div>
            {selectedScan ? (
              <h1 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                fontSize: '2rem',
                color: '#f0fdf4',
              }}>
                Species ID:{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #34d399, #60a5fa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {selectedScan.species}
                </span>
                {' '}
                <span style={{ color: '#4b7a63', fontSize: '1.1rem', fontWeight: 400 }}>
                  ({selectedScan.commonName})
                </span>
              </h1>
            ) : (
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#f0fdf4' }}>
                Eco Dashboard
              </h1>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={loadData} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)',
              color: '#34d399', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.82rem',
            }}>
              <RefreshCw size={14} /> Refresh
            </button>
            {selectedScan && (
              <button className="btn-glow" onClick={handleSpeak} disabled={isSpeaking}
                style={{ gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
              >
                <Volume2 size={14} /> {isSpeaking ? 'Speaking…' : 'Read Aloud'}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {allScans.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '80px 24px' }}
        >
          <div style={{
            width: 80, height: 80,
            background: 'rgba(52,211,153,0.06)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }} className="float-anim">
            <Leaf size={36} color="#34d399" />
          </div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#f0fdf4', fontSize: '1.4rem', marginBottom: 10 }}>
            No Scans Yet
          </h2>
          <p style={{ color: '#4b7a63', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', maxWidth: 380, margin: '0 auto' }}>
            Head to the Scanner tab to identify your first flora or fauna. All data is saved locally to your device.
          </p>
        </motion.div>
      ) : (
        /* Main dashboard layout */
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* Scan sidebar */}
          <SpeciesSidebar
            scans={allScans}
            selectedId={selectedScan?.id}
            onSelect={setSelectedScan}
            onDelete={handleDelete}
          />

          {/* Main content */}
          {selectedScan && (
            <motion.div
              key={selectedScan.id}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              style={{ flex: 1, display: 'grid', gridTemplateColumns: '40% 1fr', gap: 20, minHeight: 560 }}
            >
              {/* LEFT: 3D viewer + species badge */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', minHeight: 380 }}>
                  <EntityViewer scan={selectedScan} />
                </div>

                {/* Species ID badge */}
                <div className="glass-card" style={{ padding: 18 }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', color: '#4b7a63', marginBottom: 4 }}>
                    LOCAL AI ID
                  </div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#34d399' }}>
                    {selectedScan.species}
                  </div>
                  <div style={{ color: '#a3e6c8', fontSize: '0.85rem', marginBottom: 12 }}>
                    {selectedScan.commonName}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span className={`badge ${selectedScan.type === 'flora' ? 'badge-green' : 'badge-blue'}`}>
                      {selectedScan.type === 'flora' ? '🌿 FLORA' : '🐾 FAUNA'}
                    </span>
                    <span className="badge badge-green">
                      {(selectedScan.confidence * 100).toFixed(0)}% CONFIDENCE
                    </span>
                    {selectedScan.toxicity_warnings.length > 0 && (
                      <span className="badge badge-orange">
                        ⚠ {selectedScan.toxicity_warnings.length} WARNINGS
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Native Range', value: selectedScan.native_range },
                      { label: 'Conservation', value: selectedScan.conservation_status },
                      { label: 'Health Notes', value: selectedScan.health_notes },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', color: '#4b7a63', marginBottom: 2 }}>
                          {label.toUpperCase()}
                        </div>
                        <div style={{ color: '#a3e6c8', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: 2x2 bento grid */}
              <div className="bento-grid">
                {/* Box 1: Care Schedule */}
                <div className="glass-card" style={{ padding: 16, gridRow: 'span 1', minHeight: 280 }}>
                  <CareScheduleBox scan={selectedScan} onRefresh={loadData} />
                </div>

                {/* Box 2: Eco-Sync */}
                <div className="glass-card" style={{ padding: 16, gridRow: 'span 1', minHeight: 280 }}>
                  <EcoSyncBox scan={selectedScan} />
                </div>

                {/* Box 3: Fun Facts */}
                <div className="glass-card" style={{ padding: 16, gridRow: 'span 1', minHeight: 280 }}>
                  <FunFactsBox scan={selectedScan} />
                </div>

                {/* Box 4: Ecosystem Stats */}
                <div className="glass-card" style={{ padding: 16, gridRow: 'span 1', minHeight: 280 }}>
                  <EcosystemStatsBox stats={stats} allScans={allScans} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
