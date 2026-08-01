import React, { useState } from 'react';
import './AirportTerminalLayoutComponent.css';

// Airport Terminal & Gate Configurations
const AIRPORT_LAYOUTS = {
  AMD: {
    code: 'AMD',
    name: 'Sardar Vallabhbhai Patel International Airport (Ahmedabad)',
    runway: 'Runway 05/23',
    terminals: [
      { id: 'T1', name: 'Terminal 1 (Domestic Concourse)', gates: ['T1-G1', 'T1-G2', 'T1-G3', 'T1-G4'] },
      { id: 'T2', name: 'Terminal 2 (International Concourse)', gates: ['T2-INT1', 'T2-INT2'] },
    ],
    samplePlanes: [
      { gate: 'T1-G1', flight: '6E 214', tail: 'VT-IFH', airline: 'IndiGo', status: 'Boarding Passenger Load', progress: 75, type: 'A320neo' },
      { gate: 'T1-G2', flight: 'AI 011', tail: 'VT-EXN', airline: 'Air India', status: 'Baggage Loading', progress: 50, type: 'A320-200' },
      { gate: 'T1-G3', flight: 'QP 1102', tail: 'VT-YAB', airline: 'Akasa Air', status: 'Pushback Ready', progress: 100, type: 'B737 MAX 8' },
      { gate: 'T1-G4', flight: 'SG 531', tail: 'VT-SGK', airline: 'SpiceJet', status: 'Refueling in Progress', progress: 25, type: 'B737-800' },
      { gate: 'T2-INT1', flight: 'SQ 505', tail: '9V-SHF', airline: 'Singapore Airlines', status: 'Catering Upload', progress: 75, type: 'A350-900' },
      { gate: 'T2-INT2', flight: 'EK 539', tail: 'A6-EBC', airline: 'Emirates', status: 'At Gate / Deboarding', progress: 10, type: 'B777-300ER' },
    ],
  },
  DEL: {
    code: 'DEL',
    name: 'Indira Gandhi International Airport (New Delhi)',
    runway: 'Runway 11L/29R & 09/27',
    terminals: [
      { id: 'T1', name: 'Terminal 1 (Low Cost Domestic)', gates: ['T1-01', 'T1-02', 'T1-03'] },
      { id: 'T2', name: 'Terminal 2 (Domestic Regional)', gates: ['T2-04', 'T2-05'] },
      { id: 'T3', name: 'Terminal 3 (International Hub)', gates: ['T3-A12', 'T3-A14', 'T3-B22'] },
    ],
    samplePlanes: [
      { gate: 'T1-01', flight: '6E 5021', tail: 'VT-ISN', airline: 'IndiGo', status: 'Boarding Complete', progress: 100, type: 'A321neo' },
      { gate: 'T1-02', flight: 'QP 1354', tail: 'VT-YAD', airline: 'Akasa Air', status: 'Refueling', progress: 50, type: 'B737 MAX 8' },
      { gate: 'T2-04', flight: 'AI 804', tail: 'VT-ANX', airline: 'Air India', status: 'Cleaning in Progress', progress: 25, type: 'A320neo' },
      { gate: 'T3-A12', flight: 'AI 101', tail: 'VT-ALQ', airline: 'Air India (JFK Line)', status: 'Boarding Passenger Load', progress: 75, type: 'B777-300ER' },
      { gate: 'T3-A14', flight: 'BA 142', tail: 'G-ZBJA', airline: 'British Airways', status: 'Baggage Unloading', progress: 50, type: 'B787-9' },
      { gate: 'T3-B22', flight: 'EK 517', tail: 'A6-EOU', airline: 'Emirates (A380 Line)', status: 'At Gate / Catering', progress: 60, type: 'A380-800' },
    ],
  },
  BOM: {
    code: 'BOM',
    name: 'Chhatrapati Shivaji Maharaj International Airport (Mumbai)',
    runway: 'Runway 09/27 & 14/32',
    terminals: [
      { id: 'T1', name: 'Terminal 1 (Santacruz Domestic)', gates: ['T1A-1', 'T1A-2', 'T1B-3'] },
      { id: 'T2', name: 'Terminal 2 (Sahar International)', gates: ['T2-G45', 'T2-G47', 'T2-G49'] },
    ],
    samplePlanes: [
      { gate: 'T1A-1', flight: '6E 5312', tail: 'VT-IVV', airline: 'IndiGo', status: 'Pushback Ready', progress: 100, type: 'A320neo' },
      { gate: 'T1A-2', flight: 'QP 1108', tail: 'VT-YAA', airline: 'Akasa Air', status: 'Boarding', progress: 75, type: 'B737 MAX 8' },
      { gate: 'T2-G45', flight: 'AI 130', tail: 'VT-ANP', airline: 'Air India (LHR Line)', status: 'Refueling', progress: 50, type: 'B787-8' },
      { gate: 'T2-G47', flight: 'LH 757', tail: 'D-ABYA', airline: 'Lufthansa', status: 'Baggage Loading', progress: 80, type: 'B747-8i' },
      { gate: 'T2-G49', flight: 'QR 557', tail: 'A7-BED', airline: 'Qatar Airways', status: 'At Gate', progress: 20, type: 'B777-300ER' },
    ],
  },
  BLR: {
    code: 'BLR',
    name: 'Kempegowda International Airport (Bengaluru)',
    runway: 'Runway 09L/27R & 09R/27L',
    terminals: [
      { id: 'T1', name: 'Terminal 1 (Domestic Pier)', gates: ['T1-08', 'T1-09', 'T1-10'] },
      { id: 'T2', name: 'Terminal 2 (Garden Terminal Intl)', gates: ['T2-201', 'T2-203'] },
    ],
    samplePlanes: [
      { gate: 'T1-08', flight: '6E 412', tail: 'VT-IZG', airline: 'IndiGo', status: 'Boarding', progress: 80, type: 'A320neo' },
      { gate: 'T1-09', flight: 'AI 505', tail: 'VT-EXV', airline: 'Air India', status: 'Pushback Ready', progress: 100, type: 'A320-200' },
      { gate: 'T2-201', flight: 'AF 191', tail: 'F-GSQK', airline: 'Air France', status: 'Catering Upload', progress: 60, type: 'B777-300ER' },
      { gate: 'T2-203', flight: 'SQ 517', tail: '9V-SMA', airline: 'Singapore Airlines', status: 'Boarding', progress: 85, type: 'A350-900' },
    ],
  },
};

export default function AirportTerminalLayoutComponent({ selectedAirportCode = 'AMD' }) {
  const currentLayout = AIRPORT_LAYOUTS[selectedAirportCode.toUpperCase()] || AIRPORT_LAYOUTS['AMD'];
  const [selectedPlane, setSelectedPlane] = useState(currentLayout.samplePlanes[0]);

  return (
    <div className="terminal-layout-wrapper">
      <div className="layout-header">
        <div className="layout-header-title">
          <h4>🏢 2D Real-World Airport Ground & Terminal Gate Stand Layout</h4>
          <span className="layout-subtitle">{currentLayout.name} — {currentLayout.runway}</span>
        </div>
        <div className="layout-live-badge">
          🔴 LIVE TARMAC TELEMETRY ({currentLayout.samplePlanes.length} PLANES ON STAND)
        </div>
      </div>

      {/* Terminal Layout Diagram Container */}
      <div className="layout-diagram-box">
        {/* Terminal Concourse Building */}
        <div className="terminal-building-visual">
          <div className="building-glass-header">
            <span className="building-icon">🏢</span>
            <strong>{currentLayout.code} MAIN PASSENGER TERMINAL CONCOURSE</strong>
          </div>

          <div className="terminals-grid">
            {currentLayout.terminals.map((term) => (
              <div key={term.id} className="terminal-section">
                <span className="terminal-title-tag">{term.name}</span>
                <div className="gates-row">
                  {term.gates.map((gateLabel) => {
                    const planeAtGate = currentLayout.samplePlanes.find((p) => p.gate === gateLabel);
                    const isSelected = selectedPlane?.gate === gateLabel;

                    return (
                      <div
                        key={gateLabel}
                        className={`gate-stand-box ${planeAtGate ? 'occupied' : 'empty'} ${isSelected ? 'selected' : ''}`}
                        onClick={() => planeAtGate && setSelectedPlane(planeAtGate)}
                      >
                        <div className="stand-header">
                          <span className="stand-name">{gateLabel}</span>
                          <span className="jetbridge-icon">🌉</span>
                        </div>

                        {planeAtGate ? (
                          <div className="parked-plane-info">
                            <span className="plane-tail-badge">{planeAtGate.tail}</span>
                            <span className="plane-callsign">{planeAtGate.flight}</span>
                            <span className="plane-airline">{planeAtGate.airline}</span>
                            <div className="mini-progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${planeAtGate.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="empty-stand-label">AVAILABLE STAND</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tarmac Taxiline & Apron Strip */}
        <div className="tarmac-taxiline">
          <span className="taxiline-label">🚕 TAXIWAY ALPHA / APRON HOLDING LINE 🟡 🟡 🟡 🟡 🟡 🟡 🟡</span>
        </div>

        {/* Selected Aircraft Detail Inspector Panel */}
        {selectedPlane && (
          <div className="stand-inspector-panel">
            <div className="inspector-header">
              <h5>✈️ Aircraft Stand Inspector — Gate {selectedPlane.gate}</h5>
              <span className="inspector-badge">{selectedPlane.status}</span>
            </div>

            <div className="inspector-grid">
              <div className="inspector-item">
                <span>Flight Number</span>
                <strong>{selectedPlane.flight}</strong>
              </div>

              <div className="inspector-item">
                <span>Aircraft Registration</span>
                <strong>{selectedPlane.tail}</strong>
              </div>

              <div className="inspector-item">
                <span>Airline Operating</span>
                <strong>{selectedPlane.airline}</strong>
              </div>

              <div className="inspector-item">
                <span>Aircraft Type</span>
                <strong>{selectedPlane.type}</strong>
              </div>

              <div className="inspector-item">
                <span>Turnaround Progress</span>
                <strong>{selectedPlane.progress}% Completed</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
