import urllib.request
import json
import time
from datetime import datetime, timezone

OPENSKY_URL = "https://opensky-network.org/api/states/all?lamin=5.0&lamax=41.0&lomin=54.0&lomax=91.0"

_OPENSKY_CACHE = {"timestamp": 0, "data": []}
CACHE_TTL_SECONDS = 15.0


def fetch_live_opensky_flights():
    """
    Fetches real-time ADS-B satellite telemetry with a 15-second TTL cache to prevent server blocking.
    """
    now = time.time()
    if now - _OPENSKY_CACHE["timestamp"] < CACHE_TTL_SECONDS and _OPENSKY_CACHE["data"]:
        return _OPENSKY_CACHE["data"]

    try:
        req = urllib.request.Request(
            OPENSKY_URL,
            headers={"User-Agent": "AeroSync-Aviation-Command/1.0"},
        )
        with urllib.request.urlopen(req, timeout=2.0) as response:
            data = json.loads(response.read().decode("utf-8"))
            states = data.get("states", [])

            live_flights = []
            if states:
                for s in states[:30]:  # Cap at 30 items for maximum performance
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

            _OPENSKY_CACHE["timestamp"] = now
            _OPENSKY_CACHE["data"] = live_flights
            return live_flights
    except Exception as err:
        print(f"[OpenSky API Warning] {err}")
        return _OPENSKY_CACHE["data"]

