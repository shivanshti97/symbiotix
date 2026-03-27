/**
 * Navbar — Top navigation bar
 * Shows offline status badge, app branding, and nav links.
 */

import { motion } from 'framer-motion';
import { Wifi, WifiOff, Leaf, ScanLine, LayoutDashboard, BarChart3, Home, Info } from 'lucide-react';
import type { Page } from '../App';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { label: string; page: Page; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { label: 'Home', page: 'home', Icon: Home },
  { label: 'Scanner', page: 'scanner', Icon: ScanLine },
  { label: 'Dashboard', page: 'dashboard', Icon: LayoutDashboard },
  { label: 'Eco Guide', page: 'eco-guide', Icon: BarChart3 },
  { label: 'About', page: 'about', Icon: Info },
];

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const isOffline = !navigator.onLine;

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'linear-gradient(180deg, rgba(3,10,6,0.98) 0%, rgba(3,10,6,0.85) 100%)',
        borderBottom: '1px solid rgba(52,211,153,0.1)',
        backdropFilter: 'blur(20px)',
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, #059669, #34d399)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(52,211,153,0.4)',
        }}>
          <Leaf size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#f0fdf4', lineHeight: 1 }}>
            Symbiotix
          </div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', color: '#4b7a63', lineHeight: 1, marginTop: 2 }}>
            LOCAL ECO AI · WASM/WebGPU
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {NAV_ITEMS.map(({ label, page, Icon }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: currentPage === page ? '1px solid rgba(52,211,153,0.35)' : '1px solid transparent',
              background: currentPage === page ? 'rgba(52,211,153,0.08)' : 'transparent',
              color: currentPage === page ? '#34d399' : '#4b7a63',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (currentPage !== page) {
                (e.currentTarget as HTMLButtonElement).style.color = '#a3e6c8';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,211,153,0.04)';
              }
            }}
            onMouseLeave={e => {
              if (currentPage !== page) {
                (e.currentTarget as HTMLButtonElement).style.color = '#4b7a63';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Right side: offline + status badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px',
          background: 'rgba(52,211,153,0.06)',
          border: '1px solid rgba(52,211,153,0.18)',
          borderRadius: '999px',
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.68rem',
          color: '#34d399',
          letterSpacing: '0.05em',
        }}>
          <div style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: '#34d399',
            boxShadow: '0 0 8px #34d399',
            flexShrink: 0,
          }} className="pulse-ring" />
          LOCAL AI ACTIVE
        </div>

        <div className={`badge ${isOffline ? 'badge-green' : 'badge-green'}`}
          style={{ gap: '5px' }}
        >
          {isOffline ? <WifiOff size={10} /> : <Wifi size={10} />}
          {isOffline ? 'OFFLINE' : '100% LOCAL'}
        </div>
      </div>
    </motion.nav>
  );
}
