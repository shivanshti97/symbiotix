/**
 * About.tsx — What is Symbiotix?
 * A clean info page explaining the app, its features, and offline-first philosophy.
 */

import { motion } from 'framer-motion';
import { Leaf, WifiOff, Cpu, ShieldCheck, Zap, Globe, Camera, Volume2, Mic } from 'lucide-react';
import type { Page } from '../App';

const FEATURES = [
  { icon: Camera, title: 'Species Scanner', desc: 'Point your camera at any plant or animal. On-device AI identifies it instantly — no internet required.' },
  { icon: Cpu, title: 'On-Device AI', desc: 'Powered by WebAssembly & WebGPU. The LLM runs entirely inside your browser — your images never leave your device.' },
  { icon: Leaf, title: 'Eco Dashboard', desc: 'Track identified species, care schedules, toxicity warnings, and biodiversity metrics — all stored locally.' },
  { icon: Globe, title: 'Eco Guide', desc: 'Explore ecological relationships between flora and fauna. Discover interdependencies in your local ecosystem.' },
  { icon: Volume2, title: 'Read Aloud (TTS)', desc: 'Neural text-to-speech reads species summaries aloud using Piper TTS — fully offline.' },
  { icon: Mic, title: 'Voice Assistant', desc: 'Ask questions about species using your voice. Speech recognition + LLM + TTS — all on-device.' },
  { icon: WifiOff, title: 'Airplane Mode Ready', desc: 'Works with zero internet. Models are cached in your browser after the first download.' },
  { icon: ShieldCheck, title: 'Privacy First', desc: 'No accounts, no tracking, no cloud APIs. Your data stays on your device, always.' },
];

interface AboutProps {
  onNavigate: (page: Page) => void;
}

export default function About({ onNavigate }: AboutProps) {
  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, padding: '80px 24px 48px' }}>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 56px' }}
      >
        <div style={{
          width: 72, height: 72,
          background: 'linear-gradient(135deg, #059669, #34d399)',
          borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 0 32px rgba(52,211,153,0.4)',
        }}>
          <Leaf size={36} color="#fff" />
        </div>

        <h1 style={{
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800,
          fontSize: '2.8rem', color: '#f0fdf4', lineHeight: 1.1, marginBottom: 16,
        }}>
          What is{' '}
          <span style={{
            background: 'linear-gradient(135deg, #34d399, #60a5fa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Symbiotix?
          </span>
        </h1>

        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '1.05rem',
          color: '#a3e6c8', lineHeight: 1.75, marginBottom: 24,
        }}>
          Symbiotix is a <strong style={{ color: '#34d399' }}>privacy-first, offline AI ecosystem assistant</strong> that
          runs entirely in your browser. Identify plants and animals, track their care, explore ecological
          relationships, and get voice-guided insights — all without sending a single byte to the cloud.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-glow"
            onClick={() => onNavigate('scanner')}
            style={{ gap: 8, padding: '12px 24px' }}
          >
            <Camera size={16} /> Try the Scanner
          </button>
          <button
            onClick={() => onNavigate('eco-guide')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 10,
              background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)',
              color: '#a3e6c8', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600, fontSize: '0.95rem',
            }}
          >
            <Globe size={16} /> Eco Guide
          </button>
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          maxWidth: 860, margin: '0 auto 48px',
          background: 'rgba(52,211,153,0.04)',
          border: '1px solid rgba(52,211,153,0.12)',
          borderRadius: 20, padding: '28px 32px',
        }}
      >
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: '#34d399', letterSpacing: '0.1em', marginBottom: 12 }}>
          HOW IT WORKS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { step: '01', title: 'Capture', desc: 'Take a photo with your camera or upload an image of any plant or animal.' },
            { step: '02', title: 'Identify', desc: 'The on-device LLM analyses the image and identifies the species in seconds.' },
            { step: '03', title: 'Explore', desc: 'Get care schedules, fun facts, toxicity warnings, and ecosystem data — all offline.' },
          ].map(({ step, title, desc }) => (
            <div key={step}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '1.8rem', fontWeight: 700, color: 'rgba(52,211,153,0.25)', marginBottom: 6 }}>
                {step}
              </div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#f0fdf4', fontSize: '1rem', marginBottom: 6 }}>
                {title}
              </div>
              <div style={{ color: '#4b7a63', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', lineHeight: 1.6 }}>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Features grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ maxWidth: 860, margin: '0 auto' }}
      >
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: '#34d399', letterSpacing: '0.1em', marginBottom: 20, textAlign: 'center' }}>
          FEATURES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="glass-card"
              style={{ padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(52,211,153,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color="#34d399" />
              </div>
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#f0fdf4', fontSize: '0.9rem', marginBottom: 4 }}>
                  {title}
                </div>
                <div style={{ color: '#4b7a63', fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', lineHeight: 1.6 }}>
                  {desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tech stack */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ maxWidth: 860, margin: '40px auto 0', textAlign: 'center' }}
      >
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: '#4b7a63', letterSpacing: '0.1em', marginBottom: 12 }}>
          BUILT WITH
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {['React + Vite', 'TypeScript', 'Three.js / R3F', 'Framer Motion', 'Dexie.js (IndexedDB)', 'RunAnywhere SDK', 'WebAssembly', 'WebGPU', 'Web Speech API', 'Tailwind CSS v4'].map(t => (
            <span key={t} className="badge badge-green" style={{ fontSize: '0.72rem' }}>{t}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
