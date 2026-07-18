import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Automated recovery for SPA Vercel deployment module-sync mismatches
// Triggered when an active user interacts with cached modules that have updated on the host server
window.addEventListener('error', (e) => {
  const errorMsg = e.message || "";
  const isChunkError = (
    errorMsg.includes('Failed to fetch dynamically imported module') ||
    errorMsg.includes('Importing a module script failed') ||
    errorMsg.includes('dynamic import')
  );
  if (isChunkError) {
    console.warn("Deploy/Module sync deviation detected. Clear-syncing dynamic state...");
    window.location.reload();
  }
}, true);

window.addEventListener('unhandledrejection', (e) => {
  const errorText = e.reason?.message || String(e.reason || "");
  const isChunkError = (
    errorText.includes('Failed to fetch dynamically imported module') ||
    errorText.includes('Importing a module script failed') ||
    errorText.includes('dynamic import')
  );
  if (isChunkError) {
    console.warn("Module chunk reference is offline. Clear-syncing dynamic state...");
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for offline-resilient caching & weak signal signal coverage
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[Service Worker] Registration successful with scope: ', reg.scope);
      })
      .catch((err) => {
        console.error('[Service Worker] Registration failed: ', err);
      });
  });
}
