import { useState } from 'react';
import { useBrokenMode } from '../BrokenModeContext.jsx';

export default function Home() {
  const [log, setLog] = useState([]);
  const { brokenMode, setBrokenMode } = useBrokenMode();

  function addLog(msg) {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  }

  function triggerFailedApi() {
    addLog('Triggering failed API call…');
    if (brokenMode) {
      // Broken: no .catch() — unhandled rejection fires the global handler
      fetch('/api/does-not-exist')
        .then((res) => {
          if (!res.ok) throw new Error(`API call failed: HTTP ${res.status}`);
          return res.json();
        });
    } else {
      // Fixed: .catch() handles the rejection safely
      fetch('/api/does-not-exist')
        .then((res) => {
          if (!res.ok) throw new Error(`API call failed: HTTP ${res.status}`);
          return res.json();
        })
        .catch((err) => {
          addLog(`Caught error: ${err.message}`);
        });
    }
  }

  function triggerUndefinedRead() {
    addLog('Triggering undefined property read…');
    const obj = undefined;
    if (brokenMode) {
      // Broken: direct access throws TypeError caught by window.onerror
      console.log(obj.property);
    } else {
      // Fixed: optional chaining — safe, no throw
      console.log(obj?.property ?? 'property is undefined (obj was nullish)');
      addLog('Read completed safely via optional chaining');
    }
  }

  return (
    <div className="page">
      <h1>Error Triggers</h1>
      <p className="subtitle">
        Click a button to fire a JavaScript error. The global handler will
        capture it and send it to the server automatically.
      </p>

      <div className="broken-mode-row">
        <span className="broken-mode-label">Broken Mode</span>
        <button
          className={`toggle ${brokenMode ? 'toggle-on' : ''}`}
          onClick={() => setBrokenMode(!brokenMode)}
          aria-pressed={brokenMode}
        >
          <span className="toggle-thumb" />
        </button>
        <span className={`broken-mode-status ${brokenMode ? 'status-broken' : 'status-safe'}`}>
          {brokenMode ? 'ON — errors will be thrown' : 'OFF — safe code runs'}
        </span>
      </div>

      <div className="button-row">
        <button className="btn btn-red" onClick={triggerFailedApi}>
          💥 Failed API Call
        </button>
        <button className="btn btn-orange" onClick={triggerUndefinedRead}>
          ⚠️ Read Undefined Value
        </button>
      </div>

      {log.length > 0 && (
        <div className="local-log">
          <h3>Local activity log</h3>
          <ul>
            {log.map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
