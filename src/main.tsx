import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initSDK } from './lib/runanywhere';

// Kick off SDK init in the background — Scanner will await it before first use
initSDK().catch((err) => console.error('[RunAnywhere] SDK init failed:', err));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
