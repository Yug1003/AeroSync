import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import API from '../api/api';
import 'leaflet/dist/leaflet.css';
import './RadarMapComponent.css';

// Custom Airplane Icon generator for Leaflet (Airborne vs Ground Parked)
const createPlaneIcon = (heading = 45, isGround = false) => {
  const color = isGround ? '#fbbf24' : '#0ea5e9';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${isGround ? 26 : 32}" height="${isGround ? 26 : 32}" style="transform: rotate(${heading}deg);">
      <path fill="${color}" stroke="#ffffff" stroke-width="1.2" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'leaflet-plane-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const AIRPORT_COORDS = {
  AMD: [23.0772, 72.6347],
  DEL: [28.5562, 77.1000],
  BOM: [19.0896, 72.8656],
  BLR: [13.1986, 77.7066],
  MAA: [12.9941, 80.1709],
  HYD: [17.2403, 78.4294],
  CCU: [22.6547, 88.4467],
  COK: [10.1520, 76.4019],
  GOI: [15.3808, 73.8314],
  JAI: [26.8242, 75.8122],
  LKO: [26.7606, 80.8893],
  ATQ: [31.7096, 74.7973],
  TRV: [8.4821, 76.9200],
  IXC: [30.6735, 76.7885],
  VTZ: [17.7211, 83.2245],
};

export default function RadarMapComponent({ flights = [], selectedAirportCode = 'AMD' }) {
  const [radarFlights, setRadarFlights] = useState([]);
  const [dataSource, setDataSource] = useState('Flightradar24 Live');
  const [liveCount, setLiveCount] = useState(0);

  const centerCoords = AIRPORT_COORDS[selectedAirportCode.toUpperCase()] || AIRPORT_COORDS['AMD'];

  const fetchLiveRadarData = async () => {
    try {
      const res = await API.get(`flights/live-radar/?airport=${selectedAirportCode}`);
      const rawLiveFlights = res.data.flights || [];

      // 1. Process Flightradar24 live API planes
      const fr24Mapped = rawLiveFlights.map((rf) => ({
        id: rf.id,
        callsign: rf.callsign || 'UNK',
        icao24: rf.icao24 || rf.tailNumber || 'VT-AIR',
        tailNumber: rf.tailNumber || rf.icao24,
        aircraftType: rf.aircraft_type || 'Commercial Jet',
        route: rf.route || 'Regional Corridor',
        country: rf.origin_country || 'Commercial',
        lat: rf.lat,
        lng: rf.lng,
        heading: rf.heading || 0,
        altitude: rf.altitude_ft ?? 0,
        speed: rf.speed_kts ?? 0,
        isOnGround: rf.is_on_ground || (rf.altitude_ft ?? 0) <= 100,
        source: rf.source || `Flightradar24 Live (${selectedAirportCode}) 📡`,
      }));

      // 2. Generate airport database flight vectors centered at current airport
      const dbMapped = flights.map((f, idx) => {
        const angle = (idx * 55) * (Math.PI / 180);
        const radius = 0.05 + (idx % 3) * 0.035;
        const lat = centerCoords[0] + Math.sin(angle) * radius;
        const lng = centerCoords[1] + Math.cos(angle) * radius;
        const heading = Math.round((Math.atan2(centerCoords[1] - lng, centerCoords[0] - lat) * 180) / Math.PI);

        return {
          id: `db_${f._id}`,
          callsign: f.aircraft_id ? `6E-${f._id.slice(-4)}` : `AI-${f._id.slice(-4)}`,
          icao24: f._id.slice(-6).toUpperCase(),
          tailNumber: 'VT-AIR',
          aircraftType: 'A320neo',
          route: `${selectedAirportCode} ✈️ INTL`,
          country: 'India',
          lat: lat,
          lng: lng,
          heading: heading,
          altitude: f.status === 'departed' ? 14000 : f.status === 'in_progress' ? 0 : 3500,
          speed: f.status === 'departed' ? 420 : f.status === 'in_progress' ? 0 : 180,
          isOnGround: f.status === 'in_progress',
          source: `AeroSync ${selectedAirportCode} Hub 🏢`,
        };
      });

      const combined = [...fr24Mapped, ...dbMapped];
      setRadarFlights(combined);
      setLiveCount(combined.length);
      setDataSource(`Flightradar24 Live (${selectedAirportCode})`);
    } catch (err) {
      console.error('Radar API fetch error:', err);
    }
  };

  useEffect(() => {
    fetchLiveRadarData();
    const pollInterval = setInterval(fetchLiveRadarData, 2000);
    return () => clearInterval(pollInterval);
  }, [flights, selectedAirportCode]);

  return (
    <div className="leaflet-container-box">
      <MapContainer
        key={selectedAirportCode}
        center={centerCoords}
        zoom={7}
        scrollWheelZoom={true}
        className="radar-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.flightradar24.com">Flightradar24</a> & OpenSky'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Airspace Boundary Circle */}
        <Circle
          center={centerCoords}
          radius={150000}
          pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.03, weight: 1.5, dashArray: '8, 8' }}
        />

        {/* Airport Tarmac Hub Circle */}
        <Circle
          center={centerCoords}
          radius={20000}
          pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.15, weight: 2 }}
        />

        {/* Render Aircraft Markers */}
        {radarFlights.map((rf) => (
          <Marker
            key={rf.id}
            position={[rf.lat, rf.lng]}
            icon={createPlaneIcon(rf.heading, rf.isOnGround)}
          >
            <Popup className="radar-popup">
              <div className="popup-content">
                <h5>✈️ Flight {rf.callsign}</h5>
                <p>Reg / Tail: <strong>{rf.tailNumber}</strong> ({rf.aircraftType})</p>
                <p>Route: <strong>{rf.route}</strong></p>
                <p>Status: {rf.isOnGround ? <span className="ground-tag">🟡 AT GATE / TARMAC</span> : <span className="airborne-tag">🟢 AIRBORNE</span>}</p>
                <p>Altitude: <strong>{rf.altitude ? rf.altitude.toLocaleString() : '0'} ft</strong></p>
                <p>Ground Speed: <strong>{rf.speed} kts</strong></p>
                <p>Heading: <strong>{rf.heading}°</strong></p>
                <p>Source: <span className="feed-tag">{rf.source}</span></p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
