import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import './DashboardPage.css';

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [gates, setGates] = useState([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingGates, setLoadingGates] = useState(true);
  const [errorKpis, setErrorKpis] = useState('');
  const [errorGates, setErrorGates] = useState('');
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || 'Operator';

  const fetchKpis = async () => {
    try {
      setLoadingKpis(true);
      const res = await API.get('analytics/kpis/');
      setKpis(res.data);
      setErrorKpis('');
    } catch (err) {
      setErrorKpis('Failed to load KPIs');
    } finally {
      setLoadingKpis(false);
    }
  };

  const fetchGates = async () => {
    try {
      setLoadingGates(true);
      const res = await API.get('gates/');
      setGates(res.data);
      setErrorGates('');
    } catch (err) {
      setErrorGates('Failed to load gate map');
    } finally {
      setLoadingGates(false);
    }
  };

  useEffect(() => {
    fetchKpis();
    fetchGates();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="header-brand">
          <span className="brand-logo">✈️</span>
          <h2>AeroSync <span className="badge-live">LIVE Ops</span></h2>
        </div>
        <div className="header-user">
          <span className="user-greeting">Welcome, <strong>{username}</strong></span>
          <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* KPI Cards Row */}
        <section className="kpi-section">
          <h3>Operational Metrics</h3>
          {loadingKpis ? (
            <div className="skeleton-row">Loading operational metrics...</div>
          ) : errorKpis ? (
            <div className="error-card">{errorKpis}</div>
          ) : (
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon">🛫</div>
                <div className="kpi-info">
                  <span className="kpi-title">Flights Scheduled Today</span>
                  <span className="kpi-value">{kpis?.total_flights_today ?? 0}</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon">🚪</div>
                <div className="kpi-info">
                  <span className="kpi-title">Gate Occupancy</span>
                  <span className="kpi-value">
                    {kpis?.occupied_gates ?? 0} / {kpis?.total_active_gates ?? 0}
                  </span>
                </div>
              </div>

              <div className="kpi-card warning">
                <div className="kpi-icon">⚠️</div>
                <div className="kpi-info">
                  <span className="kpi-title">Delayed Flights</span>
                  <span className="kpi-value">{kpis?.delayed_flights ?? 0}</span>
                </div>
              </div>

              <div className="kpi-card highlight">
                <div className="kpi-icon">⏱️</div>
                <div className="kpi-info">
                  <span className="kpi-title">Avg Turnaround Time</span>
                  <span className="kpi-value">{kpis?.avg_turnaround_minutes ?? 0} <small>mins</small></span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Gate Map Grid Section */}
        <section className="gate-map-section">
          <div className="section-header">
            <h3>Terminal Gate Status Map</h3>
            <button className="refresh-btn" onClick={fetchGates}>↻ Refresh Map</button>
          </div>

          {loadingGates ? (
            <div className="skeleton-grid">Loading terminal gates...</div>
          ) : errorGates ? (
            <div className="error-card">{errorGates}</div>
          ) : (
            <div className="gate-grid">
              {gates.map((gate) => {
                const gateStatus = gate.status || 'available';
                return (
                  <div key={gate._id} className={`gate-box status-${gateStatus}`}>
                    <div className="gate-header">
                      <span className="gate-label">Gate {gate.label}</span>
                      <span className={`status-pill pill-${gateStatus}`}>
                        {gateStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="gate-body">
                      <span className="gate-id-tag">ID: {gate._id.slice(-6)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
