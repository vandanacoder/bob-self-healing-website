import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ── Global error reporter ──────────────────────────────────────────────────
function reportError({ message, file, line }) {
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      file: file || window.location.href,
      line: line || null,
      time: new Date().toISOString(),
    }),
  }).catch(() => {
    // swallow — don't let reporter cause a loop
  });
}

// Catches synchronous runtime errors (TypeError, ReferenceError, etc.)
window.onerror = (message, source, lineno) => {
  reportError({ message: String(message), file: source, line: lineno });
  return false; // let default browser handling proceed
};

// Catches unhandled Promise rejections (failed fetch, etc.)
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message =
    reason instanceof Error ? reason.message : String(reason);
  reportError({ message, file: window.location.href, line: null });
});
// ──────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
