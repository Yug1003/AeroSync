import React, { useEffect, useState } from 'react';
import API from '../api/api';
import {
  Truck,
  BatteryCharging,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Search,
  X,
  ListFilter,
  Check,
} from 'lucide-react';
import './GseTelemetryComponent.css';

export default function GseTelemetryComponent({ selectedAirportCode = 'AMD' }) {
  const [gseFleet, setGseFleet] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);

  const [gseForm, setGseForm] = useState({
    id: '',
    vehicle: '',
    type: 'Baggage Electric Tug',
    operator: '',
    battery: 90,
    status: 'Active / Refueling',
    gate: 'T1-G1',
    assigned_flight: '6E 214',
  });

  const fetchGseTelemetry = async () => {
    try {
      setLoading(true);
      const res = await API.get(`flights/gse-telemetry/?airport=${selectedAirportCode}&_t=${Date.now()}`);
      if (res && res.data && Array.isArray(res.data.fleet)) {
        setGseFleet(res.data.fleet);
      } else {
        setGseFleet([]);
      }
    } catch (err) {
      console.error('Failed to fetch GSE fleet telemetry:', err);
      setGseFleet([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGseTelemetry();
  }, [selectedAirportCode]);

  const handleOpenAddModal = () => {
    setGseForm({
      id: `GSE-${selectedAirportCode.toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      vehicle: 'TLD Electric Pushback Tractor',
      type: 'Aircraft Pushback Tug',
      operator: 'Ramp Operator',
      battery: 95,
      status: 'Active / Dispatch',
      gate: 'T1-G1',
      assigned_flight: '6E 302',
    });
    setShowAddModal(true);
  };

  const handleCreateGseSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...gseForm,
        airport_code: selectedAirportCode,
      };
      const res = await API.post('flights/gse-telemetry/', payload);
      setGseFleet((prev) => [res.data, ...prev]);
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add GSE vehicle:', err);
      // Fallback local add
      const fallbackDoc = { ...gseForm, airport_code: selectedAirportCode, _id: Date.now().toString() };
      setGseFleet((prev) => [fallbackDoc, ...prev]);
      setShowAddModal(false);
    }
  };

  const handleOpenEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setGseForm({
      id: vehicle.id || '',
      vehicle: vehicle.vehicle || '',
      type: vehicle.type || 'GSE Unit',
      operator: vehicle.operator || '',
      battery: vehicle.battery ?? 90,
      status: vehicle.status || 'Active',
      gate: vehicle.gate || '',
      assigned_flight: vehicle.assigned_flight || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateGseSubmit = async (e) => {
    e.preventDefault();
    if (!editingVehicle) return;
    try {
      const targetId = editingVehicle._id || editingVehicle.id;
      const res = await API.patch(`flights/gse-telemetry/${targetId}/`, gseForm);
      const updated = res.data;

      setGseFleet((prev) =>
        prev.map((v) => ((v.id === editingVehicle.id || v._id === editingVehicle._id) ? { ...v, ...updated, ...gseForm } : v))
      );
      setShowEditModal(false);
      setEditingVehicle(null);
    } catch (err) {
      console.error('Failed to update GSE vehicle:', err);
      setGseFleet((prev) =>
        prev.map((v) => ((v.id === editingVehicle.id || v._id === editingVehicle._id) ? { ...v, ...gseForm } : v))
      );
      setShowEditModal(false);
      setEditingVehicle(null);
    }
  };

  const handleOpenDeleteModal = (vehicle) => {
    setDeletingVehicle(vehicle);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteGse = async () => {
    if (!deletingVehicle) return;
    const targetId = deletingVehicle._id || deletingVehicle.id;
    try {
      await API.delete(`flights/gse-telemetry/${targetId}/`);
      setGseFleet((prev) => prev.filter((v) => v.id !== deletingVehicle.id && v._id !== deletingVehicle._id));
      setShowDeleteModal(false);
      setDeletingVehicle(null);
    } catch (err) {
      console.error('Failed to delete GSE vehicle:', err);
      setGseFleet((prev) => prev.filter((v) => v.id !== deletingVehicle.id && v._id !== deletingVehicle._id));
      setShowDeleteModal(false);
      setDeletingVehicle(null);
    }
  };

  const filteredFleet = (gseFleet || []).filter((v) => {
    if (statusFilter !== 'ALL') {
      const vStatus = (v.status || '').toLowerCase();
      if (!vStatus.includes(statusFilter.toLowerCase())) return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const id = (v.id || '').toLowerCase();
      const name = (v.vehicle || '').toLowerCase();
      const type = (v.type || '').toLowerCase();
      const op = (v.operator || '').toLowerCase();
      const gate = (v.gate || '').toLowerCase();
      const flight = (v.assigned_flight || '').toLowerCase();
      const status = (v.status || '').toLowerCase();

      return (
        id.includes(q) ||
        name.includes(q) ||
        type.includes(q) ||
        op.includes(q) ||
        gate.includes(q) ||
        flight.includes(q) ||
        status.includes(q)
      );
    }

    return true;
  });

  return (
    <div className="gse-widget-wrapper font-mono">
      <div className="gse-header font-mono">
        <div className="gse-title">
          <Truck size={18} className="text-cyan" />
          <h4>🚜 Live Ground Support Equipment (GSE) Vehicle & Dispatch Telemetry</h4>
        </div>

        <div className="gse-header-actions">
          <button type="button" className="gse-add-btn" onClick={handleOpenAddModal}>
            <Plus size={13} />
            <span>Dispatch Vehicle</span>
          </button>

          <button type="button" className="gse-refresh-btn" onClick={fetchGseTelemetry} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Toolbar Bar: Search & Status Filters */}
      <div className="gse-toolbar font-mono">
        <div className="gse-search-box">
          <Search size={13} className="gse-search-icon" />
          <input
            type="text"
            className="gse-search-input"
            placeholder="Search vehicle ID, model, operator, type, gate, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="gse-clear-btn" onClick={() => setSearchQuery('')}>
              <X size={12} />
            </button>
          )}
        </div>

        <div className="gse-filter-chips">
          <ListFilter size={13} className="text-muted" />
          {['ALL', 'Refueling', 'Baggage', 'Catering', 'Pushback', 'Sanitation', 'Ready'].map((fKey) => (
            <button
              key={fKey}
              type="button"
              className={`gse-filter-tab ${statusFilter === fKey ? 'active' : ''}`}
              onClick={() => setStatusFilter(fKey)}
            >
              {fKey}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Telemetry Cards Grid */}
      <div className="gse-grid">
        {filteredFleet.length === 0 ? (
          <div className="gse-empty-msg font-mono">
            <span>No Ground Support Equipment (GSE) vehicles match the filter criteria.</span>
          </div>
        ) : (
          filteredFleet.map((vehicle) => {
            const batteryLevel = vehicle.battery ?? 100;
            return (
              <div key={vehicle._id || vehicle.id || Math.random()} className="gse-card">
                <div className="gse-card-top">
                  <div className="gse-id-badge font-mono">{vehicle.id || 'GSE'}</div>
                  <div className="gse-top-right-actions">
                    <span className="gse-status-tag font-mono">{vehicle.status || 'ONLINE'}</span>
                    <button
                      type="button"
                      className="gse-card-action-btn"
                      onClick={() => handleOpenEditModal(vehicle)}
                      title="Edit Telemetry & Operator"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      type="button"
                      className="gse-card-action-btn danger"
                      onClick={() => handleOpenDeleteModal(vehicle)}
                      title="Decommission Vehicle"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="gse-vehicle-name">{vehicle.vehicle || 'Equipment'}</div>
                <div className="gse-type font-mono">{vehicle.type || 'GSE Unit'}</div>

                <div className="gse-details">
                  <div className="gse-detail-item">
                    <UserCheck size={13} />
                    <span>Operator: <strong>{vehicle.operator || 'Operator'}</strong></span>
                  </div>

                  <div className="gse-detail-item">
                    <ShieldCheck size={13} />
                    <span>Assigned: <strong>{vehicle.assigned_flight || 'Stand'}</strong> ({vehicle.gate || 'Gate'})</span>
                  </div>
                </div>

                <div className="gse-battery-row">
                  <div className="battery-label">
                    <BatteryCharging size={14} className="text-emerald" />
                    <span>Battery Level: {batteryLevel}%</span>
                  </div>
                  <div className="battery-bar-container">
                    <div
                      className="battery-bar-fill"
                      style={{
                        width: `${batteryLevel}%`,
                        backgroundColor: batteryLevel > 50 ? 'var(--status-available)' : 'var(--status-reserved)',
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Add GSE Vehicle Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card shadcn-card font-mono">
            <div className="modal-header">
              <h3>🚜 Dispatch / Add New GSE Vehicle</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateGseSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>GSE Vehicle ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GSE-AMD-09"
                    value={gseForm.id}
                    onChange={(e) => setGseForm({ ...gseForm, id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Vehicle Name / Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Volvo FL Fuel Truck"
                    value={gseForm.vehicle}
                    onChange={(e) => setGseForm({ ...gseForm, vehicle: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Equipment Type</label>
                  <select
                    value={gseForm.type}
                    onChange={(e) => setGseForm({ ...gseForm, type: e.target.value })}
                  >
                    <option value="Fuel Hydrant Dispenser">Fuel Hydrant Dispenser</option>
                    <option value="Baggage Tug & Conveyor">Baggage Tug & Conveyor</option>
                    <option value="Catering Hi-Lift">Catering Hi-Lift</option>
                    <option value="Aircraft Pushback Tug">Aircraft Pushback Tug</option>
                    <option value="Passenger Jetbridge">Passenger Jetbridge</option>
                    <option value="Cabin Cleaning Van">Cabin Cleaning Van</option>
                    <option value="Air Conditioning Unit (ACU)">Air Conditioning Unit (ACU)</option>
                    <option value="Air Start Unit (ASU)">Air Start Unit (ASU)</option>
                    <option value="Potable Water Service Truck">Potable Water Service Truck</option>
                    <option value="Lavatory Service Truck">Lavatory Service Truck</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Operator Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={gseForm.operator}
                    onChange={(e) => setGseForm({ ...gseForm, operator: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Battery Level (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={gseForm.battery}
                    onChange={(e) => setGseForm({ ...gseForm, battery: parseInt(e.target.value) || 100 })}
                  />
                </div>

                <div className="form-group">
                  <label>Operational Status</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Active / Refueling"
                    value={gseForm.status}
                    onChange={(e) => setGseForm({ ...gseForm, status: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Gate Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. T1-G1"
                    value={gseForm.gate}
                    onChange={(e) => setGseForm({ ...gseForm, gate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Assigned Flight</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6E 214"
                    value={gseForm.assigned_flight}
                    onChange={(e) => setGseForm({ ...gseForm, assigned_flight: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="shadcn-btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="shadcn-btn-primary">
                  Dispatch Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit GSE Vehicle Modal */}
      {showEditModal && editingVehicle && (
        <div className="modal-backdrop">
          <div className="modal-card shadcn-card font-mono">
            <div className="modal-header">
              <h3>✏️ Edit Telemetry: {editingVehicle.id}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowEditModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleUpdateGseSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Vehicle Name</label>
                  <input
                    type="text"
                    required
                    value={gseForm.vehicle}
                    onChange={(e) => setGseForm({ ...gseForm, vehicle: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Equipment Type</label>
                  <input
                    type="text"
                    required
                    value={gseForm.type}
                    onChange={(e) => setGseForm({ ...gseForm, type: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Operator Name</label>
                  <input
                    type="text"
                    required
                    value={gseForm.operator}
                    onChange={(e) => setGseForm({ ...gseForm, operator: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Battery Level (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={gseForm.battery}
                    onChange={(e) => setGseForm({ ...gseForm, battery: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label>Status Tag</label>
                  <input
                    type="text"
                    required
                    value={gseForm.status}
                    onChange={(e) => setGseForm({ ...gseForm, status: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Gate Stand</label>
                  <input
                    type="text"
                    required
                    value={gseForm.gate}
                    onChange={(e) => setGseForm({ ...gseForm, gate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Assigned Flight</label>
                  <input
                    type="text"
                    required
                    value={gseForm.assigned_flight}
                    onChange={(e) => setGseForm({ ...gseForm, assigned_flight: e.target.value })}
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

      {/* Modal 3: Delete GSE Confirmation Modal */}
      {showDeleteModal && deletingVehicle && (
        <div className="modal-backdrop">
          <div className="modal-card shadcn-card font-mono danger-modal">
            <div className="modal-header">
              <h3 className="text-red">⚠️ Confirm Vehicle Decommission</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowDeleteModal(false)}><X size={16} /></button>
            </div>

            <div className="modal-body font-mono">
              <p>Are you sure you want to decommission and delete Ground Support Equipment vehicle <strong>{deletingVehicle.id}</strong> ({deletingVehicle.vehicle})?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>This vehicle will be removed from airport active dispatch.</p>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button type="button" className="shadcn-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button type="button" className="shadcn-btn-primary btn-danger" onClick={handleConfirmDeleteGse}>
                Yes, Decommission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

