import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initApiRouting } from './utils/api.ts';

// Initialize cross-origin API routing for Cloudflare Pages <-> Azure VM
initApiRouting();

// Global resilience handler to catch and suppress third-party cross-origin script errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message === 'Script error.' || event.message?.includes('Script error')) {
      // Suppress benign cross-origin script error from bubbling up
      event.preventDefault();
      return true;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (event.reason.message === 'Script error.' || event.reason.name === 'AbortError')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
