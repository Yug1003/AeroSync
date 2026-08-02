import React, { useState, useEffect } from 'react';
import './AirportTerminalLayoutComponent.css';

// Dynamic Airport Layout & Stand Generator for ALL 15 Indian International Airports
const ALL_AIRPORTS_DATA = {
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
  MAA: {
    code: 'MAA',
    name: 'Chennai International Airport (Chennai)',
    runway: 'Runway 07/25 & 12/30',
    terminals: [
      { id: 'T1', name: 'Kamaraj Domestic Terminal', gates: ['M-11', 'M-12', 'M-14'] },
      { id: 'T2', name: 'Anna International Terminal', gates: ['M-21', 'M-22'] },
    ],
    samplePlanes: [
      { gate: 'M-11', flight: '6E 6105', tail: 'VT-ILB', airline: 'IndiGo', status: 'Boarding', progress: 90, type: 'A320neo' },
      { gate: 'M-12', flight: 'AI 430', tail: 'VT-EXG', airline: 'Air India', status: 'Baggage Loading', progress: 40, type: 'A320neo' },
      { gate: 'M-21', flight: 'SQ 529', tail: '9V-MGC', airline: 'Singapore Airlines', status: 'Catering', progress: 70, type: 'B737 MAX 8' },
      { gate: 'M-22', flight: 'MH 181', tail: '9M-MTB', airline: 'Malaysia Airlines', status: 'Refueling', progress: 55, type: 'A330-300' },
    ],
  },
  HYD: {
    code: 'HYD',
    name: 'Rajiv Gandhi International Airport (Hyderabad)',
    runway: 'Runway 09L/27R',
    terminals: [
      { id: 'T1', name: 'Main Concourse (Domestic)', gates: ['H-01', 'H-03', 'H-05'] },
      { id: 'T2', name: 'International Finger Concourse', gates: ['H-21', 'H-23'] },
    ],
    samplePlanes: [
      { gate: 'H-01', flight: '6E 834', tail: 'VT-ISW', airline: 'IndiGo', status: 'Pushback Ready', progress: 100, type: 'A321neo' },
      { gate: 'H-03', flight: 'QP 1402', tail: 'VT-YAE', airline: 'Akasa Air', status: 'Boarding', progress: 65, type: 'B737 MAX 8' },
      { gate: 'H-21', flight: 'EK 527', tail: 'A6-EGO', airline: 'Emirates', status: 'At Gate', progress: 30, type: 'B777-300ER' },
      { gate: 'H-23', flight: 'QR 501', tail: 'A7-BAC', airline: 'Qatar Airways', status: 'Refueling', progress: 50, type: 'B777-300ER' },
    ],
  },
  CCU: {
    code: 'CCU',
    name: 'Netaji Subhash Chandra Bose International Airport (Kolkata)',
    runway: 'Runway 01L/19R',
    terminals: [
      { id: 'T2', name: 'Integrated Terminal Concourse', gates: ['K-04', 'K-06', 'K-08', 'K-12'] },
    ],
    samplePlanes: [
      { gate: 'K-04', flight: '6E 521', tail: 'VT-IPB', airline: 'IndiGo', status: 'Cleaning', progress: 45, type: 'A320neo' },
      { gate: 'K-06', flight: 'AI 763', tail: 'VT-EXF', airline: 'Air India', status: 'Boarding', progress: 80, type: 'A320neo' },
      { gate: 'K-08', flight: 'SG 612', tail: 'VT-SGC', airline: 'SpiceJet', status: 'Baggage Loading', progress: 60, type: 'B737-800' },
      { gate: 'K-12', flight: 'TG 314', tail: 'HS-THB', airline: 'Thai Airways', status: 'Catering Upload', progress: 75, type: 'A350-900' },
    ],
  },
  COK: {
    code: 'COK',
    name: 'Cochin International Airport (Kochi)',
    runway: 'Runway 09/27',
    terminals: [
      { id: 'T1', name: 'Terminal 1 (Domestic)', gates: ['C-02', 'C-04'] },
      { id: 'T3', name: 'Terminal 3 (International)', gates: ['C-14', 'C-16'] },
    ],
    samplePlanes: [
      { gate: 'C-02', flight: '6E 405', tail: 'VT-INF', airline: 'IndiGo', status: 'Boarding', progress: 85, type: 'A320neo' },
      { gate: 'C-04', flight: 'IX 412', tail: 'VT-AXN', airline: 'Air India Express', status: 'Pushback Ready', progress: 100, type: 'B737-800' },
      { gate: 'C-14', flight: 'EK 531', tail: 'A6-ENJ', airline: 'Emirates', status: 'Refueling', progress: 50, type: 'B777-300ER' },
      { gate: 'C-16', flight: 'WY 224', tail: 'A4O-DA', airline: 'Oman Air', status: 'At Gate', progress: 20, type: 'B787-9' },
    ],
  },
  GOI: {
    code: 'GOI',
    name: 'Manohar International Airport / Dabolim (Goa)',
    runway: 'Runway 08/26',
    terminals: [
      { id: 'T1', name: 'Goa Civil Air Terminal', gates: ['G-01', 'G-02', 'G-03'] },
    ],
    samplePlanes: [
      { gate: 'G-01', flight: '6E 602', tail: 'VT-IEH', airline: 'IndiGo', status: 'Boarding', progress: 70, type: 'A320neo' },
      { gate: 'G-02', flight: 'QP 1204', tail: 'VT-YAF', airline: 'Akasa Air', status: 'Baggage Loading', progress: 40, type: 'B737 MAX 8' },
      { gate: 'G-03', flight: 'AI 842', tail: 'VT-EXD', airline: 'Air India', status: 'Refueling', progress: 60, type: 'A320neo' },
    ],
  },
};

export default function AirportTerminalLayoutComponent({ selectedAirportCode = 'AMD' }) {
  const code = selectedAirportCode.toUpperCase();
  const currentLayout = ALL_AIRPORTS_DATA[code] || {
    code: code,
    name: `${code} International Airport`,
    runway: 'Main Runway 09/27',
    terminals: [
      { id: 'T1', name: `${code} Passenger Terminal`, gates: [`${code}-G1`, `${code}-G2`, `${code}-G3`] },
    ],
    samplePlanes: [
      { gate: `${code}-G1`, flight: `6E ${Math.floor(Math.random() * 800 + 100)}`, tail: `VT-I${code}`, airline: 'IndiGo', status: 'Boarding', progress: 75, type: 'A320neo' },
      { gate: `${code}-G2`, flight: `AI ${Math.floor(Math.random() * 800 + 100)}`, tail: `VT-E${code}`, airline: 'Air India', status: 'Pushback Ready', progress: 100, type: 'A320neo' },
      { gate: `${code}-G3`, flight: `QP ${Math.floor(Math.random() * 800 + 100)}`, tail: `VT-Y${code}`, airline: 'Akasa Air', status: 'Refueling', progress: 50, type: 'B737 MAX 8' },
    ],
  };

  const [selectedPlane, setSelectedPlane] = useState(currentLayout.samplePlanes[0]);

  useEffect(() => {
    setSelectedPlane(currentLayout.samplePlanes[0]);
  }, [selectedAirportCode]);

  return (
    <div className="terminal-layout-wrapper">
      <div className="layout-header">
        <div className="layout-header-title">
          <h4>🏢 2D Real-World Airport Ground & Terminal Gate Stand Layout</h4>
          <span className="layout-subtitle">{currentLayout.name} — {currentLayout.runway}</span>
        </div>
        <div className="layout-live-badge">
          🔴 LIVE AeroSync TELEMETRY ({currentLayout.samplePlanes.length} PLANES ON STAND)
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
