import React, { useState, useEffect } from 'react';
import './AirportSimulationCanvas.css';

export default function AirportSimulationCanvas({ selectedAirportCode = 'AMD' }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [selectedPlane, setSelectedPlane] = useState(null);

  // Animated aircraft motion states
  const [planes, setPlanes] = useState([
    {
      id: 'p1',
      flight: '6E 214',
      tail: 'VT-IFH',
      airline: 'IndiGo',
      type: 'A320neo',
      state: 'LANDING',
      x: 50,
      y: 380,
      heading: 90,
      speed: 3,
      gate: 'G1',
      progress: 0,
    },
    {
      id: 'p2',
      flight: 'AI 011',
      tail: 'VT-EXN',
      airline: 'Air India',
      type: 'A320-200',
      state: 'DEPARTING',
      x: 450,
      y: 170,
      heading: 180,
      speed: 2,
      gate: 'G3',
      progress: 100,
    },
    {
      id: 'p3',
      flight: 'SQ 505',
      tail: '9V-SHF',
      airline: 'Singapore Airlines',
      type: 'A350-900',
      state: 'PARKED',
      x: 350,
      y: 170,
      heading: 180,
      speed: 0,
      gate: 'G2',
      progress: 65,
    },
    {
      id: 'p4',
      flight: 'EK 539',
      tail: 'A6-EBC',
      airline: 'Emirates',
      type: 'B777-300ER',
      state: 'PARKED',
      x: 650,
      y: 170,
      heading: 180,
      speed: 0,
      gate: 'G5',
      progress: 40,
    },
  ]);

  // Main 2D Simulation Physics Loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setPlanes((prevPlanes) =>
        prevPlanes.map((p) => {
          let { x, y, heading, state, progress } = p;

          if (state === 'LANDING') {
            // Touchdown & decelerate on Runway 09R
            if (x < 500 && y === 380) {
              x += 3 * simSpeed;
              heading = 90;
            } else if (x >= 500 && y > 280) {
              // Turn onto Taxiway A2
              y -= 2 * simSpeed;
              heading = 0;
            } else if (y <= 280 && x > 250) {
              // Taxi to Gate G1 stand
              x -= 2 * simSpeed;
              heading = 270;
            } else if (x <= 250 && y > 170) {
              // Park at Gate G1
              y -= 2 * simSpeed;
              heading = 0;
            } else {
              state = 'PARKED';
              progress = 10;
            }
          } else if (state === 'DEPARTING') {
            // Pushback from Gate G3 -> Taxiway -> Runway 27L Takeoff
            if (y < 280 && x === 450) {
              y += 1.5 * simSpeed;
              heading = 180;
            } else if (y >= 280 && x < 850) {
              x += 2 * simSpeed;
              heading = 90;
            } else if (x >= 850 && y < 380) {
              y += 2 * simSpeed;
              heading = 180;
            } else if (y >= 380 && x > 50) {
              x -= 4 * simSpeed;
              heading = 270;
            } else {
              // Reset takeoff cycle back to approach
              x = 50;
              y = 380;
              state = 'LANDING';
            }
          } else if (state === 'PARKED') {
            // Increment turnaround task progress
            progress = Math.min(100, progress + 0.1 * simSpeed);
            if (progress >= 100 && p.id === 'p3') {
              state = 'DEPARTING';
            }
          }

          return { ...p, x, y, heading, state, progress };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed]);

  return (
    <div className="sim-container-wrapper">
      <div className="sim-header">
        <div>
          <h4>🛫 2D Real-World Airport Simulation — {selectedAirportCode} Airfield & Tarmac</h4>
          <span className="sim-subtext">Live animated aircraft movement on Runways, Taxiways, & Terminal Gates</span>
        </div>

        <div className="sim-controls">
          <button
            className={`sim-btn ${isPlaying ? 'pause' : 'play'}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸️ Pause Sim' : '▶️ Play Sim'}
          </button>

          <div className="speed-buttons">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                className={`speed-btn ${simSpeed === spd ? 'active' : ''}`}
                onClick={() => setSimSpeed(spd)}
              >
                {spd}× Speed
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2D Canvas SVG Airfield View */}
      <div className="sim-canvas-box">
        <svg viewBox="0 0 1000 480" className="airfield-svg">
          {/* Background Airfield Grass */}
          <rect width="1000" height="480" fill="#0b1326" />

          {/* Terminal Building */}
          <rect x="180" y="50" width="640" height="70" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="500" y="90" fill="#38bdf8" fontSize="14" fontWeight="bold" textAnchor="middle">
            {selectedAirportCode} MAIN PASSENGER TERMINAL CONCOURSE
          </text>

          {/* Jet Bridge Gate Stands G1 - G6 */}
          {[
            { label: 'G1', x: 250 },
            { label: 'G2', x: 350 },
            { label: 'G3', x: 450 },
            { label: 'G4', x: 550 },
            { label: 'G5', x: 650 },
            { label: 'G6', x: 750 },
          ].map((g) => (
            <g key={g.label}>
              {/* Jet bridge structure */}
              <line x1={g.x} y1="120" x2={g.x} y2="160" stroke="#64748b" strokeWidth="6" />
              {/* Gate parking box */}
              <rect x={g.x - 30} y="150" width="60" height="50" fill="rgba(15, 23, 42, 0.8)" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3,3" />
              <text x={g.x} y={165} fill="#fbbf24" fontSize="11" fontWeight="bold" textAnchor="middle">
                {g.label}
              </text>
            </g>
          ))}

          {/* Taxiway Alpha (Horizontal) */}
          <rect x="100" y="270" width="800" height="24" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
          <line x1="100" y1="282" x2="900" y2="282" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6,4" />
          <text x="120" y="262" fill="#fbbf24" fontSize="11" fontWeight="bold">TAXIWAY ALPHA</text>

          {/* Taxiway Connectors (Verticals to Runway & Gates) */}
          <rect x="140" y="294" width="24" height="70" fill="#1e293b" />
          <rect x="490" y="294" width="24" height="70" fill="#1e293b" />
          <rect x="840" y="294" width="24" height="70" fill="#1e293b" />

          {/* Runway 09R / 27L (Main Asphalt Strip) */}
          <rect x="50" y="360" width="900" height="45" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          {/* Runway Centerline */}
          <line x1="120" y1="382.5" x2="880" y2="382.5" stroke="#ffffff" strokeWidth="3" strokeDasharray="15,10" />
          {/* Threshold Zebra Stripes 09R */}
          {[60, 68, 76, 84, 92].map((sx) => (
            <line key={sx} x1={sx} y1="365" x2={sx} y2="400" stroke="#ffffff" strokeWidth="3" />
          ))}
          {/* Threshold Zebra Stripes 27L */}
          {[908, 916, 924, 932, 940].map((sx) => (
            <line key={sx} x1={sx} y1="365" x2={sx} y2="400" stroke="#ffffff" strokeWidth="3" />
          ))}
          <text x="105" y="390" fill="#ffffff" fontSize="13" fontWeight="bold">09R</text>
          <text x="875" y="390" fill="#ffffff" fontSize="13" fontWeight="bold">27L</text>

          {/* Animated Moving Aircraft Icons */}
          {planes.map((p) => (
            <g
              key={p.id}
              transform={`translate(${p.x}, ${p.y}) rotate(${p.heading})`}
              className="sim-plane-group"
              onClick={() => setSelectedPlane(p)}
              style={{ cursor: 'pointer' }}
            >
              {/* Aircraft Shadow */}
              <ellipse cx="2" cy="2" rx="14" ry="14" fill="rgba(0,0,0,0.4)" />
              {/* Aircraft Icon */}
              <path
                d="M 0 -14 L 3 -3 L 14 4 L 14 7 L 3 4 L 2 12 L 6 15 L 6 17 L 0 15 L -6 17 L -6 15 L -2 12 L -3 4 L -14 7 L -14 4 L -3 -3 Z"
                fill={p.state === 'LANDING' ? '#38bdf8' : p.state === 'DEPARTING' ? '#ef4444' : '#34d399'}
                stroke="#ffffff"
                strokeWidth="1"
              />
              {/* Callout Tag */}
              <text x="18" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" transform={`rotate(${-p.heading})`}>
                {p.flight} ({p.state})
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Selected Aircraft Inspection Card */}
      {selectedPlane && (
        <div className="sim-inspector-box">
          <div className="inspector-head">
            <h5>✈️ Live Telemetry Inspector — Flight {selectedPlane.flight}</h5>
            <span className={`sim-state-tag state-${selectedPlane.state}`}>{selectedPlane.state}</span>
          </div>
          <div className="inspector-body">
            <span>Tail Reg: <strong>{selectedPlane.tail}</strong></span>
            <span>Airline: <strong>{selectedPlane.airline}</strong></span>
            <span>Aircraft: <strong>{selectedPlane.type}</strong></span>
            <span>Gate Position: <strong>{selectedPlane.gate}</strong></span>
            <span>Turnaround Progress: <strong>{Math.round(selectedPlane.progress)}%</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
