import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import './SimulationPage.css';

export default function SimulationPage() {
  const canvasRef = useRef(null);
  const [flights, setFlights] = useState([]);
  const [gates, setGates] = useState([]);
  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [activeSimulations, setActiveSimulations] = useState([]);
  const [inspectorSim, setInspectorSim] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [statusMessage, setStatusMessage] = useState('Simulation ready. Click "Land Flight" to trigger an landing sequence.');

  const navigate = useNavigate();

  // Coordinates for airport canvas layout (800 x 550)
  const GATES_POS = {
    A1: { x: 150, y: 380, label: 'Gate A1' },
    A2: { x: 270, y: 380, label: 'Gate A2' },
    A3: { x: 390, y: 380, label: 'Gate A3' },
    B1: { x: 510, y: 380, label: 'Gate B1' },
    B2: { x: 630, y: 380, label: 'Gate B2' },
    B3: { x: 730, y: 380, label: 'Gate B3' },
  };

  const RUNWAY_START = { x: 50, y: 80 };
  const RUNWAY_END = { x: 750, y: 80 };
  const TAXIWAY_MAIN_Y = 220;

  // Load flights & gates from MongoDB
  const fetchData = async () => {
    try {
      const [flRes, gtRes] = await Promise.all([
        API.get('flights/'),
        API.get('gates/'),
      ]);
      setFlights(flRes.data);
      setGates(gtRes.data);
      if (flRes.data.length > 0) {
        setSelectedFlightId(flRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Trigger a landing simulation for a selected flight
  const handleSpawnFlight = () => {
    const flightObj = flights.find((f) => f._id === selectedFlightId);
    if (!flightObj) return;

    // Find assigned gate label or pick A1 default
    const gateObj = gates.find((g) => g._id === flightObj.gate_id);
    const gateLabel = gateObj ? gateObj.label : 'A1';

    // Prevent spawning duplicate active simulation for same flight
    if (activeSimulations.some((s) => s.flightId === flightObj._id)) {
      setStatusMessage(`Flight ${flightObj._id.slice(-6)} is already in active simulation!`);
      return;
    }

    const newSim = {
      id: `${flightObj._id}_${Date.now()}`,
      flightId: flightObj._id,
      tailNumber: flightObj.aircraft_id ? flightObj.aircraft_id.slice(-6) : 'N101AA',
      gateLabel: gateLabel,
      state: 'LANDING', // LANDING -> TAXI_IN -> GATE_SERVICE -> PUSHBACK -> TAXI_OUT -> TAKEOFF -> DONE
      progress: 0, // 0 to 1 for movement segments
      x: RUNWAY_START.x,
      y: RUNWAY_START.y,
      rotation: 0,
      scale: 1,
      // Task turnaround timers (0 to 100%)
      tasksProgress: {
        baggage: 0,
        cleaning: 0,
        refueling: 0,
        catering: 0,
      },
    };

    setActiveSimulations((prev) => [...prev, newSim]);
    setStatusMessage(`Flight ${flightObj._id.slice(-6)} cleared for landing on Runway 09R heading to Gate ${gateLabel}.`);
  };

  const handleResetSimulations = () => {
    setActiveSimulations([]);
    setInspectorSim(null);
    setStatusMessage('Simulation reset.');
  };

  // Animation Loop (60 FPS)
  useEffect(() => {
    let animationFrameId;

    const updateAndDraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- 1. DRAW AIRPORT INFRASTRUCTURE ---
      
      // Grass Background
      ctx.fillStyle = '#0b1326';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Runway (Top)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(30, 60, 740, 40);
      
      // Runway Centerline Markings
      ctx.strokeStyle = '#f59e0b';
      ctx.setLineDash([15, 15]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 80);
      ctx.lineTo(760, 80);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Runway Text
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('RUNWAY 09R', 45, 55);

      // Main Taxiway
      ctx.fillStyle = '#334155';
      ctx.fillRect(100, TAXIWAY_MAIN_Y - 12, 640, 24);

      // Vertical Taxi Connectors from Runway to Main Taxiway
      ctx.fillRect(140, 100, 20, TAXIWAY_MAIN_Y - 100);
      ctx.fillRect(400, 100, 20, TAXIWAY_MAIN_Y - 100);
      ctx.fillRect(660, 100, 20, TAXIWAY_MAIN_Y - 100);

      // Terminal Building (Bottom)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.fillRect(100, 430, 650, 90);
      ctx.strokeRect(100, 430, 650, 90);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText('TERMINAL A & B - MAIN CONCOURSE', 260, 480);

      // Draw Gates & Jet bridges
      Object.keys(GATES_POS).forEach((key) => {
        const gate = GATES_POS[key];
        
        // Jet bridge line
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(gate.x, 430);
        ctx.lineTo(gate.x, gate.y + 20);
        ctx.stroke();

        // Gate Parking Box
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(gate.x - 25, gate.y - 30, 50, 60);
        ctx.setLineDash([]);

        // Gate Label Pill
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(gate.x - 24, gate.y + 25, 48, 18);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(gate.label, gate.x, gate.y + 38);
      });
      ctx.textAlign = 'left';

      // --- 2. UPDATE & DRAW ACTIVE SIMULATED AIRCRAFT ---
      if (isPlaying) {
        setActiveSimulations((prevSims) =>
          prevSims.map((sim) => {
            let { state, progress, x, y, rotation, scale, tasksProgress } = sim;
            const speedStep = 0.005 * simSpeed;
            const gatePos = GATES_POS[sim.gateLabel] || GATES_POS.A1;

            switch (state) {
              case 'LANDING':
                progress += speedStep * 2;
                x = RUNWAY_START.x + progress * (RUNWAY_END.x - RUNWAY_START.x);
                y = RUNWAY_START.y;
                rotation = 0;
                if (progress >= 0.7) {
                  state = 'TAXI_IN';
                  progress = 0;
                }
                break;

              case 'TAXI_IN':
                progress += speedStep * 1.5;
                if (progress < 0.3) {
                  // Turn off runway onto vertical taxiway
                  x = gatePos.x;
                  y = RUNWAY_START.y + (progress / 0.3) * (TAXIWAY_MAIN_Y - RUNWAY_START.y);
                  rotation = Math.PI / 2;
                } else if (progress < 0.7) {
                  // Taxi down main taxiway to gate X
                  x = gatePos.x;
                  y = TAXIWAY_MAIN_Y;
                  rotation = 0;
                } else {
                  // Turn down into gate parking spot
                  x = gatePos.x;
                  y = TAXIWAY_MAIN_Y + ((progress - 0.7) / 0.3) * (gatePos.y - TAXIWAY_MAIN_Y);
                  rotation = Math.PI / 2;
                }

                if (progress >= 1.0) {
                  state = 'GATE_SERVICE';
                  progress = 0;
                  x = gatePos.x;
                  y = gatePos.y;
                  rotation = Math.PI / 2;
                  setStatusMessage(`Flight ${sim.tailNumber} docked at ${sim.gateLabel}. Turnaround service vehicles dispatched.`);
                }
                break;

              case 'GATE_SERVICE':
                x = gatePos.x;
                y = gatePos.y;
                rotation = Math.PI / 2;

                // Increment task turnaround progress
                const tStep = 0.4 * simSpeed;
                const newBaggage = Math.min(100, tasksProgress.baggage + tStep);
                const newCleaning = Math.min(100, tasksProgress.cleaning + tStep * 0.9);
                const newRefuel = Math.min(100, tasksProgress.refueling + tStep * 0.8);
                const newCatering = Math.min(100, tasksProgress.catering + tStep * 0.85);

                tasksProgress = {
                  baggage: newBaggage,
                  cleaning: newCleaning,
                  refueling: newRefuel,
                  catering: newCatering,
                };

                // Check if all 4 turnaround tasks reach 100%
                if (newBaggage >= 100 && newCleaning >= 100 && newRefuel >= 100 && newCatering >= 100) {
                  state = 'PUSHBACK';
                  progress = 0;
                  setStatusMessage(`All 4 turnaround tasks completed for ${sim.tailNumber}! Pushback tug engaged.`);
                }
                break;

              case 'PUSHBACK':
                progress += speedStep;
                x = gatePos.x;
                y = gatePos.y - progress * (gatePos.y - TAXIWAY_MAIN_Y);
                rotation = -Math.PI / 2; // Facing backward

                if (progress >= 1.0) {
                  state = 'TAXI_OUT';
                  progress = 0;
                  setStatusMessage(`Flight ${sim.tailNumber} taxiing to Runway 09R for departure.`);
                }
                break;

              case 'TAXI_OUT':
                progress += speedStep * 1.5;
                if (progress < 0.5) {
                  x = gatePos.x + progress * 2 * (700 - gatePos.x);
                  y = TAXIWAY_MAIN_Y;
                  rotation = 0;
                } else {
                  x = 700;
                  y = TAXIWAY_MAIN_Y - ((progress - 0.5) / 0.5) * (TAXIWAY_MAIN_Y - RUNWAY_START.y);
                  rotation = -Math.PI / 2;
                }

                if (progress >= 1.0) {
                  state = 'TAKEOFF';
                  progress = 0;
                  x = 700;
                  y = RUNWAY_START.y;
                  rotation = -Math.PI / 2; // Turn onto runway facing left
                }
                break;

              case 'TAKEOFF':
                progress += speedStep * 3;
                x = 700 - progress * 650;
                y = RUNWAY_START.y;
                rotation = -Math.PI; // Heading left
                scale = 1 + progress * 0.8; // Airborne lift scale effect

                if (progress >= 1.0) {
                  state = 'DONE';
                  setStatusMessage(`Flight ${sim.tailNumber} successfully took off! Safe travels.`);
                }
                break;

              default:
                break;
            }

            return { ...sim, state, progress, x, y, rotation, scale, tasksProgress };
          })
        );
      }

      // Draw each simulated plane & service vehicles on canvas
      activeSimulations.forEach((sim) => {
        if (sim.state === 'DONE') return;

        // Draw Service Vehicles if parked at Gate
        if (sim.state === 'GATE_SERVICE') {
          const gx = sim.x;
          const gy = sim.y;

          // Fuel Truck ⛽ (Left)
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(gx - 36, gy - 10, 12, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px Inter';
          ctx.fillText('⛽', gx - 34, gy + 4);

          // Baggage Cart 🧳 (Right)
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(gx + 24, gy - 12, 14, 18);
          ctx.fillText('🧳', gx + 25, gy + 2);

          // Catering Van 🍱 (Top)
          ctx.fillStyle = '#10b981';
          ctx.fillRect(gx - 8, gy - 40, 16, 12);

          // Cleaning Crew 🧹 (Bottom)
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(gx - 8, gy + 28, 16, 10);
        }

        // Draw Airplane Icon / Sprite
        ctx.save();
        ctx.translate(sim.x, sim.y);
        ctx.rotate(sim.rotation);
        ctx.scale(sim.scale, sim.scale);

        // Airplane Wings & Body
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;

        // Fuselage
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 6, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Main Wings
        ctx.beginPath();
        ctx.moveTo(-2, -18);
        ctx.lineTo(4, 0);
        ctx.lineTo(-2, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tail Wings
        ctx.beginPath();
        ctx.moveTo(-14, -8);
        ctx.lineTo(-11, 0);
        ctx.lineTo(-14, 8);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Airplane Tail Label Pill
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(sim.x - 25, sim.y - 32, 50, 15);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sim.tailNumber, sim.x, sim.y - 21);
        ctx.textAlign = 'left';

        // Draw Turnaround Task Progress Ring over plane if in GATE_SERVICE
        if (sim.state === 'GATE_SERVICE') {
          const avgTask =
            (sim.tasksProgress.baggage +
              sim.tasksProgress.cleaning +
              sim.tasksProgress.refueling +
              sim.tasksProgress.catering) /
            4;

          ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
          ctx.fillRect(sim.x - 22, sim.y + 22, (avgTask / 100) * 44, 4);
          ctx.strokeStyle = '#10b981';
          ctx.strokeRect(sim.x - 22, sim.y + 22, 44, 4);
        }
      });

      animationFrameId = requestAnimationFrame(updateAndDraw);
    };

    animationFrameId = requestAnimationFrame(updateAndDraw);
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeSimulations, isPlaying, simSpeed]);

  return (
    <div className="sim-container">
      {/* Top Navbar */}
      <header className="sim-header">
        <div className="header-brand">
          <span className="brand-logo">✈️</span>
          <h2>AeroSync <span className="badge-page">2D Apron Simulation</span></h2>
        </div>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </header>

      <main className="sim-main">
        {/* Controls Bar */}
        <section className="sim-controls-card">
          <div className="control-group">
            <label htmlFor="sim-flight-select">Select Flight to Simulate:</label>
            <select
              id="sim-flight-select"
              value={selectedFlightId}
              onChange={(e) => setSelectedFlightId(e.target.value)}
            >
              {flights.map((f) => (
                <option key={f._id} value={f._id}>
                  Flight {f._id.slice(-6)} ({f.status.toUpperCase()})
                </option>
              ))}
            </select>
            <button className="spawn-btn" onClick={handleSpawnFlight}>
              🛬 Land Flight Sequence
            </button>
          </div>

          <div className="control-group">
            <button className="play-btn" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <div className="speed-buttons">
              <button
                className={`speed-btn ${simSpeed === 1 ? 'active' : ''}`}
                onClick={() => setSimSpeed(1)}
              >
                1x
              </button>
              <button
                className={`speed-btn ${simSpeed === 2 ? 'active' : ''}`}
                onClick={() => setSimSpeed(2)}
              >
                2x
              </button>
              <button
                className={`speed-btn ${simSpeed === 4 ? 'active' : ''}`}
                onClick={() => setSimSpeed(4)}
              >
                4x Fast
              </button>
            </div>
            <button className="reset-btn" onClick={handleResetSimulations}>
              ↺ Reset
            </button>
          </div>
        </section>

        {/* Live Status Ticker */}
        <div className="status-ticker">
          <span className="ticker-badge">LIVE TOWER FEED</span>
          <p>{statusMessage}</p>
        </div>

        {/* Canvas & Side Inspector Grid */}
        <div className="sim-grid">
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={800}
              height={550}
              className="sim-canvas"
            />
          </div>

          {/* Active Flight Turnaround Inspector */}
          <aside className="inspector-panel">
            <h3>🛩️ Active Turnaround Inspector</h3>
            {activeSimulations.length === 0 ? (
              <div className="empty-card">
                No active landing simulations. Select a flight above and click <strong>"Land Flight Sequence"</strong>!
              </div>
            ) : (
              activeSimulations.map((sim) => (
                <div key={sim.id} className="sim-card">
                  <div className="sim-card-header">
                    <span className="sim-tail">Flight {sim.tailNumber}</span>
                    <span className="sim-state-pill">{sim.state}</span>
                  </div>

                  <div className="sim-card-body">
                    <p className="gate-info">📍 Gate Assigned: <strong>{sim.gateLabel}</strong></p>
                    
                    {sim.state === 'GATE_SERVICE' && (
                      <div className="task-bars">
                        <div className="task-bar-row">
                          <span>⛽ Refueling</span>
                          <div className="bar-track">
                            <div className="bar-fill refuel" style={{ width: `${sim.tasksProgress.refueling}%` }}></div>
                          </div>
                        </div>
                        <div className="task-bar-row">
                          <span>🧳 Baggage</span>
                          <div className="bar-track">
                            <div className="bar-fill baggage" style={{ width: `${sim.tasksProgress.baggage}%` }}></div>
                          </div>
                        </div>
                        <div className="task-bar-row">
                          <span>🍱 Catering</span>
                          <div className="bar-track">
                            <div className="bar-fill catering" style={{ width: `${sim.tasksProgress.catering}%` }}></div>
                          </div>
                        </div>
                        <div className="task-bar-row">
                          <span>🧹 Cabin Clean</span>
                          <div className="bar-track">
                            <div className="bar-fill clean" style={{ width: `${sim.tasksProgress.cleaning}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
