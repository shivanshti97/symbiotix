/**
 * LandingHero.tsx — Zero State / Landing Screen
 *
 * The app's first impression: privacy-first messaging, tech spec badges,
 * and a full-viewport R3F particle hero scene.
 */

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Leaf, WifiOff, Zap, ShieldCheck, Cpu, Play } from 'lucide-react';
import * as THREE from 'three';
import type { Page } from '../App';

// ── Animated floating mesh ────────────────────────────────────────────────────
function FloatingMesh() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.x = t * 0.2;
      ref.current.rotation.y = t * 0.35;
      ref.current.position.y = Math.sin(t * 0.8) * 0.3;
    }
  });
  return (
    <mesh ref={ref}>
      <dodecahedronGeometry args={[1.5, 0]} />
      <meshStandardMaterial
        color="#052e16"
        emissive="#059669"
        emissiveIntensity={0.5}
        wireframe={false}
        roughness={0.2}
        metalness={0.9}
      />
    </mesh>
  );
}

function FloatingWireframe() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.x = -t * 0.15;
      ref.current.rotation.y = t * 0.25;
    }
  });
  return (
    <mesh ref={ref}>
      <dodecahedronGeometry args={[2.1, 0]} />
      <meshBasicMaterial color="#34d399" wireframe transparent opacity={0.2} />
    </mesh>
  );
}

// ── Particle cloud ────────────────────────────────────────────────────────────
function HeroParticles() {
  const ref = useRef<THREE.Points>(null!);
  const count = 500;
  const positions = new Float32Array(count * 3).map(() => (Math.random() - 0.5) * 12);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.04;
      ref.current.rotation.x += delta * 0.015;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#34d399" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

// ── Stat badge ────────────────────────────────────────────────────────────────
function StatBadge({ icon: Icon, label, sublabel }: { icon: any; label: string; sublabel: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass-card"
      style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'default' }}
    >
      <Icon size={22} color="#34d399" />
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0fdf4' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: '#4b7a63', textAlign: 'center', letterSpacing: '0.04em' }}>
        {sublabel}
      </div>
    </motion.div>
  );
}

interface LandingHeroProps {
  onStart: (page: Page) => void;
}

export default function LandingHero({ onStart }: LandingHeroProps) {
  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: 60,
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Hero section */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 48,
        padding: '60px 48px 40px',
        alignItems: 'center',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
      }}>

        {/* Left: Text content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        >


          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 800,
            fontSize: '3.2rem',
            lineHeight: 1.08,
            marginBottom: 20,
            color: '#f0fdf4',
          }}>
            Your Local Eco<br />
            <span style={{
              background: 'linear-gradient(135deg, #34d399 0%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Intelligent Partner.
            </span>
          </h1>

          <p style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 600,
            fontSize: '1.3rem',
            color: '#a3e6c8',
            marginBottom: 12,
          }}>
            Privacy First. Cloud Costs: $0.
          </p>

          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.95rem',
            color: '#4b7a63',
            lineHeight: 1.7,
            marginBottom: 32,
            maxWidth: 420,
          }}>
            Symbiotix identifies flora & fauna, maps ecological relationships, and provides
            personalised care schedules — all powered by WebAssembly & WebGPU running
            100% inside your browser. No servers. No cloud. No privacy compromises.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn-glow"
              onClick={() => onStart('scanner')}
              style={{ gap: 8, padding: '14px 28px', fontSize: '1rem' }}
            >
              <Play size={18} /> Start Local Scan
            </button>
            <button
              onClick={() => onStart('eco-guide')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 10,
                background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)',
                color: '#a3e6c8', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 600, fontSize: '1rem',
              }}
            >
              <Leaf size={18} /> Eco Guide
            </button>
          </div>

          {/* Offline indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.15)',
            }}>
              <WifiOff size={12} color="#34d399" />
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', color: '#34d399' }}>
                Offline
              </span>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            </div>
            <span style={{ color: '#4b7a63', fontFamily: 'Space Mono, monospace', fontSize: '0.7rem' }}>
              · Works in airplane mode
            </span>
          </div>
        </motion.div>

        {/* Right: 3D Hero scene */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
          style={{
            height: 520,
            borderRadius: 24,
            overflow: 'hidden',
            background: 'radial-gradient(ellipse at center, rgba(5,46,22,0.4) 0%, rgba(3,10,6,0.1) 100%)',
            border: '1px solid rgba(52,211,153,0.1)',
            position: 'relative',
          }}
          className="glow-pulse"
        >
          <Canvas camera={{ position: [0, 0, 6], fov: 55 }}>
            <ambientLight intensity={0.3} />
            <pointLight position={[4, 4, 4]}  color="#34d399" intensity={4} />
            <pointLight position={[-4, -4, -4]} color="#059669" intensity={2} />
            <FloatingMesh />
            <FloatingWireframe />
            <HeroParticles />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
          </Canvas>

          {/* Bottom overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(0deg, rgba(3,10,6,0.95) 0%, transparent 100%)',
            padding: '48px 24px 24px',
          }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#f0fdf4', marginBottom: 4 }}>
              WASM & WebGPU Inference Running Locally
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', color: '#4b7a63' }}>
              (100% Client-Side Camera Processing)
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <span className="badge badge-green"><WifiOff size={9} /> Offline</span>
              <span className="badge badge-green">ZERO Cloud APIs</span>
              <span className="badge badge-green">Images Stay On Device</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          display: 'flex',
          gap: 16,
          padding: '0 48px 40px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <StatBadge icon={ShieldCheck} label="100%" sublabel="OFFLINE FIRST" />
        <StatBadge icon={WifiOff} label="ZERO" sublabel="CLOUD DEPENDENCIES" />
        <StatBadge icon={Cpu} label="WASM" sublabel="LOCAL INFERENCE ENGINE" />
        <StatBadge icon={Zap} label="WebGPU" sublabel="GPU-ACCELERATED AI" />
        <StatBadge icon={Leaf} label="5+" sublabel="SPECIES IN LOCAL DB" />
      </motion.div>

      {/* Tech stack ticker */}
      <div style={{
        borderTop: '1px solid rgba(52,211,153,0.08)',
        overflow: 'hidden',
        padding: '12px 0',
        background: 'rgba(52,211,153,0.02)',
      }}>
        <div className="ticker" style={{
          display: 'flex',
          gap: 48,
          color: '#4b7a63',
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.7rem',
          whiteSpace: 'nowrap',
          letterSpacing: '0.04em',
        }}>
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <span>React + Vite</span>
              <span>✦</span>
              <span>Tailwind CSS v4</span>
              <span>✦</span>
              <span>Framer Motion</span>
              <span>✦</span>
              <span>Three.js / R3F</span>
              <span>✦</span>
              <span>Dexie.js (IndexedDB)</span>
              <span>✦</span>
              <span>RunAnywhere SDK (WASM)</span>
              <span>✦</span>
              <span>WebGPU Inference</span>
              <span>✦</span>
              <span>Web Speech API (TTS)</span>
              <span>✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
