import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import API from '../api/api';
import 'leaflet/dist/leaflet.css';
import './RadarMapComponent.css';

// Custom Airplane Icon generator for Leaflet (Airborne vs Ground Parked)
const createPlaneIcon = (heading = 45, isGround = false) => {
  const color = isGround ? '#fbbf24' : '#86efac';
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

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, 7, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function RadarMapComponent({ flights = [], selectedAirportCode = 'AMD' }) {
  const [radarFlights, setRadarFlights] = useState([]);
  const [tick, setTick] = useState(0);

  const airportCode = selectedAirportCode.toUpperCase();
  const centerCoords = AIRPORT_COORDS[airportCode] || AIRPORT_COORDS['AMD'];

  // Dynamic movement tick counter for flight vector animation
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => (prev + 1) % 500);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const fetchLiveRadarData = async () => {
    try {
      let fr24Mapped = [];
      try {
        const res = await API.get(`flights/live-radar/?airport=${airportCode}`);
        const rawLiveFlights = res.data.flights || [];

        fr24Mapped = rawLiveFlights
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
            heading: rf.heading || 45,
            altitude: rf.altitude_ft ?? 12000,
            speed: rf.speed_kts ?? 350,
            isOnGround: rf.is_on_ground || (rf.altitude_ft ?? 0) <= 100,
            source: rf.source || `Flightradar24 Live (${airportCode}) 📡`,
          }));
      } catch (e) {
        console.warn('FR24 Live Radar fetch note:', e);
      }

      // Generate airport active flight vectors around selected airport center
      const dbMapped = (flights || []).map((f, idx) => {
        const angle = (idx * 55) * (Math.PI / 180);
        const radius = 0.04 + (idx % 3) * 0.035;
        const initialLat = centerCoords[0] + Math.sin(angle) * radius;
        const initialLng = centerCoords[1] + Math.cos(angle) * radius;
        const heading = Math.round((Math.atan2(centerCoords[1] - initialLng, centerCoords[0] - initialLat) * 180) / Math.PI);
        const isOnGround = f.status === 'in_progress' || f.status === 'scheduled';

        return {
          id: `db_${f._id || idx}`,
          callsign: f.callsign ? f.callsign : `6E-${String(f._id || idx).slice(-4)}`,
          icao24: String(f._id || idx).slice(-6).toUpperCase(),
          tailNumber: f.tailNumber || 'VT-AIR',
          aircraftType: f.aircraftType || 'A320neo',
          route: f.route || `${airportCode} ✈️ INTL`,
          country: 'India',
          baseLat: initialLat,
          baseLng: initialLng,
          lat: initialLat,
          lng: initialLng,
          heading: heading,
          altitude: f.status === 'departed' ? 18000 : isOnGround ? 0 : 4500,
          speed: f.status === 'departed' ? 440 : isOnGround ? 0 : 210,
          isOnGround: isOnGround,
          source: `AeroSync ${airportCode} Hub 🏢`,
        };
      });

      // Merge live radar and database active flights
      const combinedMap = new Map();
      [...fr24Mapped, ...dbMapped].forEach((item) => {
        combinedMap.set(item.id, item);
      });

      const combinedList = Array.from(combinedMap.values());
      setRadarFlights(combinedList);
    } catch (err) {
      console.error('Radar API fetch error:', err);
    }
  };

  useEffect(() => {
    fetchLiveRadarData();
    const pollInterval = setInterval(fetchLiveRadarData, 10000);
    return () => clearInterval(pollInterval);
  }, [selectedAirportCode, flights.length]);

  return (
    <div className="leaflet-container-box">
      <MapContainer
        key={airportCode}
        center={centerCoords}
        zoom={7}
        scrollWheelZoom={true}
        className="radar-map"
      >
        <MapRecenter center={centerCoords} />

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

        {/* Render Aircraft Markers with Live Animated Motion Vectors */}
        {radarFlights.map((rf, idx) => {
          let currentLat = rf.lat;
          let currentLng = rf.lng;

          // If airborne, calculate dynamic motion offset along plane heading vector
          if (!rf.isOnGround) {
            const rad = ((rf.heading || 45) * Math.PI) / 180;
            const step = (tick + idx * 10) % 80;
            const deltaLat = Math.cos(rad) * 0.0004 * step;
            const deltaLng = Math.sin(rad) * 0.0004 * step;

            currentLat = (rf.baseLat || rf.lat) + deltaLat;
            currentLng = (rf.baseLng || rf.lng) + deltaLng;
          }

          return (
            <Marker
              key={rf.id}
              position={[currentLat, currentLng]}
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
          );
        })}
      </MapContainer>
    </div>
  );
}

