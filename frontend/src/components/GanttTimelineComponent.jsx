import React from 'react';
import './GanttTimelineComponent.css';

export default function GanttTimelineComponent({ gates = [], flights = [], tasksMap = {} }) {
  const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

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
      width: `${Math.min(30, Math.max(12, widthPercent))}%`,
    };
  };

  return (
    <div className="gantt-wrapper">
      <div className="gantt-header">
        <h4>📅 Interactive Gate Occupancy Timeline & Gantt Schedule</h4>
        <span className="gantt-badge">24-HOUR OPERATIONAL SCHEDULE</span>
      </div>

      <div className="gantt-grid-container">
        {/* Time Scale Header */}
        <div className="gantt-time-scale">
          <div className="gate-column-head">Gate</div>
          <div className="timeline-scale-head">
            {hours.map((h) => (
              <span key={h} className="time-mark">
                {h.toString().padStart(2, '0')}:00
              </span>
            ))}
          </div>
        </div>

        {/* Rows per Gate */}
        <div className="gantt-rows">
          {gates.map((gate) => {
            const gateFlights = flights.filter((f) => f.gate_id === gate._id);

            return (
              <div key={gate._id} className="gantt-row">
                <div className="gate-label-cell">
                  <span className="gantt-gate-name">Gate {gate.label}</span>
                  <span className={`status-dot dot-${gate.status}`}></span>
                </div>

                <div className="timeline-track-cell">
                  {gateFlights.map((flight) => {
                    const tasks = tasksMap[flight._id] || [];
                    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
                    const progressPercent = (completedTasks / 4) * 100;

                    return (
                      <div
                        key={flight._id}
                        className={`gantt-block status-${flight.status}`}
                        style={calculateFlightStyle(flight)}
                        title={`Flight ${flight._id.slice(-6)}: ${flight.status.toUpperCase()} (${completedTasks}/4 Turnaround Tasks Completed)`}
                      >
                        <div className="block-content">
                          <span className="block-title">Flight {flight._id.slice(-6)}</span>
                          <span className="block-progress">{completedTasks}/4 Tasks</span>
                        </div>
                        <div
                          className="gantt-progress-bar"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
