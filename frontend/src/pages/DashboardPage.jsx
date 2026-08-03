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
import {
  Plane,
  Search,
  CloudSun,
  Bell,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Clock,
  Shield,
  Activity,
  ChevronDown,
  Sparkles,
  MapPin,
  ListFilter,
  Check,
  Zap,
  Mic,
  LayoutGrid,
  Calendar,
  Layers,
  BarChart2,
  SlidersHorizontal,
  UserCheck,
  UserX,
  UserPlus,
} from 'lucide-react';
import RadarMapComponent from '../components/RadarMapComponent';
import GanttTimelineComponent from '../components/GanttTimelineComponent';
import VoiceAssistantComponent from '../components/VoiceAssistantComponent';
import ThreeDAirfieldCanvas from '../components/ThreeDAirfieldCanvas';
import GseTelemetryComponent from '../components/GseTelemetryComponent';
import './DashboardPage.css';

const INDIAN_AIRPORTS = [
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel Intl', city: 'Ahmedabad' },
  { code: 'DEL', name: 'Indira Gandhi Intl', city: 'New Delhi' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl', city: 'Mumbai' },
  { code: 'BLR', name: 'Kempegowda Intl', city: 'Bengaluru' },
  { code: 'MAA', name: 'Chennai Intl', city: 'Chennai' },
  { code: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad' },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose Intl', city: 'Kolkata' },
  { code: 'COK', name: 'Cochin Intl', city: 'Kochi' },
  { code: 'GOI', name: 'Manohar Intl / Dabolim', city: 'Goa' },
  { code: 'JAI', name: 'Jaipur Intl', city: 'Jaipur' },
  { code: 'LKO', name: 'Chaudhary Charan Singh Intl', city: 'Lucknow' },
  { code: 'ATQ', name: 'Sri Guru Ram Dass Jee Intl', city: 'Amritsar' },
  { code: 'TRV', name: 'Thiruvananthapuram Intl', city: 'Trivandrum' },
  { code: 'IXC', name: 'Chandigarh Intl', city: 'Chandigarh' },
  { code: 'VTZ', name: 'Visakhapatnam Intl', city: 'Visakhapatnam' },
];

export default function DashboardPage() {
  const [selectedAirport, setSelectedAirport] = useState('AMD');
  const [kpis, setKpis] = useState(null);
  const [gates, setGates] = useState([]);
  const [flights, setFlights] = useState([]);
  const [aircraftMap, setAircraftMap] = useState({});
  const [gateMap, setGateMap] = useState({});
  const [tasksMap, setTasksMap] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Active tab in consolidated Operations Viewport: 'radar' | 'gates' | 'gantt'
  const [viewportTab, setViewportTab] = useState('radar');
  const [viewMode3D, setViewMode3D] = useState(false);
  const [gateStandFilter, setGateStandFilter] = useState('ALL');
  const [selectedGateId, setSelectedGateId] = useState(null);
  const [aiDisruptionLoading, setAiDisruptionLoading] = useState(false);

  // Toggle for Floating Voice Assistant Drawer
  const [showVoiceDrawer, setShowVoiceDrawer] = useState(false);

  // Analytics Collapsible Toggle
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const [weather, setWeather] = useState(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  const [pendingStaff, setPendingStaff] = useState([]);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const username = localStorage.getItem('username') || 'Operator';
  const userRole = localStorage.getItem('user_role') || (username === 'admin' ? 'admin' : 'ground_crew');
  const isAdmin = userRole === 'admin' || username === 'admin';

  const fetchPendingStaff = async () => {
    try {
      const res = await API.get('auth/pending-staff/');
      setPendingStaff(res.data);
    } catch (err) {
      // Non-admin accounts or network notes safely ignored
    }
  };

  const handleApproveStaff = async (userId, action) => {
    try {
      const res = await API.post(`auth/approve-staff/${userId}/`, { action });
      setActionSuccess(res.data.message);
      fetchPendingStaff();
    } catch (err) {
      setActionError('Failed to update staff approval status.');
    }
  };

  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingGates, setLoadingGates] = useState(true);
  const [loadingFlights, setLoadingFlights] = useState(true);

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [highlightedFlightId, setHighlightedFlightId] = useState(null);
  const navigate = useNavigate();

  const fetchWeather = async () => {
    try {
      const res = await API.get(`weather/?airport=${selectedAirport}`);
      const weatherData = Array.isArray(res.data) ? res.data[0] : res.data;
      if (weatherData) {
        setWeather(weatherData);
      }
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

  const handleRunAiDisruptionRecovery = async () => {
    try {
      setAiDisruptionLoading(true);
      setActionError('');
      setActionSuccess('');
      const res = await API.post('flights/ai-disruption-recovery/', {
        airport: selectedAirport,
        flights: flights,
        gates: gates,
      });

      if (res.data.actions && res.data.actions.length > 0) {
        const actionsMap = new Map(res.data.actions.map((a) => [a.flight_id, a]));
        setFlights((prevFlights) =>
          prevFlights.map((f) => {
            const act = actionsMap.get(f._id);
            if (act) {
              const targetGate = gates.find((g) => g.label === act.new_gate_label);
              return {
                ...f,
                status: act.new_status,
                gate_id: targetGate ? targetGate._id : f.gate_id,
              };
            }
            return f;
          })
        );
        setActionSuccess(
          `🤖 AI DISRUPTION RECOVERY: Resolved ${res.data.disruptions_resolved} flight conflict(s) for ${selectedAirport}! Gates reallocated & slots compressed.`
        );
      } else {
        setActionSuccess(`🤖 AI DISRUPTION RECOVERY: All flight operations & gate stands for ${selectedAirport} are 100% optimal!`);
      }
    } catch (err) {
      setActionError('Failed to execute AI Disruption Recovery.');
    } finally {
      setAiDisruptionLoading(false);
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

  const AIRPORT_GATE_PRESETS = {
    AMD: ['T1-G1 (Domestic)', 'T1-G2 (Domestic)', 'T1-G3 (Domestic)', 'T1-G4 (Domestic)', 'T2-INT1 (Intl)', 'T2-INT2 (Intl)'],
    DEL: ['T1-01 (Indigo Hub)', 'T1-02 (Akasa Hub)', 'T2-04 (Air India)', 'T3-A12 (JFK Line)', 'T3-A14 (British Airways)', 'T3-B22 (Emirates A380)'],
    BOM: ['T1A-1 (Santacruz)', 'T1A-2 (Santacruz)', 'T2-G45 (Sahar Intl)', 'T2-G47 (Lufthansa Line)', 'T2-G49 (Qatar Airways)'],
    BLR: ['T1-08 (Garden Pier)', 'T1-09 (Air India)', 'T2-201 (Air France)', 'T2-203 (Singapore Airlines)'],
    MAA: ['M-11 (Kamaraj Dom)', 'M-12 (Kamaraj Dom)', 'M-21 (Anna Intl)', 'M-22 (Anna Intl)'],
    HYD: ['H-01 (Concourse A)', 'H-03 (Concourse A)', 'H-21 (International)', 'H-23 (International)'],
    CCU: ['K-04 (Terminal 2)', 'K-06 (Terminal 2)', 'K-08 (Terminal 2)', 'K-12 (Thai Airways Line)'],
    COK: ['C-02 (Terminal 1)', 'C-04 (Air India Exp)', 'C-14 (Emirates Line)', 'C-16 (Oman Air)'],
    GOI: ['G-01 (Dabolim Airfield)', 'G-02 (Dabolim Airfield)', 'G-03 (Dabolim Airfield)'],
  };

  const fetchGates = async () => {
    try {
      setLoadingGates(true);
      const res = await API.get('gates/');
      const dbGates = res.data || [];
      const presets = AIRPORT_GATE_PRESETS[selectedAirport] || [`${selectedAirport}-G1`, `${selectedAirport}-G2`, `${selectedAirport}-G3`];

      const airportGates = presets.map((label, idx) => ({
        _id: `g_${selectedAirport.toLowerCase()}_${idx}`,
        label: label,
        status: idx % 2 === 0 ? 'occupied' : 'available',
      }));

      const finalGates = selectedAirport === 'AMD' ? [...dbGates, ...airportGates] : airportGates;
      setGates(finalGates);

      const gMap = {};
      finalGates.forEach((g) => {
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
      setAircraftMap((prev) => ({ ...prev, ...aMap }));
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
      setTasksMap((prev) => {
        const merged = { ...prev };
        Object.keys(tMap).forEach((fId) => {
          if (tMap[fId] && tMap[fId].length > 0) {
            merged[fId] = tMap[fId];
          }
        });
        return merged;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFlights = async () => {
    try {
      setLoadingFlights(true);
      const dbRes = await API.get('flights/');
      const dbFlights = dbRes.data || [];

      // Fetch live radar telemetry (used for Radar Map & live callsigns)
      let rawLive = [];
      try {
        const res = await API.get(`flights/live-radar/?airport=${selectedAirport}`);
        rawLive = res.data.flights || [];
      } catch (err) {
        console.warn('Live radar fetch warning:', err);
      }

      const newAcMap = {};
      const newTasksMap = {};

      dbFlights.forEach((f, idx) => {
        const flightId = f._id;
        newAcMap[f.aircraft_id] = f.callsign
          ? `${f.tailNumber || 'VT-AIR'} — ${f.callsign}`
          : `Aircraft ${f.aircraft_id.slice(-6)}`;

        if (!newTasksMap[flightId]) {
          newTasksMap[flightId] = [
            { _id: `t_bg_${flightId}`, flight_id: flightId, task_type: 'baggage', status: idx % 2 === 0 ? 'completed' : 'pending' },
            { _id: `t_cl_${flightId}`, flight_id: flightId, task_type: 'cleaning', status: idx % 3 === 0 ? 'completed' : 'pending' },
            { _id: `t_rf_${flightId}`, flight_id: flightId, task_type: 'refuel', status: idx % 4 === 0 ? 'completed' : 'pending' },
            { _id: `t_ct_${flightId}`, flight_id: flightId, task_type: 'catering', status: idx % 2 === 0 ? 'completed' : 'pending' },
          ];
        }
      });

      let operationalFlights = [];

      if (dbFlights.length > 0 && selectedAirport === 'AMD') {
        operationalFlights = dbFlights;
      } else {
        // Generate clean, non-overlapping staggered gate schedules for the selected airport
        const now = new Date();
        const numGates = Math.max(1, gates.length);

        operationalFlights = rawLive.slice(0, numGates * 2).map((rf, idx) => {
          const gateIdx = idx % numGates;
          const slotInGate = Math.floor(idx / numGates);

          // Stagger flight times cleanly by 2.5 hours so timelines never collide
          const arrMinutesOffset = slotInGate * 150 - 60 + (idx % 2) * 15;
          const arrTime = new Date(now.getTime() + arrMinutesOffset * 60000).toISOString();
          const depTime = new Date(now.getTime() + (arrMinutesOffset + 90) * 60000).toISOString();

          const flightId = rf.id || `fl_${selectedAirport.toLowerCase()}_${idx}`;
          newAcMap[flightId] = `${rf.tailNumber || 'VT-AIR'} — ${rf.callsign || 'FL-' + idx}`;

          if (!newTasksMap[flightId]) {
            newTasksMap[flightId] = [
              { _id: `t_bg_${flightId}`, flight_id: flightId, task_type: 'baggage', status: idx % 2 === 0 ? 'completed' : 'pending' },
              { _id: `t_cl_${flightId}`, flight_id: flightId, task_type: 'cleaning', status: idx % 3 === 0 ? 'completed' : 'pending' },
              { _id: `t_rf_${flightId}`, flight_id: flightId, task_type: 'refuel', status: idx % 4 === 0 ? 'completed' : 'pending' },
              { _id: `t_ct_${flightId}`, flight_id: flightId, task_type: 'catering', status: idx % 2 === 0 ? 'completed' : 'pending' },
            ];
          }

          return {
            _id: flightId,
            aircraft_id: flightId,
            gate_id: gates[gateIdx]?._id || null,
            status: rf.is_on_ground ? 'in_progress' : 'scheduled',
            arrival_time: arrTime,
            departure_time: depTime,
            callsign: rf.callsign,
            tailNumber: rf.tailNumber,
            aircraftType: rf.aircraft_type,
            route: rf.route,
          };
        });
      }

      setAircraftMap((prev) => {
        const merged = { ...newAcMap, ...prev };
        Object.keys(newAcMap).forEach((key) => {
          if (prev[key] && !prev[key].startsWith('Aircraft ')) {
            merged[key] = prev[key];
          }
        });
        return merged;
      });

      setTasksMap((prev) => ({
        ...newTasksMap,
        ...prev,
      }));

      // Preserve local state changes (e.g. user pushback departed status and gate re-assignments)
      setFlights((prevFlights) => {
        if (prevFlights.length === 0) return operationalFlights;

        const prevMap = new Map(prevFlights.map((f) => [f._id, f]));

        return operationalFlights.map((opF) => {
          const local = prevMap.get(opF._id);
          if (local) {
            return {
              ...opF,
              status: local.status,
              gate_id: local.status === 'departed' ? null : local.gate_id,
            };
          }
          return opF;
        });
      });
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
    fetchPendingStaff();
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
  }, [selectedAirport]);

  const [flightFilter, setFlightFilter] = useState('ALL');

  const handleVoiceCommand = (commandType) => {
    switch (commandType) {
      case 'FILTER_DEPARTED':
        setFlightFilter('departed');
        setActionSuccess('Filtered table: Showing DEPARTED flights only.');
        break;
      case 'FILTER_IN_PROGRESS':
        setFlightFilter('in_progress');
        setActionSuccess('Filtered table: Showing IN PROGRESS flights.');
        break;
      case 'FILTER_DELAYED':
        setFlightFilter('delayed');
        setActionSuccess('Filtered table: Showing DELAYED flights only.');
        break;
      case 'FILTER_SCHEDULED':
        setFlightFilter('scheduled');
        setActionSuccess('Filtered table: Showing SCHEDULED flights.');
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

    const flightId = task.flight_id;
    const currentTasks = tasksMap[flightId] || [];
    const updatedTasks = currentTasks.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t));

    setTasksMap((prevMap) => ({ ...prevMap, [flightId]: updatedTasks }));
    setActionSuccess(`Task "${task.task_type.replace('_', ' ')}" updated to ${newStatus.toUpperCase()}.`);

    try {
      await API.patch(`tasks/${task._id}/`, { status: newStatus });
    } catch (err) {
      console.warn('Backend sync note:', err);
    }
  };

  const handlePushback = async (flightId) => {
    setActionError('');
    setActionSuccess('');

    const targetFlight = flights.find((f) => f._id === flightId);
    const freedGateId = targetFlight ? targetFlight.gate_id : null;

    setFlights((prevFlights) =>
      prevFlights.map((f) => (f._id === flightId ? { ...f, status: 'departed', gate_id: null } : f))
    );

    if (freedGateId) {
      setGates((prevGates) =>
        prevGates.map((g) => (g._id === freedGateId ? { ...g, status: 'available' } : g))
      );
    }

    setActionSuccess(`🚀 Flight pushback approved! Stand cleared & gate status updated to AVAILABLE.`);

    try {
      await API.post(`flights/${flightId}/depart/`);
    } catch (err) {
      console.warn('Backend pushback note:', err);
    }
  };

  const handleReassignGate = async (flightId, newGateId, newGateLabel) => {
    setActionError('');
    setActionSuccess('');

    const targetFlight = flights.find((f) => f._id === flightId);
    if (!targetFlight) return;

    const sourceGateId = targetFlight.gate_id;
    const sourceGateObj = gates.find((g) => g._id === sourceGateId);
    const sourceGateLabel = sourceGateObj ? sourceGateObj.label : (sourceGateId ? sourceGateId.slice(-4) : 'Unassigned');

    const targetArr = new Date(targetFlight.arrival_time).getTime();
    const targetDep = new Date(targetFlight.departure_time).getTime();

    // Check for timeline collision with existing flight at newGateId
    const collidingFlight = flights.find((f) => {
      if (f._id === flightId || f.gate_id !== newGateId) return false;
      const fArr = new Date(f.arrival_time).getTime();
      const fDep = new Date(f.departure_time).getTime();
      return targetArr < fDep && targetDep > fArr;
    });

    if (collidingFlight) {
      // Swap places between the two flights
      setFlights((prevFlights) =>
        prevFlights.map((f) => {
          if (f._id === flightId) return { ...f, gate_id: newGateId };
          if (f._id === collidingFlight._id) return { ...f, gate_id: sourceGateId };
          return f;
        })
      );
      setActionSuccess(
        `🔄 Timeline Swap: Flight ${flightId.slice(-6)} → Gate ${newGateLabel} & Flight ${collidingFlight._id.slice(-6)} → Gate ${sourceGateLabel}`
      );

      try {
        await Promise.all([
          API.patch(`flights/${flightId}/`, { gate_id: newGateId }),
          API.patch(`flights/${collidingFlight._id}/`, { gate_id: sourceGateId }),
        ]);
      } catch (err) {
        console.warn('Backend gate swap note:', err);
      }
    } else {
      // Direct gate re-assignment
      setFlights((prevFlights) =>
        prevFlights.map((f) => (f._id === flightId ? { ...f, gate_id: newGateId } : f))
      );
      setActionSuccess(`⚡ Reassigned Flight ${flightId.slice(-6)} to Gate ${newGateLabel || newGateId.slice(-4)}.`);

      try {
        await API.patch(`flights/${flightId}/`, { gate_id: newGateId });
      } catch (err) {
        console.warn('Backend gate reassign note:', err);
      }
    }
  };

  const handleSelectFlightFromGantt = (flightId) => {
    const target = flights.find((f) => f._id === flightId);
    if (target && flightFilter !== 'ALL' && target.status !== flightFilter.toLowerCase()) {
      setFlightFilter('ALL');
    }

    setHighlightedFlightId(flightId);

    setTimeout(() => {
      const rowElem = document.getElementById(`flight-row-${flightId}`);
      if (rowElem) {
        rowElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);

    setTimeout(() => {
      setHighlightedFlightId((prev) => (prev === flightId ? null : prev));
    }, 3200);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '--:--';
    const date = new Date(isoStr);
    const datePart = date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
  };

  const selectedAirportObj = INDIAN_AIRPORTS.find((a) => a.code === selectedAirport) || INDIAN_AIRPORTS[0];

  return (
    <div className="shadcn-dashboard-wrapper">
      {/* Top Navigation Bar */}
      <header className="shadcn-header">
        <div className="header-left">
          <div className="brand-badge">
            <div className="brand-logo-small">
              <Plane size={16} />
            </div>
            <span className="brand-name">AeroSync</span>
          </div>

          <div className="airport-selector-box">
            <MapPin size={14} className="selector-icon" />
            <select
              className="airport-select-native"
              value={selectedAirport}
              onChange={(e) => {
                setSelectedAirport(e.target.value);
                setActionSuccess(`Airport switched to ${e.target.value} — Telemetry updated.`);
              }}
            >
              {INDIAN_AIRPORTS.map((apt) => (
                <option key={apt.code} value={apt.code}>
                  [{apt.code}] {apt.city} — {apt.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="selector-arrow" />
          </div>
        </div>

        <div className="header-right">
          {/* Weather Pill */}
          {weather && (
            <div className="weather-dropdown-container">
              <button
                className={`weather-pill-btn severity-${weather.severity}`}
                onClick={() => setShowWeatherModal(!showWeatherModal)}
              >
                <CloudSun size={14} />
                <span>{weather.temp_c}°C</span>
                <span className="weather-desc">{weather.condition}</span>
                <span className={`wx-dot ${weather.severity}`} />
              </button>

              {showWeatherModal && (
                <div className="weather-popover shadcn-card">
                  <div className="popover-header">
                    <h4>Simulate METAR Weather</h4>
                    <button className="icon-close" onClick={() => setShowWeatherModal(false)}>✕</button>
                  </div>
                  <p className="popover-sub">Triggering severe weather automatically updates flight delays and logs audit entries.</p>
                  <div className="weather-presets">
                    <button
                      className="wx-preset-btn clear"
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
                      Clear / Fair ☀️ (10 kts)
                    </button>
                    <button
                      className="wx-preset-btn severe"
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
                      Thunderstorm ⛈️ (45 kts)
                    </button>
                    <button
                      className="wx-preset-btn severe"
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
                      Dense Fog 🌫️ (0.2 mi)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notification Bell */}
          <div className="notif-dropdown-container">
            <button
              className="notif-btn"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            >
              <Bell size={16} />
              {notifications.filter((n) => !n.is_read).length > 0 && (
                <span className="notif-badge-dot" />
              )}
            </button>

            {showNotifDropdown && (
              <div className="notif-popover shadcn-card">
                <div className="popover-header">
                  <h4>Alert Notifications</h4>
                  <span className="notif-unread-count">
                    {notifications.filter((n) => !n.is_read).length} Unread
                  </span>
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No unread alerts.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notif-row ${n.is_read ? 'read' : 'unread'}`}
                        onClick={() => handleMarkNotificationRead(n.id)}
                      >
                        <AlertTriangle size={14} className="notif-row-icon" />
                        <div className="notif-row-content">
                          <span className="notif-tag">[{n.notification_type}]</span>
                          <p>{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {isAdmin && (
            <button className="shadcn-btn-ghost nav-btn" onClick={() => navigate('/pending-approvals')}>
              <UserCheck size={14} />
              <span>Staff Approvals {pendingStaff.length > 0 && `(${pendingStaff.length})`}</span>
            </button>
          )}

          <button className="shadcn-btn-ghost nav-btn" onClick={() => navigate('/incidents')}>
            <AlertTriangle size={14} />
            <span>Incidents</span>
          </button>
          <button className="shadcn-btn-ghost nav-btn" onClick={() => navigate('/activity-log')}>
            <Activity size={14} />
            <span>Activity Log</span>
          </button>

          <div className="user-profile-pill">
            <Shield size={14} className="user-icon" />
            <span>{username}</span>
          </div>

          <button className="shadcn-btn-ghost icon-btn" onClick={handleLogout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Dashboard Canvas */}
      <main className="dashboard-content">
        {actionError && (
          <div className="alert-bar error">
            <AlertTriangle size={16} />
            <span>{actionError}</span>
          </div>
        )}


        <section className="shadcn-card viewport-card">
          <div className="viewport-tab-bar">
            <div className="viewport-tabs">
              <button
                className={`viewport-tab ${viewportTab === 'radar' && !viewMode3D ? 'active' : ''}`}
                onClick={() => { setViewportTab('radar'); setViewMode3D(false); }}
              >
                <Plane size={14} />
                <span>Live Radar</span>
              </button>
              <button
                className={`viewport-tab ${viewportTab === 'gates' && !viewMode3D ? 'active' : ''}`}
                onClick={() => { setViewportTab('gates'); setViewMode3D(false); }}
              >
                <LayoutGrid size={14} />
                <span>Gate Status</span>
              </button>
              <button
                className={`viewport-tab ${viewportTab === 'gantt' && !viewMode3D ? 'active' : ''}`}
                onClick={() => { setViewportTab('gantt'); setViewMode3D(false); }}
              >
                <Calendar size={14} />
                <span>Gantt Schedule</span>
              </button>
              <button
                className={`viewport-tab ${viewMode3D ? 'active' : ''}`}
                onClick={() => setViewMode3D(!viewMode3D)}
                title="Toggle 3D WebGL Realtime Airfield Inspector"
                style={viewMode3D ? { backgroundColor: 'rgba(14, 165, 233, 0.15)', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' } : {}}
              >
                <Sparkles size={14} />
                <span>{viewMode3D ? '🏢 2D Gate View' : '🛩️ 3D WebGL Airfield'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="shadcn-btn-primary btn-compact"
                style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={handleRunAiDisruptionRecovery}
                disabled={aiDisruptionLoading}
                title="Run AI Automated Disruption Management algorithm to re-assign gate stands and compress slots"
              >
                <Zap size={13} className={aiDisruptionLoading ? 'spin' : ''} />
                <span>{aiDisruptionLoading ? 'Running AI...' : '🤖 AI Disruption Recovery'}</span>
              </button>

              <button className="shadcn-btn-secondary btn-compact" onClick={loadAllData}>
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="viewport-body">
            {viewMode3D ? (
              <ThreeDAirfieldCanvas selectedAirportCode={selectedAirport} flights={flights} />
            ) : (
              <>
                {viewportTab === 'radar' && (
                  <RadarMapComponent flights={flights} selectedAirportCode={selectedAirport} />
                )}

                {viewportTab === 'gates' && (() => {
                  const activeInspectorGate =
                    gates.find((g) => g._id === selectedGateId) ||
                    gates.find((g) => g.status === 'occupied') ||
                    gates[0];

              const inspectorFlight = activeInspectorGate
                ? flights.find((f) => f.gate_id === activeInspectorGate._id && f.status !== 'departed')
                : null;

              let inspectorCallsign = 'STAND CLEAR';
              if (inspectorFlight) {
                if (inspectorFlight.callsign && inspectorFlight.callsign !== 'UNK') {
                  inspectorCallsign = inspectorFlight.callsign;
                } else if (inspectorFlight.tailNumber) {
                  inspectorCallsign = inspectorFlight.tailNumber;
                } else if (aircraftMap && aircraftMap[inspectorFlight.aircraft_id]) {
                  const info = aircraftMap[inspectorFlight.aircraft_id];
                  const parts = info.split('—');
                  inspectorCallsign = parts.length > 1 ? parts[1].split('(')[0].trim() : parts[0].trim();
                } else {
                  inspectorCallsign = `FL-${inspectorFlight._id.slice(-4).toUpperCase()}`;
                }
              }

              const inspectorTasks = inspectorFlight ? tasksMap[inspectorFlight._id] || [] : [];
              const inspectorCompletedCount = inspectorTasks.filter((t) => t.status === 'completed').length;
              const inspectorProgress = inspectorTasks.length > 0 ? (inspectorCompletedCount / 4) * 100 : 0;
              const inspectorAircraftInfo = inspectorFlight && aircraftMap[inspectorFlight.aircraft_id]
                ? aircraftMap[inspectorFlight.aircraft_id]
                : null;

              return (
                <div className="gate-viewport-split-container">
                  <div className="gate-grid-column">
                    <div className="gate-viewport-subbar font-mono">
                      <div className="gate-subbar-left">
                        <span>🚪 GATE STAND OCCUPANCY & FLIGHT ASSIGNMENTS</span>
                      </div>

                      <div className="gate-subbar-right">
                        <div className="gate-filter-pills">
                          <button
                            type="button"
                            className={`gate-filter-pill ${gateStandFilter === 'ALL' ? 'active' : ''}`}
                            onClick={() => setGateStandFilter('ALL')}
                          >
                            ALL STANDS ({gates.length})
                          </button>
                          <button
                            type="button"
                            className={`gate-filter-pill ${gateStandFilter === 'OCCUPIED' ? 'active' : ''}`}
                            onClick={() => setGateStandFilter('OCCUPIED')}
                          >
                            OCCUPIED ({gates.filter((g) => g.status === 'occupied').length})
                          </button>
                          <button
                            type="button"
                            className={`gate-filter-pill ${gateStandFilter === 'CLEAR' ? 'active' : ''}`}
                            onClick={() => setGateStandFilter('CLEAR')}
                          >
                            CLEAR ({gates.filter((g) => g.status === 'available' || g.status !== 'occupied').length})
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="gate-boxes-grid">
                      {gates
                        .filter((g) => {
                          if (gateStandFilter === 'OCCUPIED') return g.status === 'occupied';
                          if (gateStandFilter === 'CLEAR') return g.status === 'available' || g.status !== 'occupied';
                          return true;
                        })
                        .map((gate) => {
                          const gateStatus = gate.status || 'available';
                          const gateFlight = flights.find(
                            (f) => f.gate_id === gate._id && f.status !== 'departed'
                          );

                          let flightLabel = null;
                          if (gateFlight) {
                            if (gateFlight.callsign && gateFlight.callsign !== 'UNK') {
                              flightLabel = gateFlight.callsign;
                            } else if (gateFlight.tailNumber) {
                              flightLabel = gateFlight.tailNumber;
                            } else if (aircraftMap && aircraftMap[gateFlight.aircraft_id]) {
                              const info = aircraftMap[gateFlight.aircraft_id];
                              const parts = info.split('—');
                              flightLabel = parts.length > 1 ? parts[1].split('(')[0].trim() : parts[0].trim();
                            } else {
                              flightLabel = `FL-${gateFlight._id.slice(-4).toUpperCase()}`;
                            }
                          }

                          const tasks = gateFlight ? tasksMap[gateFlight._id] || [] : [];
                          const completedTasks = tasks.filter((t) => t.status === 'completed').length;
                          const progressPercent = tasks.length > 0 ? (completedTasks / 4) * 100 : 0;
                          const isSelectedStand = activeInspectorGate && activeInspectorGate._id === gate._id;

                          return (
                            <div
                              key={gate._id}
                              tabIndex={gateFlight ? 0 : -1}
                              role={gateFlight ? 'button' : undefined}
                              aria-label={
                                gateFlight
                                  ? `Gate ${gate.label}, Flight ${flightLabel}, ${completedTasks} of 4 turnaround milestones completed.`
                                  : `Gate ${gate.label}, Stand Clear`
                              }
                              className={`gate-item status-${gateStatus} ${gateFlight ? 'has-flight' : 'empty-stand'} ${isSelectedStand ? 'selected-stand' : ''}`}
                              onClick={() => {
                                setSelectedGateId(gate._id);
                                if (gateFlight) {
                                  handleSelectFlightFromGantt(gateFlight._id);
                                }
                              }}
                              onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && gateFlight) {
                                  e.preventDefault();
                                  setSelectedGateId(gate._id);
                                  handleSelectFlightFromGantt(gateFlight._id);
                                }
                              }}
                              title={`Gate ${gate.label} • Click to inspect live telemetry and turnaround milestones`}
                            >
                              <div className="gate-item-top font-mono">
                                <div className="gate-title-col">
                                  <span className="gate-name">Gate {gate.label}</span>
                                  {gateFlight && (
                                    <span className="gate-flight-callsign">{flightLabel}</span>
                                  )}
                                </div>
                                {!gateFlight && (
                                  <span className="shadcn-badge badge-available">CLEAR</span>
                                )}
                              </div>

                              {gateFlight ? (
                                <div className="gate-item-mid font-mono">
                                  <div className="gate-mid-meta">
                                    <span className="gate-flight-route">{gateFlight.route || 'Local Line'}</span>
                                    <span className="gate-flight-status-tag">
                                      {gateFlight.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="gate-progress-line-wrapper">
                                    <div className="gate-progress-text font-mono">
                                      <span>Turnaround</span>
                                      <strong>{completedTasks}/4 Done</strong>
                                    </div>
                                    <div className="gate-mini-progress-track">
                                      <div
                                        className="gate-mini-progress-fill"
                                        style={{ width: `${progressPercent}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="gate-empty-hint font-mono">
                                  <span>STAND CLEAR</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Right Sticky Stand Inspector Panel */}
                  <div className="gate-inspector-column">
                    {activeInspectorGate ? (
                      <div className="stand-inspector-panel">
                        <div className="inspector-header">
                          <div>
                            <span className="inspector-gate-label font-mono">STAND INSPECTOR — GATE {activeInspectorGate.label}</span>
                            <h4 className="inspector-callsign font-mono">{inspectorCallsign}</h4>
                          </div>
                          <span className={`inspector-status-badge status-${activeInspectorGate.status} font-mono`}>
                            {activeInspectorGate.status.toUpperCase()}
                          </span>
                        </div>

                        {inspectorFlight ? (
                          <>
                            <div className="inspector-route-bar font-mono">
                              <span>Route: {inspectorFlight.route || 'Local Line'}</span>
                            </div>

                            <div className="inspector-progress-box">
                              <div className="progress-label-row font-mono">
                                <span>Turnaround Progress</span>
                                <strong>{inspectorCompletedCount}/4 Completed ({inspectorProgress}%)</strong>
                              </div>
                              <div className="inspector-progress-track">
                                <div
                                  className="inspector-progress-fill"
                                  style={{ width: `${inspectorProgress}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="inspector-grid font-mono">
                              <div className="inspector-item">
                                <span>Aircraft Reg</span>
                                <strong>{inspectorFlight.tailNumber || (inspectorAircraftInfo ? inspectorAircraftInfo.split('—')[0].trim() : 'VT-IZB')}</strong>
                              </div>

                              <div className="inspector-item">
                                <span>Airline Operator</span>
                                <strong>{inspectorFlight.callsign ? inspectorFlight.callsign.split(' ')[0] : 'IndiGo'}</strong>
                              </div>

                              <div className="inspector-item">
                                <span>Aircraft Model</span>
                                <strong>{inspectorAircraftInfo ? inspectorAircraftInfo.split('—')[0].trim() : 'A320neo'}</strong>
                              </div>

                              <div className="inspector-item">
                                <span>Stand Location</span>
                                <strong>Gate {activeInspectorGate.label}</strong>
                              </div>
                            </div>

                            <div className="inspector-checklist font-mono">
                              <h6>Turnaround Operational Milestones</h6>
                              <ul className="checklist-items">
                                {['baggage', 'refuel', 'cleaning', 'catering'].map((taskType) => {
                                  const taskObj = inspectorTasks.find((t) => t.task_type === taskType);
                                  const isDone = taskObj?.status === 'completed';

                                  return (
                                    <li
                                      key={taskType}
                                      className={isDone ? 'done' : 'pending'}
                                      onClick={() => taskObj && handleToggleTask(taskObj)}
                                      title="Click to toggle milestone state"
                                    >
                                      <div className="checklist-left">
                                        <span className="check-icon">{isDone ? '✓' : '○'}</span>
                                        <span className="task-title">{taskType.replace('_', ' ')}</span>
                                      </div>
                                      <span className="task-state-tag">{isDone ? 'DONE' : 'PENDING'}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>

                            <div className="inspector-actions">
                              <button
                                className="shadcn-btn-primary pushback-action-btn w-full"
                                disabled={inspectorCompletedCount < 4}
                                onClick={() => handlePushback(inspectorFlight._id)}
                              >
                                Push Back Aircraft
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="stand-inspector-empty font-mono">
                            <span>STAND CLEAR — READY FOR ARRIVAL</span>
                            <p className="empty-subtext">Select any occupied gate card to inspect live flight turnaround metrics.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="stand-inspector-empty font-mono">
                        <span>Select any gate stand card to inspect live telemetry</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {viewportTab === 'gantt' && (
              <GanttTimelineComponent
                flights={flights}
                gates={gates}
                gateMap={gateMap}
                aircraftMap={aircraftMap}
                onSelectFlight={handleSelectFlightFromGantt}
                onReassignGate={handleReassignGate}
              />
            )}
              </>
            )}
          </div>
        </section>

        {/* Live Ground Support Equipment (GSE) Vehicle & Dispatch Telemetry */}
        <GseTelemetryComponent selectedAirportCode={selectedAirport} />

        <section className="shadcn-card table-section">
          <div className="section-title-bar">
            <div>
              <h3 className="section-title">Active Flight Turnaround Schedule</h3>
              <p className="section-subtitle">Click task chips to toggle progress. Pushback unlocks when all 4 tasks are complete.</p>
            </div>

            <div className="header-actions">
              <button
                className={`shadcn-btn-secondary btn-compact ${showAnalyticsPanel ? 'active-analytics' : ''}`}
                onClick={() => setShowAnalyticsPanel(!showAnalyticsPanel)}
              >
                <BarChart2 size={14} />
                <span>{showAnalyticsPanel ? 'Hide Analytics' : 'Show Analytics'}</span>
              </button>

              <div className="table-filter-chips">
                <ListFilter size={14} className="text-muted" />
                {['ALL', 'scheduled', 'in_progress', 'delayed', 'departed'].map((fKey) => (
                  <button
                    key={fKey}
                    className={`filter-tab ${flightFilter === fKey ? 'active' : ''}`}
                    onClick={() => setFlightFilter(fKey)}
                  >
                    {fKey === 'ALL' ? 'All' : fKey.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {showAnalyticsPanel && (
            <div className="analytics-collapsible-panel">
              {kpis?.problem_gates && kpis.problem_gates.length > 0 && (
                <div className="problem-alert-banner">
                  <AlertTriangle size={14} />
                  <span>Flagged Problem Gates (&gt;1 std dev avg turnaround): <b>{kpis.problem_gates.join(', ')}</b></span>
                </div>
              )}

              {!kpis?.gate_utilization || kpis.gate_utilization.length === 0 ? (
                <div className="analytics-empty">Not enough flight operational data yet for analytics.</div>
              ) : (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={kpis.gate_utilization} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="gate" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                      <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fafafa',
                          fontSize: '12px',
                        }}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                      />
                      <Bar dataKey="flights_handled" name="Flights Handled" radius={[4, 4, 0, 0]}>
                        {kpis.gate_utilization.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.flights_handled > 2 ? '#86efac' : '#3f3f46'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          <div className="shadcn-table-wrapper">
            <table className="shadcn-table">
              <thead>
                <tr>
                  <th>Flight</th>
                  <th>Gate</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Turnaround Tasks</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
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
                    <tr
                      key={flight._id}
                      id={`flight-row-${flight._id}`}
                      className={`${isDeparted ? 'row-departed' : ''} ${highlightedFlightId === flight._id ? 'highlight-pulse' : ''}`}
                    >
                      <td className="cell-aircraft">
                        <div className="ac-title font-mono">
                          {aircraftMap[flight.aircraft_id] || 'Aircraft Loading...'}
                        </div>
                      </td>

                      <td className="cell-gate font-mono">
                        <span className="gate-pill">
                          {flight.gate_id ? `${gateMap[flight.gate_id] || flight.gate_id.slice(-4)}` : 'Unassigned'}
                        </span>
                      </td>

                      <td className="cell-times font-mono">
                        <div className="time-row">{formatDateTime(flight.arrival_time)} → {formatDateTime(flight.departure_time)}</div>
                      </td>

                      <td>
                        <span className={`status-badge-flight badge-${flight.status}`}>
                          {flight.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="cell-tasks">
                        <div className="task-chip-list">
                          {flightTasks.map((t) => (
                            <button
                              key={t._id}
                              className={`task-chip ${t.status}`}
                              onClick={() => handleToggleTask(t)}
                              title={`Click to set ${t.task_type} to ${t.status === 'completed' ? 'pending' : 'completed'}`}
                            >
                              {t.status === 'completed' ? <Check size={12} /> : <span className="chip-dot" />}
                              <span>{t.task_type.replace('_', ' ')}</span>
                            </button>
                          ))}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {isDeparted ? (
                          <span className="text-departed-done">Departed</span>
                        ) : (
                          <button
                            className="shadcn-btn-primary pushback-action-btn"
                            disabled={!allTasksCompleted}
                            onClick={() => handlePushback(flight._id)}
                          >
                            Push Back
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Floating AI Voice Assistant Drawer Toggle */}
      <div className="floating-voice-widget">
        {showVoiceDrawer ? (
          <div className="voice-drawer-panel shadcn-card">
            <div className="drawer-header">
              <span className="drawer-title">🎙️ AI Voice Command Assistant</span>
              <button className="drawer-close-btn" onClick={() => setShowVoiceDrawer(false)}>✕</button>
            </div>
            <VoiceAssistantComponent onVoiceCommand={handleVoiceCommand} />
          </div>
        ) : (
          <button
            className="floating-voice-btn"
            onClick={() => setShowVoiceDrawer(true)}
            title="Open AI Voice Assistant"
          >
            <Mic size={16} />
            <span>AI Voice Command</span>
          </button>
        )}
      </div>
    </div>
  );
}
