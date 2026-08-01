import urllib.request
import json
from datetime import datetime, timezone

# Real-World Coordinates & Bounding Boxes for 15 Major Indian International Airports
AIRPORT_CONFIGS = {
    "AMD": {
        "name": "Sardar Vallabhbhai Patel International Airport",
        "city": "Ahmedabad",
        "coords": [23.0772, 72.6347],
        "bounds": "23.4,22.7,72.3,73.0",
        "terminals": ["Terminal 1 (Domestic)", "Terminal 2 (International)"],
    },
    "DEL": {
        "name": "Indira Gandhi International Airport",
        "city": "New Delhi",
        "coords": [28.5562, 77.1000],
        "bounds": "28.8,28.3,76.8,77.4",
        "terminals": ["Terminal 1", "Terminal 2", "Terminal 3 (International)"],
    },
    "BOM": {
        "name": "Chhatrapati Shivaji Maharaj International Airport",
        "city": "Mumbai",
        "coords": [19.0896, 72.8656],
        "bounds": "19.3,18.8,72.6,73.1",
        "terminals": ["Terminal 1 (Domestic)", "Terminal 2 (International)"],
    },
    "BLR": {
        "name": "Kempegowda International Airport",
        "city": "Bengaluru",
        "coords": [13.1986, 77.7066],
        "bounds": "13.4,12.9,77.5,77.9",
        "terminals": ["Terminal 1", "Terminal 2 (Garden Terminal)"],
    },
    "MAA": {
        "name": "Chennai International Airport",
        "city": "Chennai",
        "coords": [12.9941, 80.1709],
        "bounds": "13.2,12.7,79.9,80.4",
        "terminals": ["Kamaraj Domestic Terminal", "Anna International Terminal"],
    },
    "HYD": {
        "name": "Rajiv Gandhi International Airport",
        "city": "Hyderabad",
        "coords": [17.2403, 78.4294],
        "bounds": "17.5,17.0,78.2,78.7",
        "terminals": ["Main Terminal Concourse A & B"],
    },
    "CCU": {
        "name": "Netaji Subhash Chandra Bose International Airport",
        "city": "Kolkata",
        "coords": [22.6547, 88.4467],
        "bounds": "22.9,22.4,88.2,88.7",
        "terminals": ["Integrated Terminal T2"],
    },
    "COK": {
        "name": "Cochin International Airport",
        "city": "Kochi",
        "coords": [10.1520, 76.4019],
        "bounds": "10.4,9.9,76.2,76.6",
        "terminals": ["Terminal 1 (Domestic)", "Terminal 3 (International)"],
    },
    "GOI": {
        "name": "Manohar International Airport / Dabolim",
        "city": "Goa",
        "coords": [15.3808, 73.8314],
        "bounds": "15.6,15.1,73.6,74.0",
        "terminals": ["Integrated Terminal Concourse"],
    },
    "JAI": {
        "name": "Jaipur International Airport",
        "city": "Jaipur",
        "coords": [26.8242, 75.8122],
        "bounds": "27.0,26.6,75.6,76.0",
        "terminals": ["Terminal 2"],
    },
    "LKO": {
        "name": "Chaudhary Charan Singh International Airport",
        "city": "Lucknow",
        "coords": [26.7606, 80.8893],
        "bounds": "26.9,26.5,80.7,81.1",
        "terminals": ["Terminal 2", "Terminal 3"],
    },
    "ATQ": {
        "name": "Sri Guru Ram Dass Jee International Airport",
        "city": "Amritsar",
        "coords": [31.7096, 74.7973],
        "bounds": "31.9,31.5,74.6,75.0",
        "terminals": ["Integrated Terminal"],
    },
    "TRV": {
        "name": "Thiruvananthapuram International Airport",
        "city": "Trivandrum",
        "coords": [8.4821, 76.9200],
        "bounds": "8.7,8.2,76.7,77.1",
        "terminals": ["Terminal 1 (Domestic)", "Terminal 2 (International)"],
    },
    "IXC": {
        "name": "Chandigarh International Airport",
        "city": "Chandigarh",
        "coords": [30.6735, 76.7885],
        "bounds": "30.8,30.4,76.6,77.0",
        "terminals": ["New Civil Air Terminal"],
    },
    "VTZ": {
        "name": "Visakhapatnam International Airport",
        "city": "Visakhapatnam",
        "coords": [17.7211, 83.2245],
        "bounds": "17.9,17.5,83.0,83.4",
        "terminals": ["Integrated Terminal"],
    },
}


def fetch_live_flightradar24_flights(airport_code="AMD"):
    """
    Fetches real-time ground & flight telemetry directly from Flightradar24 live servers
    for any selected Indian International Airport code (DEL, BOM, BLR, AMD, MAA, etc.).
    """
    config = AIRPORT_CONFIGS.get(airport_code.upper(), AIRPORT_CONFIGS["AMD"])
    bounds_str = config["bounds"]
    url = f"https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds={bounds_str}"

    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))

            fr24_flights = []
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
                    origin = val[11] or airport_code
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
                        "airport_code": airport_code,
                        "source": f"Flightradar24 Live ({airport_code}) 📡",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    })

            return fr24_flights
    except Exception as err:
        print(f"[Flightradar24 API Warning for {airport_code}] {err}")
        return []
