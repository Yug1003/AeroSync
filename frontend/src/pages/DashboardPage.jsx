import React, { useEffect, useState, useRef } from 'react';
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
  User,
  UserCheck,
  UserX,
  UserPlus,
  Lock,
  Plus,
  Edit3,
  Trash2,
  Filter,
  X,
  Truck,
} from 'lucide-react';
import RadarMapComponent from '../components/RadarMapComponent';
import GanttTimelineComponent from '../components/GanttTimelineComponent';
import GseTelemetryComponent from '../components/GseTelemetryComponent';
import VoiceCommandCenter from '../components/VoiceCommandCenter';
import ThemeToggle from '../components/ThemeToggle';
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

function DashboardPageContent() {
  const navigate = useNavigate();
  const airportSelectRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const username = localStorage.getItem('username') || 'Operator';
  const userRole = localStorage.getItem('user_role') || (username === 'admin' ? 'admin' : 'ground_crew');
  const isAdmin = userRole === 'admin' || username === 'admin';
  const staffHomeAirport = localStorage.getItem(`staff_home_airport_${username}`) || 'AMD';

  const [selectedAirport, setSelectedAirport] = useState(() => {
    return !isAdmin ? staffHomeAirport : 'AMD';
  });
  const [kpis, setKpis] = useState(null);
  const [gates, setGates] = useState([]);
  const [flights, setFlights] = useState([]);
  const [aircraftMap, setAircraftMap] = useState({});
  const [gateMap, setGateMap] = useState({});
  const [tasksMap, setTasksMap] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [flightFilter, setFlightFilter] = useState('ALL');

  // Flight Search, Airport/Airline Filters & CRUD Modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [airlineFilter, setAirlineFilter] = useState('ALL');
  const [tableAirportFilter, setTableAirportFilter] = useState('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFlightForEdit, setSelectedFlightForEdit] = useState(null);
  const [selectedFlightForDelete, setSelectedFlightForDelete] = useState(null);

  const [flightForm, setFlightForm] = useState({
    callsign: '',
    airline: 'IndiGo',
    tailNumber: '',
    aircraftType: 'A320neo',
    route: 'AMD ✈️ DEL',
    gate_id: '',
    arrival_time: new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16),
    departure_time: new Date(Date.now() + 120 * 60000).toISOString().slice(0, 16),
    status: 'scheduled',
    airport_code: 'AMD',
  });

  const handleOpenAddModal = () => {
    setFlightForm({
      callsign: `6E ${Math.floor(100 + Math.random() * 900)}`,
      airline: 'IndiGo',
      tailNumber: `VT-IZ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      aircraftType: 'A320neo',
      route: `${selectedAirport} ✈️ DEL`,
      gate_id: gates.length > 0 ? gates[0]._id : '',
      arrival_time: new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16),
      departure_time: new Date(Date.now() + 120 * 60000).toISOString().slice(0, 16),
      status: 'scheduled',
      airport_code: selectedAirport,
    });
    setShowAddModal(true);
  };

  const handleCreateFlightSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      const res = await API.post('flights/', flightForm);
      const newFlight = res.data;

      setFlights((prev) => [newFlight, ...prev]);

      setTasksMap((prev) => ({
        ...prev,
        [newFlight._id]: [
          { _id: `t_bg_${newFlight._id}`, flight_id: newFlight._id, task_type: 'baggage', status: 'pending' },
          { _id: `t_cl_${newFlight._id}`, flight_id: newFlight._id, task_type: 'cleaning', status: 'pending' },
          { _id: `t_rf_${newFlight._id}`, flight_id: newFlight._id, task_type: 'refuel', status: 'pending' },
          { _id: `t_ct_${newFlight._id}`, flight_id: newFlight._id, task_type: 'catering', status: 'pending' },
        ],
      }));

      if (newFlight.aircraft_id) {
        setAircraftMap((prev) => ({
          ...prev,
          [newFlight.aircraft_id]: `${newFlight.tailNumber || 'VT-AIR'} — ${newFlight.callsign || 'Flight'}`,
        }));
      }

      setShowAddModal(false);
      setActionSuccess(`✈️ Flight ${newFlight.callsign || newFlight.tailNumber || 'New Flight'} added successfully!`);

      // Notify all ground staff about the newly scheduled turnaround flight
      notifyStaff('NEW FLIGHT SCHEDULED', `Turnaround flight ${newFlight.callsign || 'FLIGHT'} (${newFlight.tailNumber || 'VT-AIR'}) scheduled at ${selectedAirport}.`, 'new_flight');
    } catch (err) {
      console.error('Failed to create flight:', err);
      setActionError('Failed to create flight. Please check required fields.');
    }
  };

  const handleOpenEditModal = (flight) => {
    setSelectedFlightForEdit(flight);
    setFlightForm({
      callsign: flight.callsign || '',
      airline: flight.airline || (flight.callsign ? flight.callsign.split(' ')[0] : 'IndiGo'),
      tailNumber: flight.tailNumber || '',
      aircraftType: flight.aircraftType || 'A320neo',
      route: flight.route || `${selectedAirport} ✈️ INTL`,
      gate_id: flight.gate_id || '',
      arrival_time: flight.arrival_time ? new Date(flight.arrival_time).toISOString().slice(0, 16) : '',
      departure_time: flight.departure_time ? new Date(flight.departure_time).toISOString().slice(0, 16) : '',
      status: flight.status || 'scheduled',
      airport_code: flight.airport_code || selectedAirport,
    });
    setShowEditModal(true);
  };

  const handleUpdateFlightSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFlightForEdit) return;
    setActionError('');
    setActionSuccess('');

    try {
      const res = await API.patch(`flights/${selectedFlightForEdit._id}/`, flightForm);
      const updatedData = res.data;

      setFlights((prev) =>
        prev.map((f) => (f._id === selectedFlightForEdit._id ? { ...f, ...updatedData, ...flightForm } : f))
      );

      const acId = selectedFlightForEdit.aircraft_id || updatedData.aircraft_id;
      if (acId) {
        setAircraftMap((prev) => ({
          ...prev,
          [acId]: `${flightForm.tailNumber || 'VT-AIR'} — ${flightForm.callsign || 'Flight'}`,
        }));
      }

      setShowEditModal(false);
      setSelectedFlightForEdit(null);
      setActionSuccess(`✏️ Flight ${flightForm.callsign || selectedFlightForEdit._id} details updated successfully!`);
    } catch (err) {
      console.error('Failed to update flight:', err);
      setActionError('Failed to update flight details.');
    }
  };

  const handleOpenDeleteModal = (flight) => {
    setSelectedFlightForDelete(flight);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteFlight = async () => {
    if (!selectedFlightForDelete) return;
    setActionError('');
    setActionSuccess('');
    const fId = selectedFlightForDelete._id;

    try {
      await API.delete(`flights/${fId}/`);
      setFlights((prev) => prev.filter((f) => f._id !== fId));
      setShowDeleteModal(false);
      setSelectedFlightForDelete(null);
      setActionSuccess(`🗑️ Flight ${selectedFlightForDelete.callsign || fId} deleted successfully.`);
    } catch (err) {
      console.error('Failed to delete flight:', err);
      setFlights((prev) => prev.filter((f) => f._id !== fId));
      setShowDeleteModal(false);
      setSelectedFlightForDelete(null);
      setActionSuccess(`🗑️ Flight ${selectedFlightForDelete.callsign || fId} removed.`);
    }
  };

  // Active tab in consolidated Operations Viewport: 'radar' | 'gates' | 'gantt' | 'gse'
  const [viewportTab, setViewportTab] = useState('radar');
  const [gateStandFilter, setGateStandFilter] = useState('ALL');
  const [selectedGateId, setSelectedGateId] = useState(null);
  const [aiDisruptionLoading, setAiDisruptionLoading] = useState(false);

  // Analytics Collapsible Toggle
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const [weather, setWeather] = useState(null);

  const [pendingStaff, setPendingStaff] = useState([]);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const [myAssignedFlightId, setMyAssignedFlightId] = useState(() => {
    return localStorage.getItem(`my_assigned_flight_${username}`) || null;
  });

  const handleSelfAssignFlight = (flight) => {
    setMyAssignedFlightId(flight._id);
    localStorage.setItem(`my_assigned_flight_${username}`, flight._id);
    setActionSuccess(`✓ Assigned yourself to Flight ${flight.callsign || flight.tailNumber || flight._id.slice(-6)} at Gate ${gateMap[flight.gate_id] || 'Stand'}!`);
  };

  const handleUnassignSelf = () => {
    setMyAssignedFlightId(null);
    localStorage.removeItem(`my_assigned_flight_${username}`);
    setActionSuccess(`✓ Duty released. You are now on Standby mode.`);
  };

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
      const dbRes = await API.get(`flights/?airport=${selectedAirport}`);
      const dbFlights = dbRes.data || [];

      // Fetch live radar telemetry (Flightradar24 & OpenSky Satellite feed)
      let rawLive = [];
      try {
        const res = await API.get(`flights/live-radar/?airport=${selectedAirport}`);
        rawLive = res.data.flights || [];
      } catch (err) {
        console.warn('Live radar fetch warning:', err);
      }

      const newAcMap = {};
      const newTasksMap = {};

      const now = new Date();
      const numGates = Math.max(1, gates.length);

      // Process Database Flights from MongoDB
      const processedDbFlights = dbFlights.map((f, idx) => {
        const flightId = f._id;
        const gateIdx = idx % numGates;

        const callsign = f.callsign || `6E-${101 + (idx * 37) % 890}`;
        const tailNumber = f.tailNumber || `VT-AI${idx + 1}`;
        const aircraftType = f.aircraftType || 'A320neo';
        const route = f.route || `${selectedAirport} ✈️ INTL`;

        if (f.aircraft_id) {
          newAcMap[f.aircraft_id] = `${tailNumber} — ${callsign}`;
        }
        newAcMap[flightId] = `${tailNumber} — ${callsign}`;

        if (!newTasksMap[flightId]) {
          newTasksMap[flightId] = [
            { _id: `t_bg_${flightId}`, flight_id: flightId, task_type: 'baggage', status: idx % 2 === 0 ? 'completed' : 'pending' },
            { _id: `t_cl_${flightId}`, flight_id: flightId, task_type: 'cleaning', status: idx % 3 === 0 ? 'completed' : 'pending' },
            { _id: `t_rf_${flightId}`, flight_id: flightId, task_type: 'refuel', status: idx % 4 === 0 ? 'completed' : 'pending' },
            { _id: `t_ct_${flightId}`, flight_id: flightId, task_type: 'catering', status: idx % 2 === 0 ? 'completed' : 'pending' },
          ];
        }

        return {
          ...f,
          callsign,
          tailNumber,
          aircraftType,
          route,
          gate_id: f.gate_id || (gates[gateIdx]?._id || null),
        };
      });

      // Process Live Radar Telemetry Flights
      const processedLiveFlights = rawLive.map((rf, idx) => {
        const flightId = rf.id || `fl_${selectedAirport.toLowerCase()}_live_${idx}`;
        const gateIdx = (idx + processedDbFlights.length) % numGates;
        const slotInGate = Math.floor(idx / numGates);

        const arrMinutesOffset = slotInGate * 150 - 30 + (idx % 2) * 15;
        const arrTime = new Date(now.getTime() + arrMinutesOffset * 60000).toISOString();
        const depTime = new Date(now.getTime() + (arrMinutesOffset + 90) * 60000).toISOString();

        const callsign = rf.callsign || `FR-${idx + 301}`;
        const tailNumber = rf.tailNumber || rf.icao24 || `VT-LR${idx + 1}`;

        newAcMap[flightId] = `${tailNumber} — ${callsign}`;

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
          callsign,
          tailNumber,
          aircraftType: rf.aircraft_type || 'Commercial Jet',
          route: rf.route || `${selectedAirport} ✈️ INTL`,
          airport_code: selectedAirport,
        };
      });

      // Merge DB flights + Live Radar flights without duplicates
      const mergedFlightMap = new Map();
      processedDbFlights.forEach((f) => mergedFlightMap.set(f._id, f));
      processedLiveFlights.forEach((f) => {
        if (!mergedFlightMap.has(f._id)) {
          mergedFlightMap.set(f._id, f);
        }
      });

      const combinedOperationalFlights = Array.from(mergedFlightMap.values());

      setAircraftMap((prev) => ({
        ...newAcMap,
        ...prev,
      }));

      setTasksMap((prev) => ({
        ...newTasksMap,
        ...prev,
      }));

      setFlights(combinedOperationalFlights);
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

  const handleMarkAsRead = async (notifId) => {
    try {
      await API.patch(`notifications/${notifId}/`, { is_read: true });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };
  const handleMarkNotificationRead = handleMarkAsRead;

  // Helper to dispatch staff alert notifications
  const notifyStaff = async (title, message, notifType = 'gate_change') => {
    try {
      const res = await API.post('notifications/', {
        message: `${title}: ${message}`,
        notification_type: notifType,
      });
      if (res.data) {
        setNotifications((prev) => [res.data, ...(Array.isArray(prev) ? prev : [])]);
      }
    } catch (e) {
      console.warn('Notify staff error:', e);
      setNotifications((prev) => [
        { id: `notif_${Date.now()}`, title, message, is_read: false, timestamp: new Date().toLocaleTimeString() },
        ...(Array.isArray(prev) ? prev : []),
      ]);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedAirport]);

  // Auto-refresh operations viewport data once whenever tab changes
  useEffect(() => {
    loadAllData();
  }, [viewportTab]);

  const handleVoiceCommand = (commandType, payload) => {
    switch (commandType) {
      case 'switch_airport':
        if (payload) {
          setSelectedAirport(payload);
          setActionSuccess(`⚡ [VOICE DISPATCH]: Switched Airport Hub to ${payload}. Loading live radar & flight telemetry.`);
        }
        break;
      case 'ai_disruption':
        handleRunAiDisruptionRecovery();
        break;
      case 'nav_staff_roster':
        navigate('/staff-roster');
        break;
      case 'nav_analytics':
        navigate('/analytics');
        break;
      case 'nav_incidents':
      case 'NAVIGATE_INCIDENTS':
        navigate('/incidents');
        break;
      case 'NAVIGATE_ACTIVITY':
        navigate('/activity-log');
        break;
      case 'switch_radar':
        setViewportTab('radar');
        setActionSuccess('⚡ [VOICE DISPATCH]: Viewport switched to Live Radar Map.');
        break;
      case 'switch_gates':
        setViewportTab('gates');
        setActionSuccess('⚡ [VOICE DISPATCH]: Viewport switched to Gate Occupancy Matrix.');
        break;
      case 'switch_gantt':
        setViewportTab('gantt');
        setActionSuccess('⚡ [VOICE DISPATCH]: Viewport switched to Gantt Timeline Schedule.');
        break;
      case 'refresh_data':
      case 'REFRESH_DATA':
        setFlightFilter('ALL');
        loadAllData();
        setActionSuccess('⚡ [VOICE DISPATCH]: All live telemetry, gates, and flights refreshed.');
        break;
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
      default:
        if (payload) {
          setActionSuccess(`⚡ [VOICE DISPATCH EXECUTED]: "${payload}"`);
        }
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

      // Notify staff about gate change
      notifyStaff('GATE REASSIGNMENT', `Flight ${targetFlight.callsign || flightId.slice(-6)} reassigned to Stand Gate ${newGateLabel || newGateId.slice(-4)}.`, 'gate_change');

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
          <div className="brand-badge" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} title="Go to Dashboard">
            <div className="brand-logo-small">
              <Plane size={16} />
            </div>
            <span className="brand-name">AeroSync</span>
          </div>

          {isAdmin ? (
            <div
              className="airport-selector-box"
              onClick={(e) => {
                if (e.target.tagName !== 'SELECT' && airportSelectRef.current) {
                  try {
                    if (airportSelectRef.current.showPicker) {
                      airportSelectRef.current.showPicker();
                    } else {
                      airportSelectRef.current.focus();
                    }
                  } catch (err) {
                    airportSelectRef.current.focus();
                  }
                }
              }}
            >
              <MapPin size={14} className="selector-icon" />
              <select
                ref={airportSelectRef}
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
              <ChevronDown size={14} className="selector-arrow" style={{ cursor: 'pointer' }} />
            </div>
          ) : (
            <div className="airport-selector-box" style={{ borderColor: 'rgba(14, 165, 233, 0.4)' }}>
              <MapPin size={14} className="selector-icon text-cyan" />
              <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>
                Station: [{selectedAirport}] {selectedAirportObj.city} (Assigned Station)
              </span>
            </div>
          )}
        </div>

        <div className="header-right">
          {/* Weather Pill (Icon & Temperature Only) */}
          {weather && (
            <div className="weather-dropdown-container">
              <button
                className={`weather-pill-btn severity-${weather.severity}`}
                onClick={fetchWeather}
                title="Current Station Weather (Click to refresh)"
              >
                <CloudSun size={14} />
                <span>{weather.temp_c}°C</span>
                <span className={`wx-dot ${weather.severity}`} />
              </button>
            </div>
          )}

          <div className="notif-dropdown-container">
            <button
              className="notif-btn"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              title="Alert Notifications"
            >
              <Bell size={16} />
              {(Array.isArray(notifications) ? notifications.filter((n) => !n.is_read) : []).length > 0 && (
                <span className="notif-badge-count">
                  {(Array.isArray(notifications) ? notifications.filter((n) => !n.is_read) : []).length}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="notif-popover shadcn-card">
                <div className="popover-header">
                  <h4>Alert Notifications</h4>
                  <span className="notif-unread-count">
                    {(Array.isArray(notifications) ? notifications.filter((n) => !n.is_read) : []).length} Unread
                  </span>
                </div>
                <div className="notif-list">
                  {(!Array.isArray(notifications) || notifications.length === 0) ? (
                    <div className="notif-empty">No unread alerts.</div>
                  ) : (
                    notifications.map((n) => {
                      const cleanTitle = (n.title || n.notification_type || 'ALERT UPDATE').replace(/^(notification|notif|alert)[\s:-]*/gi, '').trim().toUpperCase();
                      const cleanMsg = (n.message || '').replace(/^(notification|notif|alert)[\s:-]*/gi, '').trim();
                      return (
                        <div
                          key={n.id || Math.random()}
                          className={`notif-item priority-${n.priority || 'medium'} ${n.is_read ? 'read' : 'unread'}`}
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          <div className="notif-title font-mono">{cleanTitle || 'DISPATCH ALERT'}</div>
                          <div className="notif-msg">{cleanMsg}</div>
                          <span className="notif-time font-mono">{n.created_at ? new Date(n.created_at).toLocaleTimeString() : (n.timestamp || '')}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {isAdmin && (
            <>
              <button className="shadcn-btn-ghost nav-btn" onClick={() => navigate('/staff-roster')}>
                <User size={14} />
                <span>Staff Roster</span>
              </button>
              <button className="shadcn-btn-ghost nav-btn" onClick={() => navigate('/pending-approvals')}>
                <UserCheck size={14} />
                <span>Staff Approvals {Array.isArray(pendingStaff) && pendingStaff.length > 0 && `(${pendingStaff.length})`}</span>
              </button>
              <button className="shadcn-btn-ghost nav-btn" onClick={() => navigate('/analytics')}>
                <BarChart2 size={14} />
                <span>Executive Analytics</span>
              </button>
            </>
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

          <ThemeToggle />

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

        {!isAdmin ? (
          /* DEDICATED STAFF GROUND OPERATIONS PORTAL */
          <div className="staff-portal-wrapper font-mono">
            {actionSuccess && (
              <div className="alert-bar success font-mono" style={{ marginBottom: '1rem' }}>
                <Check size={16} />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Staff Duty Header Banner */}
            <div className="staff-duty-banner shadcn-card font-mono">
              <div className="banner-info">
                <div className="badge-duty-status">
                  <span className={`dot ${myAssignedFlightId ? 'dot-active' : 'dot-standby'}`}></span>
                  <span>{myAssignedFlightId ? 'ON DUTY — AIRCRAFT ASSIGNED' : 'STANDBY MODE — NO AIRCRAFT ASSIGNED'}</span>
                </div>
                <h2>👷 Ground Operations Staff Duty Terminal</h2>
              </div>

              {myAssignedFlightId && (
                <button className="shadcn-btn-secondary unassign-duty-btn" onClick={handleUnassignSelf}>
                  <UserX size={14} />
                  <span>Finish Duty / Release Aircraft</span>
                </button>
              )}
            </div>

            {/* Section 1: My Assigned Aircraft Duty Card */}
            {myAssignedFlightId ? (() => {
              const assignedFlight = flights.find((f) => f._id === myAssignedFlightId) || flights[0];
              if (!assignedFlight) return null;
              const flightTasks = tasksMap[assignedFlight._id] || [];
              const completedTasksCount = flightTasks.filter((t) => t.status === 'completed').length;
              const progressPct = (completedTasksCount / 4) * 100;

              return (
                <section className="shadcn-card assigned-aircraft-card font-mono">
                  <div className="card-header-row">
                    <div className="aircraft-title-box">
                      <span className="badge-assigned-tag">✈️ MY ASSIGNED AIRCRAFT</span>
                      <h3>{aircraftMap[assignedFlight.aircraft_id] || assignedFlight.callsign || 'Assigned Aircraft'}</h3>
                      <span className="gate-tag">Stand: Gate {gateMap[assignedFlight.gate_id] || 'Stand'}</span>
                    </div>
                    <span className={`status-badge-flight badge-${assignedFlight.status}`}>
                      {(assignedFlight.status || 'scheduled').toUpperCase()}
                    </span>
                  </div>

                  <div className="assigned-aircraft-grid">
                    <div className="meta-box">
                      <span className="meta-label">Route & Schedule</span>
                      <div className="meta-val">{assignedFlight.route || `${selectedAirport} ✈️ INTL`}</div>
                      <div className="meta-time">
                        <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        {formatDateTime(assignedFlight.arrival_time)} → {formatDateTime(assignedFlight.departure_time)}
                      </div>
                    </div>

                    <div className="meta-box">
                      <span className="meta-label">Aircraft Type & Tail</span>
                      <div className="meta-val">{assignedFlight.aircraftType || 'A320neo'}</div>
                      <div className="meta-tail">Tail Number: {assignedFlight.tailNumber || 'VT-AIR'}</div>
                    </div>

                    <div className="meta-box">
                      <span className="meta-label">Turnaround Completion</span>
                      <div className="meta-val">{completedTasksCount} / 4 Tasks Finished ({progressPct}%)</div>
                      <div className="progress-track" style={{ marginTop: '0.4rem' }}>
                        <div className="progress-fill" style={{ width: `${progressPct}%`, backgroundColor: '#86efac' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="turnaround-tasks-section font-mono" style={{ marginTop: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      📋 Turnaround Checklist — Click task to toggle completed status:
                    </h4>
                    <div className="task-chip-list">
                      {flightTasks.map((t) => (
                        <button
                          key={t._id}
                          className={`task-chip ${t.status}`}
                          onClick={() => handleToggleTask(t)}
                          style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                        >
                          {t.status === 'completed' ? <Check size={14} /> : <span className="chip-dot" />}
                          <span>{t.task_type.replace('_', ' ')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })() : (
              <section className="shadcn-card no-assignment-alert font-mono" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <AlertTriangle size={32} className="text-amber" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3>No Aircraft Currently Assigned to You</h3>
              </section>
            )}

            {/* Section 2: Standing Aircraft Catalog for Self-Assignment */}
            <section className="shadcn-card table-section font-mono" style={{ marginTop: '1.5rem' }}>
              <div className="section-title-bar">
                <div>
                  <h3 className="section-title">✈️ Standing Aircraft Catalog at {selectedAirport}</h3>
                </div>
              </div>

              <div className="shadcn-table-wrapper">
                <table className="shadcn-table">
                  <thead>
                    <tr>
                      <th>Flight / Tail Number</th>
                      <th>Gate / Stand</th>
                      <th>Schedule</th>
                      <th>Status</th>
                      <th>Turnaround Progress</th>
                      <th style={{ textAlign: 'right' }}>Self-Assignment Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flights.map((flight) => {
                      const isAssignedToMe = myAssignedFlightId === flight._id;
                      const flightTasks = tasksMap[flight._id] || [];
                      const completedTasks = flightTasks.filter((t) => t.status === 'completed').length;

                      return (
                        <tr key={flight._id} className={isAssignedToMe ? 'row-assigned-me' : ''}>
                          <td>
                            <strong>{aircraftMap[flight.aircraft_id] || flight.callsign}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{flight.route}</div>
                          </td>
                          <td>
                            <span className="gate-pill">{gateMap[flight.gate_id] || 'Stand'}</span>
                          </td>
                          <td>{formatDateTime(flight.arrival_time)} → {formatDateTime(flight.departure_time)}</td>
                          <td>
                            <span className={`status-badge-flight badge-${flight.status}`}>
                              {(flight.status || 'scheduled').toUpperCase()}
                            </span>
                          </td>
                          <td>{completedTasks} / 4 Tasks</td>
                          <td style={{ textAlign: 'right' }}>
                            {isAssignedToMe ? (
                              <span className="badge-assigned-label">✓ Assigned to You</span>
                            ) : myAssignedFlightId ? (
                              <button
                                type="button"
                                className="shadcn-btn-secondary btn-compact"
                                disabled
                                style={{ opacity: 0.5, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                                title="Complete your current assigned aircraft turnaround duty before claiming another aircraft."
                              >
                                <Lock size={12} />
                                <span>Complete Current Duty First</span>
                              </button>
                            ) : (
                              <button
                                className="shadcn-btn-primary btn-compact"
                                onClick={() => handleSelfAssignFlight(flight)}
                              >
                                <UserPlus size={13} />
                                <span>Claim & Assign to Me</span>
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
          </div>
        ) : (
          /* FULL EXECUTIVE ADMIN CONTROL CENTER */
          <>
            {/* AI Voice Command Center */}
            <VoiceCommandCenter onRunCommand={handleVoiceCommand} selectedAirport={selectedAirport} />

        <section className="shadcn-card viewport-card">
          <div className="viewport-tab-bar">
            <div className="viewport-tabs">
              <button
                className={`viewport-tab ${viewportTab === 'radar' ? 'active' : ''}`}
                onClick={() => setViewportTab('radar')}
              >
                <Plane size={14} />
                <span>Live Radar</span>
              </button>
              <button
                className={`viewport-tab ${viewportTab === 'gates' ? 'active' : ''}`}
                onClick={() => setViewportTab('gates')}
              >
                <LayoutGrid size={14} />
                <span>Gate Status</span>
              </button>
              <button
                className={`viewport-tab ${viewportTab === 'gantt' ? 'active' : ''}`}
                onClick={() => setViewportTab('gantt')}
              >
                <Calendar size={14} />
                <span>Gantt Schedule</span>
              </button>
              <button
                className={`viewport-tab ${viewportTab === 'gse' ? 'active' : ''}`}
                onClick={() => setViewportTab('gse')}
              >
                <Truck size={14} />
                <span>GSE Telemetry</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="shadcn-btn-primary btn-compact"
                style={{ backgroundColor: '#86efac', borderColor: '#86efac', color: '#09090b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
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

            {viewportTab === 'gse' && (
              <GseTelemetryComponent selectedAirportCode={selectedAirport} />
            )}
          </div>
        </section>

        <section className="shadcn-card table-section">
          <div className="section-title-bar">
            <div>
              <h3 className="section-title">Active Flight Turnaround Schedule</h3>
            </div>

            <div className="header-actions">
              {isAdmin && (
                <button className="shadcn-btn-primary btn-compact" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#86efac', borderColor: '#86efac', color: '#09090b', fontWeight: '600' }}>
                  <Plus size={14} />
                  <span>Add Flight</span>
                </button>
              )}

              <button
                className={`shadcn-btn-secondary btn-compact ${showAnalyticsPanel ? 'active-analytics' : ''}`}
                onClick={() => setShowAnalyticsPanel(!showAnalyticsPanel)}
              >
                <BarChart2 size={14} />
                <span>{showAnalyticsPanel ? 'Hide Analytics' : 'Analytics'}</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flight-toolbar-bar font-mono">
            <div className="search-input-box">
              <Search size={14} className="search-icon-svg" />
              <input
                type="text"
                className="search-input-field"
                placeholder="Search callsign, tail #, route, model, gate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="filter-select-group">
              <div className="filter-select-box">
                <MapPin size={13} className="filter-icon" />
                <select
                  className="filter-select"
                  value={tableAirportFilter}
                  onChange={(e) => setTableAirportFilter(e.target.value)}
                >
                  <option value="ALL">All Airports (Station Filter)</option>
                  {INDIAN_AIRPORTS.map((apt) => (
                    <option key={apt.code} value={apt.code}>
                      [{apt.code}] {apt.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-select-box">
                <Plane size={13} className="filter-icon" />
                <select
                  className="filter-select"
                  value={airlineFilter}
                  onChange={(e) => setAirlineFilter(e.target.value)}
                >
                  <option value="ALL">All Airlines</option>
                  <option value="IndiGo">IndiGo (6E)</option>
                  <option value="Air India">Air India (AI)</option>
                  <option value="Akasa Air">Akasa Air (QP)</option>
                  <option value="SpiceJet">SpiceJet (SG)</option>
                  <option value="Vistara">Vistara (UK)</option>
                  <option value="Emirates">Emirates (EK)</option>
                  <option value="Singapore Airlines">Singapore Airlines (SQ)</option>
                </select>
              </div>

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
                  <th>Flight / Aircraft</th>
                  <th>Gate</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Turnaround Tasks</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flights
                  .filter((f) => {
                    if (flightFilter !== 'ALL' && f.status !== flightFilter.toLowerCase()) return false;
                    if (tableAirportFilter !== 'ALL') {
                      const apt = f.airport_code || f.origin || (f.route ? f.route.slice(0, 3) : '');
                      if (apt !== tableAirportFilter && !f.route?.includes(tableAirportFilter)) return false;
                    }
                    if (airlineFilter !== 'ALL') {
                      const acInfo = aircraftMap[f.aircraft_id] || f.callsign || '';
                      const fAirline = f.airline || (f.callsign ? f.callsign.split(' ')[0] : '');
                      if (!fAirline.toLowerCase().includes(airlineFilter.toLowerCase()) && !acInfo.toLowerCase().includes(airlineFilter.toLowerCase())) return false;
                    }
                    if (searchQuery.trim() !== '') {
                      const q = searchQuery.toLowerCase();
                      const callsign = (f.callsign || '').toLowerCase();
                      const tail = (f.tailNumber || '').toLowerCase();
                      const route = (f.route || '').toLowerCase();
                      const type = (f.aircraftType || '').toLowerCase();
                      const gateName = (gateMap[f.gate_id] || '').toLowerCase();
                      const acInfo = (aircraftMap[f.aircraft_id] || '').toLowerCase();
                      return callsign.includes(q) || tail.includes(q) || route.includes(q) || type.includes(q) || gateName.includes(q) || acInfo.includes(q);
                    }
                    return true;
                  })
                  .map((flight) => {
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
                            {aircraftMap[flight.aircraft_id] || flight.callsign || 'Aircraft Loading...'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{flight.route}</div>
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
                          <div className="row-action-btns">
                            <button
                              className="shadcn-btn-secondary btn-icon-only"
                              onClick={() => handleOpenEditModal(flight)}
                              title="Edit Flight Details"
                            >
                              <Edit3 size={13} />
                            </button>

                            {isAdmin && (
                              <button
                                className="shadcn-btn-secondary btn-icon-only btn-danger-hover"
                                onClick={() => handleOpenDeleteModal(flight)}
                                title="Delete Flight Record"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}

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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal 1: Add Flight Modal */}
        {showAddModal && (
          <div className="modal-backdrop">
            <div className="modal-card shadcn-card font-mono">
              <div className="modal-header">
                <h3>✈️ Add New Flight Operation</h3>
                <button className="modal-close-btn" onClick={() => setShowAddModal(false)}><X size={16} /></button>
              </div>

              <form onSubmit={handleCreateFlightSubmit} className="modal-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Flight Callsign / No.</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 6E 404"
                      value={flightForm.callsign}
                      onChange={(e) => setFlightForm({ ...flightForm, callsign: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Airline Operator</label>
                    <select
                      value={flightForm.airline}
                      onChange={(e) => setFlightForm({ ...flightForm, airline: e.target.value })}
                    >
                      <option value="IndiGo">IndiGo</option>
                      <option value="Air India">Air India</option>
                      <option value="Akasa Air">Akasa Air</option>
                      <option value="SpiceJet">SpiceJet</option>
                      <option value="Vistara">Vistara</option>
                      <option value="Emirates">Emirates</option>
                      <option value="Singapore Airlines">Singapore Airlines</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tail / Registration No.</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VT-IZB"
                      value={flightForm.tailNumber}
                      onChange={(e) => setFlightForm({ ...flightForm, tailNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Aircraft Model</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A320neo"
                      value={flightForm.aircraftType}
                      onChange={(e) => setFlightForm({ ...flightForm, aircraftType: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Route Corridor</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AMD ✈️ DEL"
                      value={flightForm.route}
                      onChange={(e) => setFlightForm({ ...flightForm, route: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Assigned Gate Stand</label>
                    <select
                      value={flightForm.gate_id}
                      onChange={(e) => setFlightForm({ ...flightForm, gate_id: e.target.value })}
                    >
                      <option value="">Auto-Assign Free Gate</option>
                      {gates.map((g) => (
                        <option key={g._id} value={g._id}>
                          Gate {g.label} ({g.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Arrival Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={flightForm.arrival_time}
                      onChange={(e) => setFlightForm({ ...flightForm, arrival_time: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Departure Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={flightForm.departure_time}
                      onChange={(e) => setFlightForm({ ...flightForm, departure_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="shadcn-btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="shadcn-btn-primary">
                    Create Flight
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Edit Flight Modal */}
        {showEditModal && selectedFlightForEdit && (
          <div className="modal-backdrop">
            <div className="modal-card shadcn-card font-mono">
              <div className="modal-header">
                <h3>✏️ Edit Flight Details: {selectedFlightForEdit.callsign || selectedFlightForEdit._id}</h3>
                <button className="modal-close-btn" onClick={() => setShowEditModal(false)}><X size={16} /></button>
              </div>

              <form onSubmit={handleUpdateFlightSubmit} className="modal-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Callsign / Flight No.</label>
                    <input
                      type="text"
                      required
                      value={flightForm.callsign}
                      onChange={(e) => setFlightForm({ ...flightForm, callsign: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Airline Operator</label>
                    <select
                      value={flightForm.airline}
                      onChange={(e) => setFlightForm({ ...flightForm, airline: e.target.value })}
                    >
                      <option value="IndiGo">IndiGo</option>
                      <option value="Air India">Air India</option>
                      <option value="Akasa Air">Akasa Air</option>
                      <option value="SpiceJet">SpiceJet</option>
                      <option value="Vistara">Vistara</option>
                      <option value="Emirates">Emirates</option>
                      <option value="Singapore Airlines">Singapore Airlines</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tail Number</label>
                    <input
                      type="text"
                      required
                      value={flightForm.tailNumber}
                      onChange={(e) => setFlightForm({ ...flightForm, tailNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Aircraft Model</label>
                    <input
                      type="text"
                      required
                      value={flightForm.aircraftType}
                      onChange={(e) => setFlightForm({ ...flightForm, aircraftType: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Route Corridor</label>
                    <input
                      type="text"
                      required
                      value={flightForm.route}
                      onChange={(e) => setFlightForm({ ...flightForm, route: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Assigned Gate Stand</label>
                    <select
                      value={flightForm.gate_id}
                      onChange={(e) => setFlightForm({ ...flightForm, gate_id: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {gates.map((g) => (
                        <option key={g._id} value={g._id}>
                          Gate {g.label} ({g.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Operational Status</label>
                    <select
                      value={flightForm.status}
                      onChange={(e) => setFlightForm({ ...flightForm, status: e.target.value })}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In Progress</option>
                      <option value="delayed">Delayed</option>
                      <option value="departed">Departed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Arrival Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={flightForm.arrival_time}
                      onChange={(e) => setFlightForm({ ...flightForm, arrival_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="shadcn-btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="shadcn-btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Delete Flight Confirmation Modal */}
        {showDeleteModal && selectedFlightForDelete && (
          <div className="modal-backdrop">
            <div className="modal-card shadcn-card font-mono danger-modal">
              <div className="modal-header">
                <h3 className="text-red">⚠️ Confirm Flight Deletion</h3>
                <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}><X size={16} /></button>
              </div>

              <div className="modal-body font-mono">
                <p>Are you sure you want to permanently delete flight record <strong>{selectedFlightForDelete.callsign || selectedFlightForDelete._id}</strong> ({selectedFlightForDelete.route})?</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>This action cannot be undone.</p>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="shadcn-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="shadcn-btn-primary btn-danger" onClick={handleConfirmDeleteFlight}>
                  Yes, Delete Flight
                </button>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}

class DashboardPageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2 style={{ color: '#ef4444' }}>⚠️ AeroSync Operations Dashboard Error Recovered</h2>
          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>{this.state.error?.toString()}</p>
          <button
            style={{ marginTop: '1.5rem', padding: '0.6rem 1.2rem', backgroundColor: '#86efac', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
          >
            🔄 Reload Operations Dashboard
          </button>
        </div>
      );
    }

    return <DashboardPageContent {...this.props} />;
  }
}

export default DashboardPageErrorBoundary;
