import React, { useEffect, useState, useRef } from 'react';
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

export default function RadarMapComponent({ selectedAirportCode = 'AMD' }) {
  const [radarFlights, setRadarFlights] = useState([]);
  const airportCode = selectedAirportCode.toUpperCase();
  const centerCoords = AIRPORT_COORDS[airportCode] || AIRPORT_COORDS['AMD'];

  const fetchLiveRadarData = async () => {
    try {
      const res = await API.get(`flights/live-radar/?airport=${airportCode}`);
      const rawLiveFlights = res.data.flights || [];

      const fr24Mapped = rawLiveFlights
        .filter((rf) => rf.lat && rf.lng && !isNaN(rf.lat) && !isNaN(rf.lng))
        .map((rf) => ({
          id: rf.id,
          callsign: rf.callsign || 'UNK',
          icao24: rf.icao24 || rf.tailNumber || 'VT-AIR',
          tailNumber: rf.tailNumber || rf.icao24,
          aircraftType: rf.aircraft_type || 'Commercial Jet',
          route: rf.route || 'Regional Corridor',
          country: rf.origin_country || 'Commercial',
          lat: Number(rf.lat),
          lng: Number(rf.lng),
          heading: rf.heading || 0,
          altitude: rf.altitude_ft ?? 0,
          speed: rf.speed_kts ?? 0,
          isOnGround: rf.is_on_ground || (rf.altitude_ft ?? 0) <= 100,
          source: rf.source || `Flightradar24 Live (${airportCode}) 📡`,
        }));

      setRadarFlights(fr24Mapped);
    } catch (err) {
      console.error('Radar API fetch error:', err);
    }
  };

  useEffect(() => {
    fetchLiveRadarData();
    const pollInterval = setInterval(fetchLiveRadarData, 5000);
    return () => clearInterval(pollInterval);
  }, [selectedAirportCode]);

  return (
    <div className="leaflet-container-box">
      <MapContainer
        key={airportCode}
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
