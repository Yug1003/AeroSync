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
import RadarMapComponent from '../components/RadarMapComponent';
import GanttTimelineComponent from '../components/GanttTimelineComponent';
import VoiceAssistantComponent from '../components/VoiceAssistantComponent';
import './DashboardPage.css';

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [gates, setGates] = useState([]);
  const [flights, setFlights] = useState([]);
  const [aircraftMap, setAircraftMap] = useState({});
  const [gateMap, setGateMap] = useState({});
  const [tasksMap, setTasksMap] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const [weather, setWeather] = useState(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingGates, setLoadingGates] = useState(true);
  const [loadingFlights, setLoadingFlights] = useState(true);
  
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || 'Operator';

  const fetchWeather = async () => {
    try {
      const res = await API.get('weather/');
      setWeather(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateWeather = async (weatherPayload) => {
    try {
      setActionError('');
      setActionSuccess('');
      const res = await API.post('weather/', weatherPayload);
      setWeather(res.data.weather);
      setShowWeatherModal(false);

      if (res.data.automated_delays_applied > 0) {
        setActionSuccess(
          `WEATHER ALERT: ${res.data.weather.condition}! ${res.data.automated_delays_applied} active flight(s) automatically marked DELAYED.`
        );
      } else {
        setActionSuccess(`Airport Weather condition updated to '${res.data.weather.condition}'.`);
      }
      loadAllData();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update weather.');
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get('notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

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
      
      // Separate active/upcoming flights from departed flights
      const activeFlights = res.data.filter((f) => f.status !== 'departed');
      const departedFlights = res.data.filter((f) => f.status === 'departed');

      // Sort active flights chronologically by arrival_time ascending (soonest arrival first)
      activeFlights.sort((a, b) => new Date(a.arrival_time) - new Date(b.arrival_time));

      // Sort departed flights by departure_time descending (most recent departures first)
      departedFlights.sort((a, b) => new Date(b.departure_time) - new Date(a.departure_time));

      setFlights([...activeFlights, ...departedFlights]);
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
    fetchNotifications();
    fetchWeather();
  };

  const handleMarkNotificationRead = async (notifId) => {
    try {
      await API.patch(`notifications/${notifId}/`, { is_read: true });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [flightFilter, setFlightFilter] = useState('ALL');

  const handleVoiceCommand = (commandType) => {
    switch (commandType) {
      case 'FILTER_DEPARTED':
        setFlightFilter('departed');
        setActionSuccess('Filtering table: Showing DEPARTED / PUSHED BACK flights only.');
        break;
      case 'FILTER_IN_PROGRESS':
        setFlightFilter('in_progress');
        setActionSuccess('Filtering table: Showing IN PROGRESS flights.');
        break;
      case 'FILTER_DELAYED':
        setFlightFilter('delayed');
        setActionSuccess('Filtering table: Showing DELAYED flights only.');
        break;
      case 'FILTER_SCHEDULED':
        setFlightFilter('scheduled');
        setActionSuccess('Filtering table: Showing SCHEDULED flights.');
        break;
      case 'FILTER_ALL':
        setFlightFilter('ALL');
        setActionSuccess('Showing ALL flight operations.');
        break;
      case 'SET_WEATHER_THUNDERSTORM':
        handleUpdateWeather({
          condition: 'Severe Thunderstorm ⛈️',
          temp_c: 18,
          wind_speed_kts: 45,
          visibility_miles: 0.5,
          severity: 'severe',
        });
        break;
      case 'SET_WEATHER_CLEAR':
        handleUpdateWeather({
          condition: 'Clear / Fair ☀️',
          temp_c: 24,
          wind_speed_kts: 10,
          visibility_miles: 10.0,
          severity: 'clear',
        });
        break;
      case 'SET_WEATHER_FOG':
        handleUpdateWeather({
          condition: 'Dense Ground Fog 🌫️',
          temp_c: 12,
          wind_speed_kts: 5,
          visibility_miles: 0.2,
          severity: 'severe',
        });
        break;
      case 'SET_WEATHER_GALE':
        handleUpdateWeather({
          condition: 'Gale Wind Hazard 💨',
          temp_c: 20,
          wind_speed_kts: 38,
          visibility_miles: 8.0,
          severity: 'caution',
        });
        break;
      case 'REFRESH_DATA':
        setFlightFilter('ALL');
        loadAllData();
        break;
      case 'NAVIGATE_INCIDENTS':
        navigate('/incidents');
        break;
      case 'NAVIGATE_ACTIVITY':
        navigate('/activity-log');
        break;
      default:
        break;
    }
  };

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

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '--:--';
    const date = new Date(isoStr);
    const datePart = date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${datePart} (${timePart})`;
  };

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="header-brand">
          <span className="brand-logo">✈️</span>
          <h2>AeroSync <span className="badge-live">AMD Ops — Ahmedabad Airport (AMD / VAAH)</span></h2>
        </div>
        <div className="header-user">
          {/* Airport METAR Weather Widget */}
          {weather && (
            <div className="weather-widget-wrapper">
              <button
                className={`weather-badge-btn severity-${weather.severity}`}
                onClick={() => setShowWeatherModal(!showWeatherModal)}
                title="Click to simulate airport weather conditions"
              >
                <span className="wx-condition">{weather.condition}</span>
                <span className="wx-details">
                  {weather.temp_c}°C | {weather.wind_speed_kts} kts | {weather.visibility_miles} mi vis
                </span>
                <span className={`wx-pill pill-${weather.severity}`}>
                  {weather.severity === 'clear' ? 'CLEAR OPS 🟢' : 'WEATHER ALERT 🔴'}
                </span>
              </button>

              {showWeatherModal && (
                <div className="weather-modal-dropdown">
                  <div className="wx-modal-header">
                    <h4>🌤️ Simulate Aviation Weather Conditions</h4>
                    <button className="close-btn" onClick={() => setShowWeatherModal(false)}>×</button>
                  </div>
                  <div className="wx-modal-body">
                    <p className="wx-subtext">Selecting severe weather conditions triggers automated flight delay cascades, audit trail entries, and controller alert notifications.</p>

                    <div className="wx-preset-grid">
                      <button
                        className="wx-preset-card clear"
                        onClick={() =>
                          handleUpdateWeather({
                            condition: 'Clear / Fair ☀️',
                            temp_c: 24,
                            wind_speed_kts: 10,
                            visibility_miles: 10.0,
                            severity: 'clear',
                          })
                        }
                      >
                        <span className="preset-title">Clear / Fair ☀️</span>
                        <span className="preset-info">10 kts | 10.0 mi vis</span>
                      </button>

                      <button
                        className="wx-preset-card severe"
                        onClick={() =>
                          handleUpdateWeather({
                            condition: 'Severe Thunderstorm ⛈️',
                            temp_c: 18,
                            wind_speed_kts: 45,
                            visibility_miles: 0.5,
                            severity: 'severe',
                          })
                        }
                      >
                        <span className="preset-title">Thunderstorm ⛈️</span>
                        <span className="preset-info">45 kts | 0.5 mi vis</span>
                      </button>

                      <button
                        className="wx-preset-card severe"
                        onClick={() =>
                          handleUpdateWeather({
                            condition: 'Dense Ground Fog 🌫️',
                            temp_c: 12,
                            wind_speed_kts: 5,
                            visibility_miles: 0.2,
                            severity: 'severe',
                          })
                        }
                      >
                        <span className="preset-title">Dense Fog 🌫️</span>
                        <span className="preset-info">5 kts | 0.2 mi vis</span>
                      </button>

                      <button
                        className="wx-preset-card caution"
                        onClick={() =>
                          handleUpdateWeather({
                            condition: 'Gale Wind Hazard 💨',
                            temp_c: 20,
                            wind_speed_kts: 38,
                            visibility_miles: 8.0,
                            severity: 'caution',
                          })
                        }
                      >
                        <span className="preset-title">Gale Winds 💨</span>
                        <span className="preset-info">38 kts | 8.0 mi vis</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notification Bell Dropdown */}
          <div className="notif-wrapper">
            <button
              className="notif-bell-btn"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              title="Alert Notifications"
            >
              🔔
              {notifications.filter((n) => !n.is_read).length > 0 && (
                <span className="notif-badge">
                  {notifications.filter((n) => !n.is_read).length}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <h4>Alert Notifications</h4>
                  <span className="notif-count">
                    {notifications.filter((n) => !n.is_read).length} Unread
                  </span>
                </div>
                <div className="notif-dropdown-body">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No alerts at this time.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
                        onClick={() => handleMarkNotificationRead(n.id)}
                      >
                        <span className="notif-type">[{n.notification_type}]</span>
                        <p className="notif-msg">{n.message}</p>
                        {!n.is_read && <span className="unread-dot">•</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="nav-link-btn" onClick={() => navigate('/incidents')}>🚨 Incidents Log</button>
          <button className="nav-link-btn audit" onClick={() => navigate('/activity-log')}>📜 Activity Log</button>
          <span className="user-greeting">Welcome, <strong>{username}</strong></span>
          <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <main className="dashboard-main">
        {actionError && <div className="alert-banner error">{actionError}</div>}
        {actionSuccess && <div className="alert-banner success">{actionSuccess}</div>}

        {/* 🎙️ AI Voice Command Assistant */}
        <VoiceAssistantComponent onVoiceCommand={handleVoiceCommand} />

        {/* KPI Cards Section */}
        <section className="kpi-section">
          {loadingKpis ? (
            <div className="skeleton-grid">Loading flight KPIs...</div>
          ) : (
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon">✈️</div>
                <div className="kpi-info">
                  <span className="kpi-title">Total Flights Today</span>
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

        {/* 🗺️ Live Regional Radar Map Section */}
        <RadarMapComponent flights={flights} />

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

        {/* 📅 Interactive Gate Schedule Gantt Chart */}
        <GanttTimelineComponent gates={gates} flights={flights} tasksMap={tasksMap} />

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
            <h3>
              Active Flight Operations & Task Checklists{' '}
              {flightFilter !== 'ALL' && (
                <span className="filter-active-tag">
                  (Filtered: {flightFilter.toUpperCase()}{' '}
                  <button className="clear-filter-btn" onClick={() => setFlightFilter('ALL')}>
                    Show All ✕
                  </button>
                </span>
              )}
            </h3>
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
                  {(flightFilter === 'ALL'
                    ? flights
                    : flights.filter((f) => f.status === flightFilter.toLowerCase())
                  ).map((flight) => {
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
                          <div className="time-block">
                            <span>🛬 Arr: <strong>{formatDateTime(flight.arrival_time)}</strong></span>
                            <span>🛫 Dep: <strong>{formatDateTime(flight.departure_time)}</strong></span>
                          </div>
                        </td>
                        <td>
                          <div className="status-cell-wrapper">
                            <span className={`badge-status status-${flight.status}`}>
                              {flight.status.toUpperCase()}
                            </span>
                            {!isDeparted && (
                              <div className="live-countdown-badge">
                                {(() => {
                                  const depTime = new Date(flight.departure_time).getTime();
                                  const diffMs = depTime - currentTime;
                                  if (diffMs <= 0) {
                                    return <span className="timer-overdue">⏱️ OVERDUE</span>;
                                  }
                                  const mins = Math.floor(diffMs / 60000);
                                  const secs = Math.floor((diffMs % 60000) / 1000);
                                  return (
                                    <span className="timer-ticking">
                                      ⏱️ {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                                    </span>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="cell-tasks">
                          <div className="task-chips-container">
                            {flightTasks.map((t) => {
                              const estTime = t.task_type === 'refuel' ? '25m' : t.task_type === 'cleaning' ? '20m' : '15m';
                              return (
                                <button
                                  key={t._id}
                                  className={`task-chip ${t.status}`}
                                  onClick={() => handleToggleTask(t)}
                                  title={`${t.task_type.replace('_', ' ')}: Standard Duration ${estTime}. Click to set task as ${t.status === 'completed' ? 'pending' : 'completed'}`}
                                >
                                  {t.status === 'completed' ? '✓ ' : '○ '}
                                  {t.task_type.replace('_', ' ')} <span className="task-time-badge">⏱️ {estTime}</span>
                                </button>
                              );
                            })}
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
