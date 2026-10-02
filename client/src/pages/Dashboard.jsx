import { useState, useEffect, useCallback } from 'react';
import { useBrokenMode } from '../BrokenModeContext.jsx';

export default function Dashboard() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const { setBrokenMode } = useBrokenMode();

  const fetchErrors = useCallback(() => {
    fetch('/api/errors')
      .then((r) => r.json())
      .then((data) => {
        setErrors(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Poll every 3 seconds
  useEffect(() => {
    fetchErrors();
    const id = setInterval(fetchErrors, 3000);
    return () => clearInterval(id);
  }, [fetchErrors]);

  function clearAll() {
    setClearing(true);
    fetch('/api/errors', { method: 'DELETE' })
      .then(() => {
        setErrors([]);
        setClearing(false);
      })
      .catch(() => setClearing(false));
  }

  function healError(id) {
    fetch(`/api/errors/${id}`, { method: 'PATCH' })
      .then((r) => r.json())
      .then((updated) => {
        setErrors((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
      });
  }

  function healAll() {
    fetch('/api/errors', { method: 'PATCH' })
      .then((r) => r.json())
      .then((all) => {
        // server returns array in file order; re-reverse to match GET order
        setErrors([...all].reverse());
        setBrokenMode(false);
      });
  }

  const openCount = errors.filter((e) => !e.healed).length;

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>Error Dashboard</h1>
        <div className="dashboard-controls">
          <span className="badge">{errors.length} error{errors.length !== 1 ? 's' : ''}</span>
          <button className="btn btn-sm" onClick={fetchErrors}>↻ Refresh</button>
          {openCount > 0 && (
            <button className="btn btn-sm btn-heal" onClick={healAll}>
              🩹 Heal All
            </button>
          )}
          {errors.length > 0 && (
            <button className="btn btn-sm btn-danger" onClick={clearAll} disabled={clearing}>
              {clearing ? 'Clearing…' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : errors.length === 0 ? (
        <div className="empty-state">
          <p>✅ No errors recorded yet.</p>
          <p className="muted">Trigger one from the home page and it will appear here.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="error-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Time</th>
                <th>Message</th>
                <th>File / Source</th>
                <th>Line</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {errors.map((err, i) => (
                <tr key={err.id} className={err.healed ? 'row-healed' : ''}>
                  <td className="muted">{i + 1}</td>
                  <td className="nowrap">{new Date(err.time).toLocaleString()}</td>
                  <td className="msg-cell">{err.message}</td>
                  <td className="file-cell muted">{err.file}</td>
                  <td className="muted">{err.line ?? '—'}</td>
                  <td>
                    {err.healed
                      ? <span className="status-healed">Healed</span>
                      : <span className="status-open">Open</span>}
                  </td>
                  <td>
                    {!err.healed && (
                      <button
                        className="btn btn-sm btn-heal"
                        onClick={() => healError(err.id)}
                      >
                        🩹 Heal
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="muted hint">Auto-refreshes every 3 seconds.</p>
    </div>
  );
}
