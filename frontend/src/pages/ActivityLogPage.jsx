import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import './ActivityLogPage.css';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await API.get('audit-log/');
      setLogs(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  };

  return (
    <div className="activity-container">
      {/* Top Navbar */}
      <header className="activity-header">
        <div className="header-brand">
          <span className="brand-logo">✈️</span>
          <h2>AeroSync <span className="badge-page">Audit & Activity Log</span></h2>
        </div>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </header>

      <main className="activity-main">
        {error && <div className="alert-banner error">{error}</div>}

        <section className="logs-section">
          <div className="section-header">
            <h3>📜 System & User Activity Log (SQLite ORM Tracked)</h3>
            <button className="refresh-btn" onClick={fetchAuditLogs}>↻ Refresh Logs</button>
          </div>

          {loading ? (
            <div className="empty-card">Loading activity logs...</div>
          ) : logs.length === 0 ? (
            <div className="empty-card">No activity log entries recorded yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Target Model</th>
                    <th>Object ID</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="cell-time">{formatDate(log.timestamp)}</td>
                      <td>
                        <span className="user-badge">{log.username}</span>
                      </td>
                      <td>
                        <span className="action-pill">{log.action}</span>
                      </td>
                      <td className="cell-model">{log.model_name}</td>
                      <td className="cell-id">{log.object_id}</td>
                      <td className="cell-details">
                        {log.details ? (
                          <pre>{JSON.stringify(log.details)}</pre>
                        ) : (
                          <span className="muted-text">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
