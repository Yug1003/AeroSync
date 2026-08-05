import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import ThemeToggle from '../components/ThemeToggle';
import { Plane, ArrowLeft, Activity, RefreshCw, Clock, User, Code, AlertTriangle } from 'lucide-react';
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
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  };

  return (
    <div className="shadcn-activity-wrapper">
      {/* Header */}
      <header className="shadcn-header">
        <div className="header-left">
          <div className="brand-badge">
            <div className="brand-logo-small">
              <Plane size={16} />
            </div>
            <span className="brand-name">AeroSync</span>
          </div>
          <span className="header-divider">/</span>
          <span className="header-title">System Audit & Activity Log</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ThemeToggle />
          <button className="shadcn-btn-secondary" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={14} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </header>

      <main className="activity-content">
        {error && (
          <div className="alert-bar error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <section className="shadcn-card activity-card">
          <div className="card-title-bar">
            <div>
              <h3 className="card-heading">Relational Audit Log Records</h3>
              <p className="card-subheading">System state mutations and user action events recorded via Django ORM</p>
            </div>

            <button className="shadcn-btn-secondary" onClick={fetchAuditLogs}>
              <RefreshCw size={14} />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="shadcn-table-wrapper">
            {loading ? (
              <div className="log-empty">Loading audit logs...</div>
            ) : logs.length === 0 ? (
              <div className="log-empty">No activity log entries recorded yet.</div>
            ) : (
              <table className="shadcn-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action Event</th>
                    <th>Model</th>
                    <th>Object ID</th>
                    <th>Details Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="cell-time font-mono">
                        <Clock size={12} className="text-muted" />
                        <span>{formatDate(log.timestamp)}</span>
                      </td>

                      <td>
                        <span className="user-pill font-mono">
                          <User size={12} />
                          {log.username}
                        </span>
                      </td>

                      <td>
                        <span className="action-pill font-mono">{log.action}</span>
                      </td>

                      <td className="cell-model font-mono">{log.model_name}</td>

                      <td className="cell-id font-mono">ID: {log.object_id}</td>

                      <td className="cell-json font-mono">
                        {log.details ? (
                          <pre>{JSON.stringify(log.details)}</pre>
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
