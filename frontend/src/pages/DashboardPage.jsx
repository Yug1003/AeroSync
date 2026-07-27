import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import API from '../api/api';
import './DashboardPage.css';

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [gates, setGates] = useState([]);
  const [flights, setFlights] = useState([]);
  const [aircraftMap, setAircraftMap] = useState({});
  const [gateMap, setGateMap] = useState({});
  const [tasksMap, setTasksMap] = useState({});
  
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingGates, setLoadingGates] = useState(true);
  const [loadingFlights, setLoadingFlights] = useState(true);
  
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || 'Operator';

  const fetchKpis = async () => {
    try {
      setLoadingKpis(true);
      const res = await API.get('analytics/kpis/');
      setKpis(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingKpis(false);
    }
  };

  const fetchGates = async () => {
    try {
      setLoadingGates(true);
      const res = await API.get('gates/');
      setGates(res.data);
      const gMap = {};
      res.data.forEach((g) => {
        gMap[g._id] = g.label;
      });
      setGateMap(gMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGates(false);
    }
  };

  const fetchAircraft = async () => {
    try {
      const res = await API.get('aircraft/');
      const aMap = {};
      res.data.forEach((ac) => {
        aMap[ac._id] = `${ac.tail_number} (${ac.airline})`;
      });
      setAircraftMap(aMap);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await API.get('tasks/');
      const tMap = {};
      res.data.forEach((t) => {
        if (!tMap[t.flight_id]) {
          tMap[t.flight_id] = [];
        }
        tMap[t.flight_id].push(t);
      });
      setTasksMap(tMap);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFlights = async () => {
    try {
      setLoadingFlights(true);
      const res = await API.get('flights/');
      setFlights(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFlights(false);
    }
  };

  const loadAllData = () => {
    fetchKpis();
    fetchGates();
    fetchAircraft();
    fetchFlights();
    fetchTasks();
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleToggleTask = async (task) => {
    setActionError('');
    setActionSuccess('');
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await API.patch(`tasks/${task._id}/`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update task status');
    }
  };

  const handlePushback = async (flightId) => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await API.post(`flights/${flightId}/depart/`);
      setActionSuccess(`Flight departed successfully! Gate is now available.`);
      loadAllData();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Pushback failed.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '--:--';
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          <button className="nav-link-btn" onClick={() => navigate('/incidents')}>🚨 Incidents Log</button>
          <button className="nav-link-btn audit" onClick={() => navigate('/activity-log')}>📜 Activity Log</button>
          <span className="user-greeting">Welcome, <strong>{username}</strong></span>
          <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <main className="dashboard-main">
        {actionError && <div className="alert-banner error">{actionError}</div>}
        {actionSuccess && <div className="alert-banner success">{actionSuccess}</div>}

        {/* KPI Cards Row */}
        <section className="kpi-section">
          <h3>Operational Metrics</h3>
          {loadingKpis ? (
            <div className="skeleton-row">Loading operational metrics...</div>
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
            <button className="refresh-btn" onClick={loadAllData}>↻ Refresh All Data</button>
          </div>

          {loadingGates ? (
            <div className="skeleton-grid">Loading terminal gates...</div>
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

        {/* Analytics & Gate Utilization Chart Section */}
        <section className="analytics-chart-section">
          <div className="section-header">
            <h3>📊 Analytics: Gate Utilization & Workload Distribution (Pandas Computed)</h3>
          </div>

          {kpis?.problem_gates && kpis.problem_gates.length > 0 && (
            <div className="alert-banner warning" style={{ marginBottom: '1rem' }}>
              ⚠️ Warning: Problem gates flagged with high average turnaround time: {kpis.problem_gates.join(', ')}
            </div>
          )}

          {loadingKpis ? (
            <div className="skeleton-row">Loading gate utilization analytics...</div>
          ) : !kpis?.gate_utilization || kpis.gate_utilization.length === 0 ? (
            <div className="empty-state">Not enough operational data yet for charts.</div>
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={kpis.gate_utilization} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="gate" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#131c2e',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                    cursor={{ fill: 'rgba(56, 189, 248, 0.08)' }}
                  />
                  <Bar dataKey="flights_handled" name="Flights Handled" radius={[6, 6, 0, 0]}>
                    {kpis.gate_utilization.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.flights_handled > 2 ? '#38bdf8' : '#0284c7'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Flight List & Task Checklist Section */}
        <section className="flight-list-section">
          <div className="section-header">
            <h3>Active Flight Operations & Task Checklists</h3>
          </div>

          {loadingFlights ? (
            <div className="skeleton-row">Loading active flight operations...</div>
          ) : flights.length === 0 ? (
            <div className="empty-state">No flights scheduled.</div>
          ) : (
            <div className="table-responsive">
              <table className="flight-table">
                <thead>
                  <tr>
                    <th>Flight / Aircraft</th>
                    <th>Assigned Gate</th>
                    <th>Time Window</th>
                    <th>Status</th>
                    <th>Turnaround Tasks Checklist (Click to Toggle)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map((flight) => {
                    const flightTasks = tasksMap[flight._id] || [];
                    const allTasksCompleted =
                      flightTasks.length === 4 &&
                      flightTasks.every((t) => t.status === 'completed');
                    const isDeparted = flight.status === 'departed';

                    return (
                      <tr key={flight._id} className={isDeparted ? 'row-departed' : ''}>
                        <td className="cell-flight">
                          <strong>{aircraftMap[flight.aircraft_id] || 'Aircraft Info Loading...'}</strong>
                          <span className="sub-tag">ID: {flight._id.slice(-6)}</span>
                        </td>
                        <td className="cell-gate">
                          <span className="gate-badge">
                            {flight.gate_id ? `Gate ${gateMap[flight.gate_id] || flight.gate_id.slice(-4)}` : 'Unassigned'}
                          </span>
                        </td>
                        <td className="cell-time">
                          {formatTime(flight.arrival_time)} – {formatTime(flight.departure_time)}
                        </td>
                        <td>
                          <span className={`badge-status status-${flight.status}`}>
                            {flight.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="cell-tasks">
                          <div className="task-chips-container">
                            {flightTasks.map((t) => (
                              <button
                                key={t._id}
                                className={`task-chip ${t.status}`}
                                onClick={() => handleToggleTask(t)}
                                title={`Click to set task as ${t.status === 'completed' ? 'pending' : 'completed'}`}
                              >
                                {t.status === 'completed' ? '✓ ' : '○ '}
                                {t.task_type.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td>
                          {isDeparted ? (
                            <span className="text-departed">✓ Departed</span>
                          ) : (
                            <button
                              className="pushback-btn"
                              disabled={!allTasksCompleted}
                              onClick={() => handlePushback(flight._id)}
                              title={
                                !allTasksCompleted
                                  ? 'All 4 tasks must be marked as completed before pushback.'
                                  : 'Trigger flight pushback'
                              }
                            >
                              🚀 Push Back
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
