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

  if (!Array.isArray(gseFleet) || gseFleet.length === 0) {
    return null;
  }

  return (
    <div className="gse-widget-wrapper font-mono">
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
        {(gseFleet || []).map((vehicle) => {
          const batteryLevel = vehicle.battery || 100;
          return (
            <div key={vehicle.id || Math.random()} className="gse-card">
              <div className="gse-card-top">
                <div className="gse-id-badge font-mono">{vehicle.id || 'GSE'}</div>
                <span className="gse-status-tag font-mono">{vehicle.status || 'ONLINE'}</span>
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
                  <span>Assigned Flight: <strong>{vehicle.assigned_flight || 'Stand'}</strong> ({vehicle.gate || 'Gate'})</span>
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
        })}
      </div>
    </div>
  );
}
