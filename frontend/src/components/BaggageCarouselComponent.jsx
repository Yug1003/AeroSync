import React, { useEffect, useState } from 'react';
import API from '../api/api';
import { Package, Luggage, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import './BaggageCarouselComponent.css';

export default function BaggageCarouselComponent({ selectedAirportCode = 'AMD' }) {
  const [baggageData, setBaggageData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBaggageData = async () => {
    try {
      const res = await API.get(`flights/baggage-carousels/?airport=${selectedAirportCode}`);
      setBaggageData(res.data);
    } catch (err) {
      console.warn('Baggage telemetry fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaggageData();
    const interval = setInterval(fetchBaggageData, 4000);
    return () => clearInterval(interval);
  }, [selectedAirportCode]);

  if (loading || !baggageData || !Array.isArray(baggageData.belts)) {
    return null;
  }

  return (
    <section className="shadcn-card baggage-telemetry-section font-mono">
      <div className="section-title-bar">
        <div>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={16} className="text-cyan" />
            <span>🛄 PASSENGER BAGGAGE CLAIM CAROUSEL & BELT ALLOCATION MATRIX</span>
          </h3>
          <p className="section-subtitle">Real-time arrival carousel belt assignments, unloading progress, and baggage handler crew allocation.</p>
        </div>

        <div className="baggage-kpi-pill">
          <span>Active Carousels: <strong>{baggageData.active_carousels || 0}</strong></span>
          <span className="pill-divider">|</span>
          <span>Bags Delivered: <strong>{baggageData.total_bags_delivered || 0} / {baggageData.total_bags_processing || 0}</strong></span>
        </div>
      </div>

      <div className="baggage-grid">
        {(baggageData.belts || []).map((belt) => {
          const statusText = belt.status || 'ACTIVE';
          const statusClass = statusText.toString().toLowerCase().replace(/ /g, '-');
          const progress = belt.unload_progress_pct || 0;

          return (
            <div key={belt.belt_id || Math.random()} className="baggage-card">
              <div className="baggage-card-top">
                <span className="belt-title">{belt.belt_label || 'Belt'}</span>
                <span className={`status-badge status-${statusClass}`}>
                  {statusText}
                </span>
              </div>

              <div className="baggage-card-mid">
                <div className="flight-meta-row">
                  <span className="flight-tag">✈️ {belt.flight_callsign || 'N/A'}</span>
                  <span className="origin-text">{belt.origin || 'Arrival'}</span>
                </div>

                <div className="progress-bar-wrapper">
                  <div className="progress-header">
                    <span>Unloading Progress</span>
                    <strong>{belt.unloaded_bags || 0} / {belt.total_bags || 0} Bags ({progress}%)</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="baggage-card-bottom">
                <span className="team-text">👷 {belt.handling_team || 'Crew Team'}</span>
                <span className="time-text"><Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />{belt.claim_time_mins || 'Now'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
