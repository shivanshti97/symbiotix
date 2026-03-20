/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Scanner.tsx — Client-Side Camera & Local AI Component
 *
 * Features:
 *  - navigator.mediaDevices.getUserMedia (live camera feed)
 *  - Image capture to Blob/Base64 (never leaves device)
 *  - File upload fallback
 *  - R3F 3D loading animation mask during WASM inference
 *  - Progress bar with stage labels
 *  - WASM model init on first use
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, Zap, CheckCircle, AlertCircle,
  X, ChevronRight, ScanLine, Cpu, Eye, Volume2, WifiOff
} from 'lucide-react';
import { ParticleField, HelixRing, CoreIcosahedron, OrbitRing } from './three/ParticleScanner';
import {
  initModels, analyzeImageBlob, speakSummary,
  areModelsLoaded, type ProgressEvent
} from '../lib/runAnywhereClient';
import { saveScan, findEcoSyncWarnings } from '../db/db';
import type { SpeciesScan } from '../db/db';

interface ScannerProps {
  onScanComplete: (scan: SpeciesScan) => void;
}

type ScanState = 'idle' | 'camera' | 'loading-models' | 'analyzing' | 'result' | 'error';

// ── Log line component ────────────────────────────────────────────────────────
function ConsoleLog({ lines }: { lines: string[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.6)',
      border: '1px solid rgba(52,211,153,0.15)',
      borderRadius: '10px',
      padding: '12px 14px',
      maxHeight: 140,
      overflowY: 'auto',
      fontFamily: 'Space Mono, monospace',
      fontSize: '0.68rem',
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          color: line.startsWith('[RunAnywhere] ✅') ? '#34d399' :
                 line.startsWith('[RunAnywhere]') ? '#a3e6c8' : '#4b7a63',
          marginBottom: 3,
          lineHeight: 1.5,
        }}>
          <span style={{ color: '#4b7a63' }}>&gt; </span>{line}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

export default function Scanner({ onScanComplete }: ScannerProps) {
  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Component state
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [currentScan, setCurrentScan] = useState<SpeciesScan | null>(null);
  const [ecoWarnings, setEcoWarnings] = useState<{ scan: SpeciesScan; warning: any }[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState(areModelsLoaded() ? 'loaded' : 'unloaded');

  // Patch console.log to capture RunAnywhere SDK output
  useEffect(() => {
    const orig = console.log;
    console.log = (...args: any[]) => {
      orig(...args);
      const msg = args.join(' ');
      if (msg.includes('[RunAnywhere]')) {
        setConsoleLogs(prev => [...prev.slice(-30), msg.replace('[RunAnywhere] ', '')]);
      }
    };
    return () => { console.log = orig; };
  }, []);

  // ── Progress handler ──────────────────────────────────────────────────────
  const handleProgress = useCallback((e: ProgressEvent) => {
    setProgress(e.progress);
    setProgressLabel(e.label);
  }, []);

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanState('camera');
    } catch (err: any) {
      setCameraError(err.message ?? 'Camera access denied');
      setScanState('error');
    }
  }, []);

  // ── Stop camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanState('idle');
  }, []);

  // ── Capture frame from live video ─────────────────────────────────────────
  const captureFrame = useCallback((): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return reject(new Error('No video/canvas'));

      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      canvas.toBlob(blob => {
        if (blob) resolve({ blob, dataUrl });
        else reject(new Error('Blob conversion failed'));
      }, 'image/jpeg', 0.92);
    });
  }, []);

  // ── Full scan pipeline ────────────────────────────────────────────────────
  const runScanPipeline = useCallback(async (blob: Blob, dataUrl: string) => {
    setCapturedImage(dataUrl);
    setCapturedBlob(blob);
    setConsoleLogs([]);
    setProgress(0);

    // Stop camera
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    // 1. Load models if not yet loaded
    if (!areModelsLoaded()) {
      setScanState('loading-models');
      setModelStatus('loading');
      await initModels(handleProgress);
      setModelStatus('loaded');
    }

    // 2. Analyze image
    setScanState('analyzing');
    setProgress(0);
    const result = await analyzeImageBlob(blob, handleProgress);

    // 3. Check Eco-Sync warnings BEFORE saving
    const warnings = await findEcoSyncWarnings({ ...result, imageDataUrl: dataUrl, scannedAt: Date.now() });
    setEcoWarnings(warnings);

    // 4. Save to Dexie.js
    const savedId = await saveScan({
      ...result,
      imageDataUrl: dataUrl,
      scannedAt: Date.now(),
    });

    const fullScan: SpeciesScan = { ...result, id: savedId, imageDataUrl: dataUrl, scannedAt: Date.now() };
    setCurrentScan(fullScan);
    setScanState('result');
    onScanComplete(fullScan);
  }, [handleProgress, onScanComplete]);

  // ── Capture and scan ──────────────────────────────────────────────────────
  const captureAndScan = useCallback(async () => {
    try {
      const { blob, dataUrl } = await captureFrame();
      await runScanPipeline(blob, dataUrl);
    } catch (err: any) {
      setScanState('error');
      setCameraError(err.message ?? 'Capture failed');
    }
  }, [captureFrame, runScanPipeline]);

  // ── File upload handler ───────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      await runScanPipeline(file, dataUrl);
    };
    reader.readAsDataURL(file);
  }, [runScanPipeline]);

  // ── TTS handler ───────────────────────────────────────────────────────────
  const handleSpeak = useCallback(async () => {
    if (!currentScan) return;
    setIsSpeaking(true);
    await speakSummary(currentScan);
    setIsSpeaking(false);
  }, [currentScan]);

  const isLoading = scanState === 'loading-models' || scanState === 'analyzing';

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, padding: '80px 24px 32px' }}>

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        <div className="badge badge-green" style={{ marginBottom: 12, display: 'inline-flex' }}>
          <ScanLine size={10} /> WASM · WebGPU · CLIENT-SIDE INFERENCE
        </div>
        <h1 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '2.6rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #f0fdf4, #34d399)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
          marginBottom: 12,
        }}>
          Species Scanner
        </h1>
        <p style={{ color: '#4b7a63', fontSize: '1rem', fontFamily: 'Inter, sans-serif', maxWidth: 480, margin: '0 auto' }}>
          Point your camera at any plant or animal. The AI identifies it locally — zero cloud, zero data transfer.
        </p>
      </motion.div>

      {/* ── Privacy ticker ── */}
      <div style={{
        background: 'rgba(52,211,153,0.04)',
        border: '1px solid rgba(52,211,153,0.1)',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 32,
        padding: '10px 0',
      }}>
        <div className="ticker" style={{
          display: 'flex',
          gap: 60,
          color: '#34d399',
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.72rem',
          whiteSpace: 'nowrap',
        }}>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <span>✦ NO IMAGE UPLOADS</span>
              <span>✦ ZERO CLOUD API CALLS</span>
              <span>✦ 100% OFFLINE CAPABLE</span>
              <span>✦ IMAGES STAY IN YOUR BROWSER MEMORY</span>
              <span>✦ WASM + WebGPU LOCAL INFERENCE</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Main bento layout ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
        maxWidth: 1200,
        margin: '0 auto',
      }}>

        {/* LEFT: Camera / Preview panel */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', minHeight: 520, position: 'relative' }}>

          {/* Captured image or live feed */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured species"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', opacity: isLoading ? 0.35 : 0.85,
                transition: 'opacity 0.4s',
              }}
            />
          )}

          {/* Live camera video */}
          <video
            ref={videoRef}
            muted
            playsInline
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
              display: scanState === 'camera' ? 'block' : 'none',
            }}
          />

          {/* R3F 3D scene (shown only during loading / idle with no image) */}
          <AnimatePresence>
            {(isLoading || (scanState === 'idle' && !capturedImage)) && (
              <motion.div
                key="r3f"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <Canvas camera={{ position: [0, 0, 6], fov: 55 }}>
                  <ambientLight intensity={0.3} />
                  <pointLight position={[4, 4, 4]} color="#34d399" intensity={3} />
                  <pointLight position={[-4, -4, -4]} color="#059669" intensity={1.5} />
                  <CoreIcosahedron />
                  <ParticleField count={350} />
                  <HelixRing />
                  <OrbitRing radius={2.2} speed={0.6} color="#34d399" />
                  <OrbitRing radius={2.8} speed={-0.4} color="#059669" />
                  <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                </Canvas>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Camera scan-line animation */}
          {scanState === 'camera' && <div className="scanline" style={{ top: '50%' }} />}

          {/* Overlay top labels */}
          <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
            <div className="badge badge-green">
              <Eye size={9} /> LOCAL VISION
            </div>
            {capturedImage && (
              <div className="badge badge-blue">
                <Cpu size={9} /> {modelStatus === 'loaded' ? 'WASM READY' : 'WASM LOADING'}
              </div>
            )}
          </div>

          {/* Bottom overlay: status or result species name */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(0deg, rgba(3,10,6,0.97) 0%, transparent 100%)',
            padding: '48px 20px 20px',
          }}>
            {scanState === 'result' && currentScan && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', color: '#4b7a63', marginBottom: 4 }}>
                  IDENTIFIED SPECIES
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#34d399' }}>
                  {currentScan.species}
                </div>
                <div style={{ color: '#a3e6c8', fontSize: '0.9rem' }}>{currentScan.commonName}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <span className={`badge ${currentScan.type === 'flora' ? 'badge-green' : 'badge-blue'}`}>
                    {currentScan.type === 'flora' ? '🌿' : '🐾'} {currentScan.type.toUpperCase()}
                  </span>
                  <span className="badge badge-green">
                    {(currentScan.confidence * 100).toFixed(0)}% CONFIDENCE
                  </span>
                </div>
              </motion.div>
            )}

            {scanState === 'idle' && !capturedImage && (
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#f0fdf4', marginBottom: 4 }}>
                  WASM & WebGPU Inference
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', color: '#4b7a63' }}>
                  Running 100% Locally · Client-Side Camera Processing
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <span className="badge badge-green"><WifiOff size={9} /> AIRPLANE MODE READY</span>
                  <span className="badge badge-green">ZERO Cloud APIs</span>
                </div>
              </div>
            )}

            {isLoading && (
              <div>
                <div style={{ fontFamily: 'Space Mono, monospace', marginBottom: 8, color: '#a3e6c8', fontSize: '0.78rem' }}>
                  {progressLabel}
                </div>
                <div className="progress-bar-track">
                  <motion.div
                    className="progress-bar-fill"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'Space Mono, monospace', color: '#4b7a63', fontSize: '0.65rem', marginTop: 4 }}>
                  {progress.toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Controls panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Control card */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#f0fdf4', marginBottom: 6 }}>
              Scan Controls
            </div>
            <p style={{ color: '#4b7a63', fontSize: '0.82rem', marginBottom: 20 }}>
              Use your live camera or upload a photo. All processing runs on your device.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scanState !== 'camera' && !isLoading && (
                <button className="btn-glow" onClick={startCamera} style={{ width: '100%', justifyContent: 'center' }}>
                  <Camera size={16} /> Start Live Camera
                </button>
              )}

              {scanState === 'camera' && (
                <>
                  <button className="btn-glow" onClick={captureAndScan} style={{ width: '100%', justifyContent: 'center' }}>
                    <Zap size={16} /> Capture & Identify
                  </button>
                  <button onClick={stopCamera} style={{
                    width: '100%', padding: '10px', borderRadius: '10px',
                    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                    color: '#f87171', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                  }}>
                    <X size={16} /> Cancel
                  </button>
                </>
              )}

              {!isLoading && (
                <>
                  <div style={{ textAlign: 'center', color: '#4b7a63', fontSize: '0.75rem', fontFamily: 'Space Mono, sans-serif' }}>— or —</div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '10px',
                      background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)',
                      color: '#a3e6c8', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
                      fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                    }}
                  >
                    <Upload size={16} /> Upload Photo
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </>
              )}

              {scanState === 'result' && currentScan && (
                <button
                  className="btn-glow"
                  onClick={handleSpeak}
                  disabled={isSpeaking}
                  style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                >
                  <Volume2 size={16} /> {isSpeaking ? 'Speaking…' : 'Read Aloud (TTS)'}
                </button>
              )}
            </div>
          </div>

          {/* AI Status card */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#a3e6c8', marginBottom: 14 }}>
              Local AI Status
            </div>
            {[
              { label: 'WebGPU Adapter', status: 'active' },
              { label: 'Vision WASM (MobileNetV3)', status: modelStatus === 'loaded' ? 'active' : 'standby' },
              { label: 'SmolLM2-360M WASM', status: modelStatus === 'loaded' ? 'active' : 'standby' },
              { label: 'TTS (Web Speech API)', status: 'active' },
              { label: 'Cloud Transmissions', status: 'zero' },
            ].map(({ label, status }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ color: '#4b7a63', fontSize: '0.8rem', fontFamily: 'Space Mono, monospace' }}>{label}</span>
                <span className={`badge ${status === 'active' ? 'badge-green' : status === 'zero' ? 'badge-red' : 'badge-orange'}`}>
                  {status === 'active' && <CheckCircle size={8} />}
                  {status === 'standby' && <Cpu size={8} />}
                  {status === 'zero' && '✦'}
                  {status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {/* Eco-Sync warnings */}
          {ecoWarnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card"
              style={{ padding: 20, borderColor: 'rgba(251,146,60,0.3)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertCircle size={16} color="#fb923c" />
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#fb923c', fontSize: '0.9rem' }}>
                  Eco-Sync Alert!
                </span>
              </div>
              {ecoWarnings.slice(0, 2).map((w, i) => (
                <div key={i} style={{
                  background: 'rgba(251,146,60,0.06)',
                  border: '1px solid rgba(251,146,60,0.15)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 8,
                  fontSize: '0.78rem',
                  color: '#a3e6c8',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  <strong style={{ color: '#fb923c' }}>⚠ {w.warning.severity.toUpperCase()} RISK</strong><br />
                  {w.warning.description}
                  <div style={{ color: '#4b7a63', marginTop: 4, fontFamily: 'Space Mono, monospace', fontSize: '0.65rem' }}>
                    Cross-referenced with: {w.scan.commonName}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Console log */}
          {consoleLogs.length > 0 && (
            <div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: '#4b7a63', marginBottom: 6 }}>
                WASM CONSOLE OUTPUT
              </div>
              <ConsoleLog lines={consoleLogs} />
            </div>
          )}

          {/* Error state */}
          {scanState === 'error' && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                background: 'rgba(248,113,113,0.06)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ color: '#f87171', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', marginBottom: 4 }}>
                  Camera Error
                </div>
                <div style={{ color: '#a3e6c8', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif' }}>
                  {cameraError ?? 'An unexpected error occurred.'}
                </div>
                <button
                  onClick={() => { setScanState('idle'); setCameraError(null); setCapturedImage(null); }}
                  style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  <ChevronRight size={14} /> Try again
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
