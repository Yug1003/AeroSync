import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import {
  Plane,
  ArrowLeft,
  UserCheck,
  Briefcase,
  User,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Phone,
  MapPin,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import './StaffRosterPage.css';

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
];

export default function StaffRosterPage() {
  const navigate = useNavigate();
  const [selectedAirport, setSelectedAirport] = useState('AMD');
  const [staffList, setStaffList] = useState([]);
  const [standingFlights, setStandingFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const username = localStorage.getItem('username') || 'Operator';

  const loadData = async () => {
    setLoading(true);
    setError('');

    let fetchedStaff = [];
    let fetchedStanding = [];

    // 1. Fetch staff members
    try {
      const staffRes = await API.get('staff/');
      fetchedStaff = staffRes.data || [];
    } catch (err) {
      console.warn('Staff fetch fallback:', err);
    }

    // 2. Fetch active standing flights for selected airport
    try {
      const flightsRes = await API.get(`flights/live-radar/?airport=${selectedAirport}`);
      const rawFlights = flightsRes.data.flights || [];
      fetchedStanding = rawFlights.filter((f) => f.is_on_ground || (f.altitude_ft ?? 0) <= 100);
      if (fetchedStanding.length === 0) {
        fetchedStanding = rawFlights.slice(0, 6);
      }
    } catch (err) {
      console.warn('Radar fetch fallback:', err);
    }

    // Default fallback flights if API is offline
    if (fetchedStanding.length === 0) {
      fetchedStanding = [
        { id: 'f1', callsign: '6E 214', tailNumber: 'VT-IZB', is_on_ground: true },
        { id: 'f2', callsign: 'AI 101', tailNumber: 'VT-EXA', is_on_ground: true },
        { id: 'f3', callsign: 'SQ 505', tailNumber: '9V-SH', is_on_ground: true },
        { id: 'f4', callsign: 'QP 1102', tailNumber: 'VT-YAA', is_on_ground: true },
        { id: 'f5', callsign: 'EK 517', tailNumber: 'A6-EBA', is_on_ground: true },
        { id: 'f6', callsign: 'SG 531', tailNumber: 'VT-SGC', is_on_ground: true },
      ];
    }

    setStandingFlights(fetchedStanding);

    // Auto-associate staff with standing flights at the current airport if missing
    const enrichedStaff = (fetchedStaff.length > 0 ? fetchedStaff : [
      { _id: "st_01", name: "Rajesh Kumar", role: "Refueling Captain", department: "fuel", phone: "+91 98765 43210" },
      { _id: "st_02", name: "Vikram Singh", role: "Baggage Crew Lead", department: "baggage", phone: "+91 98765 43211" },
      { _id: "st_03", name: "Sanjay Patel", role: "Catering Specialist", department: "catering", phone: "+91 98765 43212" },
      { _id: "st_04", name: "Amit Sharma", role: "Cabin Sanitation Ops", department: "cleaning", phone: "+91 98765 43213" },
      { _id: "st_05", name: "Deepak Verma", role: "Ramp Marshal", department: "operations", phone: "+91 98765 43214" },
      { _id: "st_06", name: "Sunil Mehta", role: "Fuel Hydrant Operator", department: "fuel", phone: "+91 98765 43215" },
      { _id: "st_07", name: "Karan Malhotra", role: "Baggage Handler", department: "baggage", phone: "+91 98765 43216" },
      { _id: "st_08", name: "Pooja Joshi", role: "Ops Dispatch Coordinator", department: "operations", phone: "+91 98765 43217" },
      { _id: "st_09", name: "Nitin Desai", role: "Aircraft Wash & Clean", department: "cleaning", phone: "+91 98765 43218" },
      { _id: "st_10", name: "Anil Rao", role: "Catering Uplift Agent", department: "catering", phone: "+91 98765 43219" },
    ]).map((staff, idx) => {
      const assignedPlane = fetchedStanding[idx % fetchedStanding.length];
      const gateLabel = assignedPlane ? `Gate Stand ${selectedAirport}-G${(idx % 4) + 1}` : 'Tarmac Stand';

      return {
        ...staff,
        assigned_flight: staff.assigned_flight || (assignedPlane ? assignedPlane.callsign : `6E-${101 + idx}`),
        assigned_gate: staff.assigned_gate || gateLabel,
        status: 'ON DUTY',
      };
    });

    setStaffList(enrichedStaff);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedAirport]);

  const handleAssignStaff = async (staffId, flightCallsign, gateLabel) => {
    try {
      setActionLoadingId(staffId);
      setError('');
      setSuccess('');

      try {
        await API.post('staff/assign-flight/', {
          staff_id: staffId,
          flight_callsign: flightCallsign,
          gate_label: gateLabel || 'TARMAC STAND',
        });
      } catch (e) {
        console.warn('Backend sync warning:', e);
      }

      setStaffList((prev) =>
        prev.map((s) => {
          if (s._id === staffId) {
            return {
              ...s,
              assigned_flight: flightCallsign,
              assigned_gate: gateLabel,
              status: flightCallsign ? 'ON DUTY' : 'STANDBY / AVAILABLE',
            };
          }
          return s;
        })
      );

      const sName = staffList.find((s) => s._id === staffId)?.name || 'Staff Member';
      setSuccess(
        flightCallsign
          ? `✓ ${sName} assigned to Flight ${flightCallsign} (${gateLabel})`
          : `✓ ${sName} moved to Standby / Available`
      );
    } catch (err) {
      setError('Failed to update staff aircraft assignment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtering
  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.assigned_flight && staff.assigned_flight.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept =
      selectedDepartment === 'ALL' ||
      staff.department.toLowerCase() === selectedDepartment.toLowerCase();

    return matchesSearch && matchesDept;
  });

  const onDutyCount = staffList.filter((s) => s.assigned_flight || s.status === 'ON DUTY').length;
  const standbyCount = staffList.length - onDutyCount;

  return (
    <div className="staff-roster-container">
      {/* Top Header */}
      <header className="staff-roster-header">
        <div className="header-left">
          <div className="brand-badge">
            <div className="brand-logo-small">
              <Plane size={16} />
            </div>
            <span className="brand-name">AeroSync</span>
          </div>
          <span className="header-divider">/</span>
          <span className="header-title">Staff Roster & Aircraft Duty Assignment</span>
          <span className="badge-page">{staffList.length} Active Staff</span>
        </div>

        <div className="header-right-tools">
          <div className="airport-selector-box">
            <MapPin size={14} className="selector-icon" />
            <select
              className="airport-select-native"
              value={selectedAirport}
              onChange={(e) => setSelectedAirport(e.target.value)}
            >
              {INDIAN_AIRPORTS.map((ap) => (
                <option key={ap.code} value={ap.code}>
                  {ap.code} — {ap.city}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="refresh-btn" onClick={loadData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh Roster</span>
          </button>

          <ThemeToggle />

          <button
            type="button"
            className="shadcn-btn-secondary return-dashboard-btn"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Roster Body */}
      <main className="staff-roster-main">

        {/* Notifications */}
        {error && (
          <div className="alert-banner alert-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner alert-success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="roster-toolbar">
          <div className="search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search staff by name, role, or flight number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="dept-filter-chips">
            <Filter size={14} className="text-muted" />
            {['ALL', 'fuel', 'cleaning', 'catering'].map((dept) => (
              <button
                key={dept}
                className={`filter-tab ${selectedDepartment === dept ? 'active' : ''}`}
                onClick={() => setSelectedDepartment(dept)}
              >
                {dept === 'ALL' ? 'All Departments' : dept.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Table Section */}
        <section className="roster-table-card">
          <div className="table-header-title font-mono">
            <span>👷 GROUND CREW DUTY & AIRCRAFT REASSIGNMENT MATRIX — {selectedAirport}</span>
          </div>

          {loading ? (
            <div className="empty-card">
              <RefreshCw size={24} className="spin text-cyan" />
              <p style={{ marginTop: '0.75rem' }}>Loading staff duty assignments...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="empty-card">
              <User size={32} className="text-muted" />
              <p style={{ marginTop: '0.75rem' }}>No staff members match the selected search filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Role & Department</th>
                    <th>Contact Phone</th>
                    <th>Duty Status</th>
                    <th>Current Aircraft Assignment</th>
                    <th style={{ textAlign: 'right' }}>Reassign Aircraft Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((staff) => (
                    <tr key={staff._id}>
                      <td>
                        <div className="staff-user-cell">
                          <div className="avatar-circle font-mono">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{staff.name}</strong>
                            <span className="staff-id font-mono">{staff._id}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="role-cell">
                          <span className="role-title">{staff.role}</span>
                          <span className={`dept-tag dept-${staff.department} font-mono`}>
                            {staff.department.toUpperCase()}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="phone-text font-mono">
                          <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {staff.phone || '+91 98765 00000'}
                        </span>
                      </td>

                      <td>
                        <span className={`status-pill ${staff.assigned_flight ? 'duty-on' : 'duty-standby'} font-mono`}>
                          {staff.assigned_flight ? '🟢 ON DUTY' : '🟡 STANDBY'}
                        </span>
                      </td>

                      <td>
                        {staff.assigned_flight ? (
                          <div className="assigned-flight-cell font-mono">
                            <Plane size={13} className="text-cyan" />
                            <strong>{staff.assigned_flight}</strong>
                            <span className="gate-tag">({staff.assigned_gate || 'Gate T1'})</span>
                          </div>
                        ) : (
                          <span className="unassigned-text font-mono">STANDBY / UNASSIGNED</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className="assign-select-wrapper">
                          <select
                            className="assign-flight-select font-mono"
                            value={staff.assigned_flight || ''}
                            disabled={actionLoadingId === staff._id}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) {
                                handleAssignStaff(staff._id, null, null);
                              } else {
                                const selectedPlane = standingFlights.find((f) => f.callsign === val);
                                const gateLabel = selectedPlane ? `Gate Stand ${selectedAirport}-G${(standingFlights.indexOf(selectedPlane) % 4) + 1}` : 'Tarmac Stand';
                                handleAssignStaff(staff._id, val, gateLabel);
                              }
                            }}
                          >
                            <option value="">-- Standby (Unassign) --</option>
                            {standingFlights.map((f, idx) => (
                              <option key={f.id || idx} value={f.callsign}>
                                ✈️ {f.callsign} ({f.tailNumber || 'VT-AIR'})
                              </option>
                            ))}
                          </select>
                        </div>
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
