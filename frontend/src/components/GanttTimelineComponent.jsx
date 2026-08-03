import React, { useState } from 'react';
import './GanttTimelineComponent.css';

export default function GanttTimelineComponent({
  gates = [],
  flights = [],
  tasksMap = {},
  aircraftMap = {},
  onReassignGate,
  onSelectFlight,
}) {
  const [draggedFlight, setDraggedFlight] = useState(null);
  const [activeDropGateId, setActiveDropGateId] = useState(null);
  const [hideDeparted, setHideDeparted] = useState(false);

  const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

  const getFlightLabel = (flight) => {
    if (flight.callsign && flight.callsign !== 'UNK') return flight.callsign;
    if (flight.tailNumber) return flight.tailNumber;
    if (aircraftMap && aircraftMap[flight.aircraft_id]) {
      const info = aircraftMap[flight.aircraft_id];
      const parts = info.split('—');
      if (parts.length > 1) {
        const callsignPart = parts[1].split('(')[0].trim();
        if (callsignPart) return callsignPart;
      }
      return parts[0].trim();
    }
    return `FL-${flight._id.slice(-4).toUpperCase()}`;
  };

  const formatFlightTime = (isoStr) => {
    if (!isoStr) return '--:--';
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateFlightStyle = (flight) => {
    if (!flight.arrival_time || !flight.departure_time) return { left: '10%', width: '20%' };
    const arr = new Date(flight.arrival_time);
    const dep = new Date(flight.departure_time);

    const startMinutes = arr.getHours() * 60 + arr.getMinutes();
    const endMinutes = dep.getHours() * 60 + dep.getMinutes();
    const duration = Math.max(60, endMinutes - startMinutes);

    const leftPercent = (startMinutes / 1440) * 100;
    const widthPercent = (duration / 1440) * 100;

    return {
      left: `${Math.min(85, Math.max(2, leftPercent))}%`,
      width: `${Math.min(35, Math.max(15, widthPercent))}%`,
    };
  };

  const handleDragStart = (e, flight) => {
    setDraggedFlight(flight);
    e.dataTransfer.setData('text/plain', flight._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedFlight(null);
    setActiveDropGateId(null);
  };

  const handleDragOver = (e, gateId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropGateId !== gateId) {
      setActiveDropGateId(gateId);
    }
  };

  const handleDragLeave = (e, gateId) => {
    e.preventDefault();
    if (activeDropGateId === gateId) {
      setActiveDropGateId(null);
    }
  };

  const handleDrop = (e, targetGate) => {
    e.preventDefault();
    setActiveDropGateId(null);
    if (!draggedFlight) return;

    if (draggedFlight.gate_id !== targetGate._id) {
      if (onReassignGate) {
        onReassignGate(draggedFlight._id, targetGate._id, targetGate.label);
      }
    }
    setDraggedFlight(null);
  };

  return (
    <div className="gantt-wrapper">
      <div className="gantt-header">
        <div>
          <h4>📅 Interactive Gate Occupancy Timeline & Gantt Schedule</h4>
          <p className="gantt-subtitle">Click block to jump to schedule row. Drag & drop to reassign gate stands in real time.</p>
        </div>

        <div className="gantt-header-actions">
          <button
            type="button"
            className={`gantt-toggle-btn ${hideDeparted ? 'active' : ''}`}
            onClick={() => setHideDeparted(!hideDeparted)}
            title="Toggle visibility of departed flights on the timeline track"
          >
            <span className="toggle-indicator"></span>
            <span className="font-mono">{hideDeparted ? 'Hide Departed: ON' : 'Hide Departed: OFF'}</span>
          </button>
          <span className="gantt-badge">CLICK TO JUMP / DRAG ACTIVE</span>
        </div>
      </div>

      <div className="gantt-grid-container">
        {/* Time Scale Header */}
        <div className="gantt-time-scale">
          <div className="gate-column-head">Gate</div>
          <div className="timeline-scale-head">
            {hours.map((h) => (
              <span key={h} className="time-mark font-mono">
                {h.toString().padStart(2, '0')}:00
              </span>
            ))}
          </div>
        </div>

        {/* Rows per Gate */}
        <div className="gantt-rows">
          {gates.map((gate) => {
            const gateFlights = flights
              .filter((f) => f.gate_id === gate._id)
              .filter((f) => (hideDeparted ? f.status !== 'departed' : true));
            const isDropTarget = activeDropGateId === gate._id;

            // Check if draggedFlight collides with any flight on this gate
            const collidingFlight = draggedFlight
              ? gateFlights.find((f) => {
                  if (f._id === draggedFlight._id) return false;
                  const dArr = new Date(draggedFlight.arrival_time).getTime();
                  const dDep = new Date(draggedFlight.departure_time).getTime();
                  const fArr = new Date(f.arrival_time).getTime();
                  const fDep = new Date(f.departure_time).getTime();
                  return dArr < fDep && dDep > fArr;
                })
              : null;

            return (
              <div key={gate._id} className="gantt-row">
                <div className="gate-label-cell">
                  <span className="gantt-gate-name font-mono">Gate {gate.label}</span>
                  <span className={`status-dot dot-${gate.status}`}></span>
                </div>

                <div
                  className={`timeline-track-cell ${isDropTarget ? (collidingFlight ? 'drop-target-swap' : 'drop-target-active') : ''}`}
                  onDragOver={(e) => handleDragOver(e, gate._id)}
                  onDragLeave={(e) => handleDragLeave(e, gate._id)}
                  onDrop={(e) => handleDrop(e, gate)}
                >
                  {isDropTarget && (
                    <div className={`drop-hint-overlay ${collidingFlight ? 'swap-hint' : ''}`}>
                      {collidingFlight
                        ? `🔄 Swap Stand: Flight ${getFlightLabel(draggedFlight)} ⇄ Flight ${getFlightLabel(collidingFlight)} (Gate ${gate.label})`
                        : `Drop to assign to Gate ${gate.label}`}
                    </div>
                  )}

                  {gateFlights.length === 0 ? (
                    <div className="track-empty-hint font-mono">Stand Clear / Drag Flight Here</div>
                  ) : (
                    gateFlights.map((flight) => {
                      const tasks = tasksMap[flight._id] || [];
                      const completedTasks = tasks.filter((t) => t.status === 'completed').length;
                      const progressPercent = (completedTasks / 4) * 100;
                      const isDragging = draggedFlight?._id === flight._id;
                      const flightLabel = getFlightLabel(flight);
                      const arrStr = formatFlightTime(flight.arrival_time);
                      const depStr = formatFlightTime(flight.departure_time);

                      return (
                        <div
                          key={flight._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, flight)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectFlight) onSelectFlight(flight._id);
                          }}
                          className={`gantt-block status-${flight.status} ${isDragging ? 'is-dragging' : ''}`}
                          style={calculateFlightStyle(flight)}
                          title={`Flight ${flightLabel} (${flight.route || 'Local'})\nSchedule: ${arrStr} → ${depStr}\nStatus: ${flight.status.toUpperCase()} (${completedTasks}/4 Tasks)`}
                        >
                          <div className="block-header-row">
                            <span className="block-title font-mono">{flightLabel}</span>
                            <span className={`block-status-tag tag-${flight.status} font-mono`}>
                              {flight.status === 'in_progress' ? 'IN PROGRESS' : flight.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="block-sub-row font-mono">
                            <span className="block-time">{arrStr} → {depStr}</span>
                            <span className="block-progress">{completedTasks}/4</span>
                          </div>

                          <div
                            className="gantt-progress-bar"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
