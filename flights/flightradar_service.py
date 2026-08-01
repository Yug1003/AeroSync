import urllib.request
import json
from datetime import datetime, timezone

# Flightradar24 Live Feed Bounding Box centered directly over Ahmedabad Airport (AMD)
FR24_AMD_URL = "https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=23.5,22.6,72.1,73.1"


def fetch_live_flightradar24_flights():
    """
    Fetches real-time ground & flight telemetry directly from Flightradar24 live servers
    for planes parked at gates, taxiing, landing, or departing at Ahmedabad Airport (AMD).
    """
    try:
        req = urllib.request.Request(
            FR24_AMD_URL,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))

            fr24_flights = []

            # Flightradar24 returns key-value pairs where key is aircraft id hex
            for key, val in data.items():
                if isinstance(val, list) and len(val) >= 17:
                    hex_code = val[0]
                    lat = val[1]
                    lng = val[2]
                    heading = val[3]
                    alt_ft = val[4]
                    speed_kts = val[5]
                    aircraft_type = val[8] or "A320"
                    registration = val[9] or f"VT-{hex_code[:4]}"
                    origin = val[11] or "AMD"
                    dest = val[12] or "INTL"
                    flight_no = val[13] or val[16] or f"FR-{hex_code[:4]}"

                    is_on_ground = alt_ft <= 100 or speed_kts < 30

                    fr24_flights.append({
                        "id": f"fr24_{key}",
                        "icao24": hex_code,
                        "callsign": flight_no.strip(),
                        "tailNumber": registration.strip(),
                        "aircraft_type": aircraft_type,
                        "route": f"{origin} ✈️ {dest}",
                        "origin": origin,
                        "destination": dest,
                        "lat": lat,
                        "lng": lng,
                        "altitude_ft": alt_ft,
                        "speed_kts": speed_kts,
                        "heading": heading,
                        "is_on_ground": is_on_ground,
                        "source": "Flightradar24 Live Feed 📡",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    })

            return fr24_flights
    except Exception as err:
        print(f"[Flightradar24 API Warning] {err}")
        return []
