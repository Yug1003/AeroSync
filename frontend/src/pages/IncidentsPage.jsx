import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
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
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  return (
    <div className="incidents-container">
      {/* Top Navbar */}
      <header className="incidents-header">
        <div className="header-brand">
          <span className="brand-logo">✈️</span>
          <h2>AeroSync <span className="badge-page">AMD Incident Log — Ahmedabad Airport</span></h2>
        </div>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </header>

      <main className="incidents-main">
        {error && <div className="alert-banner error">{error}</div>}
        {success && <div className="alert-banner success">{success}</div>}

        {/* Report New Incident Form */}
        <section className="form-section">
          <h3>🚨 Report New Safety / Ground Incident</h3>
          <form onSubmit={handleCreateIncident} className="incident-form">
            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="description">Incident Description</label>
                <input
                  id="description"
                  type="text"
                  placeholder="Describe the incident (e.g. Fuel spill at Gate A1, Baggage belt jam)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="high">High Priority 🔴</option>
                  <option value="medium">Medium Priority 🟡</option>
                  <option value="low">Low Priority ⚪</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="flight">Linked Flight (Optional)</label>
                <select
                  id="flight"
                  value={selectedFlightId}
                  onChange={(e) => setSelectedFlightId(e.target.value)}
                >
                  <option value="">-- General Ground Incident --</option>
                  {flights.map((f) => (
                    <option key={f._id} value={f._id}>
                      Flight ID: {f._id.slice(-6)} - {aircraftMap[f.aircraft_id] || 'Aircraft'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Submitting Report...' : 'Log Incident Report'}
            </button>
          </form>
        </section>

        {/* Incidents List Section */}
        <section className="list-section">
          <h3>Reported Operational Incidents</h3>

          {loading ? (
            <div className="empty-card">Loading incident history...</div>
          ) : incidents.length === 0 ? (
            <div className="empty-card">No incidents reported yet. All ground operations normal!</div>
          ) : (
            <div className="incidents-list">
              {incidents.map((inc) => (
                <div key={inc._id} className={`incident-card status-${inc.status}`}>
                  <div className="card-header">
                    <div className="header-badges">
                      <span className={`badge-priority priority-${inc.priority}`}>
                        {inc.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className={`badge-status status-${inc.status}`}>
                        {inc.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="inc-time">{formatDate(inc.reported_at)}</span>
                  </div>

                  <div className="card-body">
                    <p className="inc-desc">{inc.description}</p>
                    {inc.flight_id && (
                      <span className="linked-flight">
                        🔗 Linked to Flight: {inc.flight_id.slice(-6)}
                      </span>
                    )}
                  </div>

                  <div className="card-footer">
                    <button
                      className={`toggle-btn ${inc.status === 'open' ? 'btn-resolve' : 'btn-reopen'}`}
                      onClick={() => handleToggleStatus(inc)}
                    >
                      {inc.status === 'open' ? 'Mark as Resolved ✓' : 'Re-open Incident ↺'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
