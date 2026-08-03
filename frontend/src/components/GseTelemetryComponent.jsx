import React, { useEffect, useState } from 'react';
import API from '../api/api';
import { Truck, BatteryCharging, UserCheck, ShieldCheck, RefreshCw } from 'lucide-react';
import './GseTelemetryComponent.css';

export default function GseTelemetryComponent({ selectedAirportCode = 'AMD' }) {
  const [gseFleet, setGseFleet] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGseTelemetry = async () => {
    try {
      setLoading(true);
      const res = await API.get(`flights/gse-telemetry/?airport=${selectedAirportCode}`);
      setGseFleet(res.data.fleet || []);
    } catch (err) {
      console.error('Failed to fetch GSE fleet telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGseTelemetry();
  }, [selectedAirportCode]);

  return (
    <div className="gse-widget-wrapper">
      <div className="gse-header font-mono">
        <div className="gse-title">
          <Truck size={18} className="text-cyan" />
          <h4>🚜 Live Ground Support Equipment (GSE) Vehicle & Dispatch Telemetry</h4>
        </div>
        <button type="button" className="gse-refresh-btn" onClick={fetchGseTelemetry} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      <div className="gse-grid">
        {gseFleet.map((vehicle) => (
          <div key={vehicle.id} className="gse-card">
            <div className="gse-card-top">
              <div className="gse-id-badge font-mono">{vehicle.id}</div>
              <span className="gse-status-tag font-mono">{vehicle.status}</span>
            </div>

            <div className="gse-vehicle-name">{vehicle.vehicle}</div>
            <div className="gse-type font-mono">{vehicle.type}</div>

            <div className="gse-details">
              <div className="gse-detail-item">
                <UserCheck size={13} />
                <span>Operator: <strong>{vehicle.operator}</strong></span>
              </div>

              <div className="gse-detail-item">
                <ShieldCheck size={13} />
                <span>Assigned Flight: <strong>{vehicle.assigned_flight}</strong> ({vehicle.gate})</span>
              </div>
            </div>

            <div className="gse-battery-row">
              <div className="battery-label">
                <BatteryCharging size={14} className="text-emerald" />
                <span>Battery Level: {vehicle.battery}%</span>
              </div>
              <div className="battery-bar-container">
                <div
                  className="battery-bar-fill"
                  style={{
                    width: `${vehicle.battery}%`,
                    backgroundColor: vehicle.battery > 50 ? 'var(--status-available)' : 'var(--status-reserved)',
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
