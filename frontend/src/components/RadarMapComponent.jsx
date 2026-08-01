import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './RadarMapComponent.css';

// Custom Airplane Icon generator for Leaflet
const createPlaneIcon = (heading = 45, isDelayed = false) => {
  const color = isDelayed ? '#ef4444' : '#38bdf8';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" style="transform: rotate(${heading}deg);">
      <path fill="${color}" stroke="#ffffff" stroke-width="1" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'leaflet-plane-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const AMD_COORDS = [23.0772, 72.6347];

export default function RadarMapComponent({ flights = [] }) {
  const [radarFlights, setRadarFlights] = useState([]);

  useEffect(() => {
    // Generate initial approach vectors for active flights around Ahmedabad
    const initial = flights.map((f, idx) => {
      const angle = (idx * 50) * (Math.PI / 180);
      const radius = 0.07 + (idx % 4) * 0.03;
      const lat = AMD_COORDS[0] + Math.sin(angle) * radius;
      const lng = AMD_COORDS[1] + Math.cos(angle) * radius;
      const heading = (Math.atan2(AMD_COORDS[1] - lng, AMD_COORDS[0] - lat) * 180) / Math.PI;

      return {
        id: f._id,
        flightCode: f.aircraft_id ? `6E-${f._id.slice(-4)}` : `AI-${f._id.slice(-4)}`,
        tailNumber: f.aircraft_id ? f.aircraft_id.slice(-6) : 'VT-AMD',
        status: f.status,
        lat: lat,
        lng: lng,
        angle: angle,
        radius: radius,
        heading: Math.round(heading),
        altitude: f.status === 'departed' ? 16000 : 3200 + (idx % 4) * 900,
        speed: f.status === 'departed' ? 440 : 190 + (idx % 3) * 25,
      };
    });

    setRadarFlights(initial);
  }, [flights]);

  // Live Position Motion Loop (Updates plane positions & headings every 200ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarFlights((prevFlights) =>
        prevFlights.map((rf) => {
          // Increment angle (orbiting approach path into AMD)
          const isDeparting = rf.status === 'departed';
          const angleStep = isDeparting ? -0.008 : 0.006;
          const newAngle = rf.angle + angleStep;
          
          // Compute new latitude & longitude coordinates
          const newLat = AMD_COORDS[0] + Math.sin(newAngle) * rf.radius;
          const newLng = AMD_COORDS[1] + Math.cos(newAngle) * rf.radius;

          // Compute new heading angle pointing along motion vector
          const dLat = newLat - rf.lat;
          const dLng = newLng - rf.lng;
          const newHeading = (Math.atan2(dLng, dLat) * 180) / Math.PI;

          return {
            ...rf,
            lat: newLat,
            lng: newLng,
            angle: newAngle,
            heading: Math.round(newHeading),
          };
        })
      );
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="radar-map-wrapper">
      <div className="radar-map-header">
        <h4>🗺️ Live Regional Radar — Ahmedabad Airspace (AMD / VAAH)</h4>
        <span className="radar-live-badge">📡 LIVE MOTION RADAR (23.07° N, 72.63° E)</span>
      </div>

      <div className="leaflet-container-box">
        <MapContainer
          center={AMD_COORDS}
          zoom={11}
          scrollWheelZoom={false}
          className="radar-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Airport Location Circle */}
          <Circle
            center={AMD_COORDS}
            radius={8000}
            pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.08, weight: 1, dashArray: '5, 5' }}
          />

          {/* Render Moving Aircraft Markers */}
          {radarFlights.map((rf) => (
            <Marker
              key={rf.id}
              position={[rf.lat, rf.lng]}
              icon={createPlaneIcon(rf.heading, rf.status === 'delayed')}
            >
              <Popup className="radar-popup">
                <div className="popup-content">
                  <h5>✈️ Flight {rf.flightCode}</h5>
                  <p>Tail: <strong>{rf.tailNumber}</strong></p>
                  <p>Status: <span className={`status-${rf.status}`}>{rf.status.toUpperCase()}</span></p>
                  <p>Altitude: <strong>{rf.altitude.toLocaleString()} ft</strong></p>
                  <p>Speed: <strong>{rf.speed} kts</strong></p>
                  <p>Heading: <strong>{rf.heading}°</strong></p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
