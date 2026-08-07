import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import ThemeToggle from '../components/ThemeToggle';
import {
  Plane,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Plus,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';
import './IncidentsPage.css';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [flights, setFlights] = useState([]);
  const [aircraftMap, setAircraftMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selectedFlightId, setSelectedFlightId] = useState('');

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incRes, flRes, acRes] = await Promise.all([
        API.get('incidents/'),
        API.get('flights/'),
        API.get('aircraft/'),
      ]);

      setIncidents(incRes.data);
      setFlights(flRes.data);

      const acMap = {};
      acRes.data.forEach((ac) => {
        acMap[ac._id] = `${ac.tail_number} (${ac.airline})`;
      });
      setAircraftMap(acMap);
    } catch (err) {
      setError('Failed to load incident data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!description.trim()) {
      setError('Please provide an incident description.');
      return;
    }

    setSubmitting(true);
    try {
      await API.post('incidents/', {
        description,
        priority,
        flight_id: selectedFlightId || null,
      });

      setSuccess('Incident reported successfully!');
      setDescription('');
      setPriority('medium');
      setSelectedFlightId('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to report incident.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (incident) => {
    setError('');
    setSuccess('');
    const newStatus = incident.status === 'open' ? 'resolved' : 'open';
    try {
      await API.patch(`incidents/${incident._id}/`, { status: newStatus });
      setSuccess(`Incident status updated to '${newStatus}'.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="shadcn-incidents-wrapper">
      {/* Header */}
      <header className="shadcn-header">
        <div className="header-left">
          <div className="brand-badge" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} title="Go to Dashboard">
            <div className="brand-logo-small">
              <Plane size={16} />
            </div>
            <span className="brand-name">AeroSync</span>
          </div>
          <span className="header-divider">/</span>
          <span className="header-title">Incidents Management</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ThemeToggle />
          <button className="shadcn-btn-secondary" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={14} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </header>

      <main className="incidents-content">
        {error && (
          <div className="alert-bar error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert-bar success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Form Card */}
        <section className="shadcn-card incident-form-card">
          <div className="card-title-bar">
            <div className="title-box">
              <AlertTriangle size={18} className="title-icon text-rose" />
              <div>
                <h3 className="card-heading">Report Operational Incident</h3>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateIncident} className="inc-form-body">
            <div className="form-grid">
              <div className="form-field field-wide">
                <label htmlFor="description">Incident Description</label>
                <input
                  id="description"
                  type="text"
                  className="shadcn-input"
                  placeholder="e.g. Fuel truck hose pressure valve leak near Gate A1"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="priority">Priority Level</label>
                <select
                  id="priority"
                  className="shadcn-input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="flight">Linked Flight (Optional)</label>
                <select
                  id="flight"
                  className="shadcn-input"
                  value={selectedFlightId}
                  onChange={(e) => setSelectedFlightId(e.target.value)}
                >
                  <option value="">-- General Ramp Incident --</option>
                  {flights.map((f) => (
                    <option key={f._id} value={f._id}>
                      Flight ID: {f._id.slice(-6)} - {aircraftMap[f.aircraft_id] || 'Aircraft'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="shadcn-btn-primary" disabled={submitting}>
                <Plus size={14} />
                <span>{submitting ? 'Logging Incident...' : 'Submit Incident Report'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Incidents Feed */}
        <section className="shadcn-card incident-list-card">
          <div className="card-title-bar">
            <div>
              <h3 className="card-heading">Reported Ground Incidents Feed</h3>
            </div>
          </div>

          <div className="incidents-feed">
            {loading ? (
              <div className="feed-empty">Loading incident feed...</div>
            ) : incidents.length === 0 ? (
              <div className="feed-empty">No incidents reported yet. All ground operations nominal.</div>
            ) : (
              incidents.map((inc) => (
                <div key={inc._id} className={`incident-row status-${inc.status}`}>
                  <div className="row-main">
                    <div className="row-meta">
                      <span className={`shadcn-badge priority-${inc.priority}`}>
                        {inc.priority} priority
                      </span>
                      <span className={`shadcn-badge badge-${inc.status}`}>
                        <span className="shadcn-badge-dot" />
                        {inc.status}
                      </span>
                      <span className="inc-timestamp font-mono">
                        <Clock size={12} />
                        {formatDate(inc.reported_at)}
                      </span>
                    </div>

                    <p className="inc-description-text">{inc.description}</p>

                    {inc.flight_id && (
                      <span className="linked-tag font-mono">
                        ✈️ Linked Flight: {inc.flight_id.slice(-6)}
                      </span>
                    )}
                  </div>

                  <div className="row-action">
                    <button
                      className={inc.status === 'open' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}
                      onClick={() => handleToggleStatus(inc)}
                    >
                      {inc.status === 'open' ? (
                        <>
                          <Check size={14} />
                          <span>Resolve</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw size={14} />
                          <span>Re-open</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
