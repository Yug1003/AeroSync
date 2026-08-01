import urllib.request
import json
from datetime import datetime, timezone

# OpenSky Network 2000km Radius Airspace Bounding Box around Ahmedabad (AMD)
# Lat: 5.0° N to 41.0° N | Lng: 54.0° E to 91.0° E
OPENSKY_URL = "https://opensky-network.org/api/states/all?lamin=5.0&lamax=41.0&lomin=54.0&lomax=91.0"


def fetch_live_opensky_flights():
    """
    Fetches real-time ADS-B satellite telemetry for aircraft currently flying in
    Ahmedabad airspace directly from OpenSky Network satellite receivers.
    """
    try:
        req = urllib.request.Request(
            OPENSKY_URL,
            headers={"User-Agent": "AeroSync-Aviation-Command/1.0"},
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            states = data.get("states", [])

            live_flights = []
            if states:
                for s in states:
                    icao24 = s[0]
                    callsign = (s[1] or "UNK").strip()
                    origin_country = s[2] or "Unknown"
                    longitude = s[5]
                    latitude = s[6]
                    altitude_m = s[7] or 1000
                    velocity_ms = s[9] or 100
                    heading = s[10] or 0

                    if latitude is not None and longitude is not None:
                        live_flights.append(
                            {
                                "id": f"opensky_{icao24}",
                                "icao24": icao24.upper(),
                                "callsign": callsign if callsign else f"AMD-{icao24[:4]}",
                                "origin_country": origin_country,
                                "lat": latitude,
                                "lng": longitude,
                                "altitude_ft": round(altitude_m * 3.28084),
                                "speed_kts": round(velocity_ms * 1.94384),
                                "heading": round(heading),
                                "source": "OpenSky Satellite ADS-B",
                                "updated_at": datetime.now(timezone.utc).isoformat(),
                            }
                        )

            return live_flights
    except Exception as err:
        print(f"[OpenSky API Warning] {err}")
        return []
