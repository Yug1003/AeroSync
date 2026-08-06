from datetime import datetime
from bson.objectid import ObjectId
from db.mongo_client import db

aircraft_col = db["aircraft"]
flights_col = db["flights"]


def _format_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def create_aircraft(data):
    tail_number = data.get("tail_number")
    airline = data.get("airline")
    aircraft_type = data.get("aircraft_type")
    passenger_capacity = data.get("passenger_capacity")

    if aircraft_col.find_one({"tail_number": tail_number}):
        raise ValueError(f"Aircraft with tail number '{tail_number}' already exists.")

    doc = {
        "tail_number": tail_number,
        "airline": airline,
        "aircraft_type": aircraft_type,
        "passenger_capacity": passenger_capacity,
    }
    result = aircraft_col.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


def get_aircraft_by_id(aircraft_id):
    if not isinstance(aircraft_id, str) or not ObjectId.is_valid(aircraft_id):
        return None
    doc = aircraft_col.find_one({"_id": ObjectId(aircraft_id)})
    return _format_doc(doc) if doc else None


def create_flight(data):
    aircraft_id = data.get("aircraft_id")
    arrival_time = data.get("arrival_time")
    departure_time = data.get("departure_time")
    status = data.get("status", "scheduled")
    gate_id = data.get("gate_id", None)
    callsign = data.get("callsign", None)
    tailNumber = data.get("tailNumber", None)
    aircraftType = data.get("aircraftType", None)
    route = data.get("route", None)
    airline = data.get("airline", None)
    airport_code = data.get("airport_code", "AMD")

    if isinstance(arrival_time, str):
        arrival_time = datetime.fromisoformat(arrival_time.replace("Z", "+00:00"))
    if isinstance(departure_time, str):
        departure_time = datetime.fromisoformat(departure_time.replace("Z", "+00:00"))

    doc = {
        "aircraft_id": str(aircraft_id) if aircraft_id else None,
        "arrival_time": arrival_time,
        "departure_time": departure_time,
        "status": status,
        "gate_id": str(gate_id) if gate_id else None,
        "callsign": callsign,
        "tailNumber": tailNumber,
        "aircraftType": aircraftType,
        "route": route,
        "airline": airline,
        "airport_code": airport_code,
    }
    result = flights_col.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


def update_flight(flight_id, update_fields):
    if not isinstance(flight_id, str) or not ObjectId.is_valid(flight_id):
        return None

    allowed_fields = [
        "aircraft_id",
        "gate_id",
        "arrival_time",
        "departure_time",
        "status",
        "callsign",
        "tailNumber",
        "aircraftType",
        "route",
        "airline",
        "airport_code",
    ]

    set_dict = {}
    for key, val in update_fields.items():
        if key in allowed_fields:
            if key in ["arrival_time", "departure_time"] and isinstance(val, str):
                try:
                    val = datetime.fromisoformat(val.replace("Z", "+00:00"))
                except ValueError:
                    pass
            set_dict[key] = val

    if not set_dict:
        return get_flight_by_id(flight_id)

    result = flights_col.find_one_and_update(
        {"_id": ObjectId(flight_id)},
        {"$set": set_dict},
        return_document=True,
    )
    return _format_doc(result) if result else None


def get_flight_by_id(flight_id):
    if not isinstance(flight_id, str) or not ObjectId.is_valid(flight_id):
        return None
    doc = flights_col.find_one({"_id": ObjectId(flight_id)})
    return _format_doc(doc) if doc else None


AIRPORT_STATION_PRESETS = {
    "DEL": [
        {"callsign": "AI 101", "airline": "Air India", "tailNumber": "VT-ALJ", "aircraftType": "Boeing 777-300ER", "route": "DEL ✈️ JFK", "status": "in_progress"},
        {"callsign": "6E 2021", "airline": "IndiGo", "tailNumber": "VT-IZB", "aircraftType": "Airbus A320neo", "route": "DEL ✈️ BOM", "status": "scheduled"},
        {"callsign": "UK 955", "airline": "Vistara", "tailNumber": "VT-TNE", "aircraftType": "Boeing 787-9", "route": "DEL ✈️ LHR", "status": "in_progress"},
        {"callsign": "QP 1102", "airline": "Akasa Air", "tailNumber": "VT-YAC", "aircraftType": "Boeing 737 MAX 8", "route": "DEL ✈️ BLR", "status": "scheduled"},
        {"callsign": "SG 814", "airline": "SpiceJet", "tailNumber": "VT-SGZ", "aircraftType": "Boeing 737-800", "route": "DEL ✈️ JAI", "status": "delayed"},
        {"callsign": "EK 517", "airline": "Emirates", "tailNumber": "A6-EBC", "aircraftType": "Boeing 777-300ER", "route": "DEL ✈️ DXB", "status": "scheduled"},
    ],
    "BOM": [
        {"callsign": "AI 130", "airline": "Air India", "tailNumber": "VT-EXN", "aircraftType": "Airbus A320neo", "route": "BOM ✈️ LHR", "status": "in_progress"},
        {"callsign": "6E 5312", "airline": "IndiGo", "tailNumber": "VT-IFH", "aircraftType": "Airbus A321neo", "route": "BOM ✈️ DEL", "status": "scheduled"},
        {"callsign": "UK 870", "airline": "Vistara", "tailNumber": "VT-TNC", "aircraftType": "Airbus A320neo", "route": "BOM ✈️ SIN", "status": "in_progress"},
        {"callsign": "LH 757", "airline": "Lufthansa", "tailNumber": "D-ABYT", "aircraftType": "Boeing 747-8", "route": "BOM ✈️ FRA", "status": "delayed"},
        {"callsign": "SG 401", "airline": "SpiceJet", "tailNumber": "VT-SGB", "aircraftType": "Boeing 737-800", "route": "BOM ✈️ GOI", "status": "scheduled"},
    ],
    "BLR": [
        {"callsign": "AI 175", "airline": "Air India", "tailNumber": "VT-EXF", "aircraftType": "Boeing 777-200LR", "route": "BLR ✈️ SFO", "status": "in_progress"},
        {"callsign": "6E 451", "airline": "IndiGo", "tailNumber": "VT-IZC", "aircraftType": "Airbus A320neo", "route": "BLR ✈️ DEL", "status": "scheduled"},
        {"callsign": "AF 191", "airline": "Air France", "tailNumber": "F-GSQS", "aircraftType": "Airbus A350-900", "route": "BLR ✈️ CDG", "status": "scheduled"},
        {"callsign": "SQ 501", "airline": "Singapore Airlines", "tailNumber": "9V-SHE", "aircraftType": "Airbus A350-900", "route": "BLR ✈️ SIN", "status": "in_progress"},
    ],
    "MAA": [
        {"callsign": "6E 1002", "airline": "IndiGo", "tailNumber": "VT-IZA", "aircraftType": "Airbus A320neo", "route": "MAA ✈️ SIN", "status": "in_progress"},
        {"callsign": "MH 181", "airline": "Malaysia Airlines", "tailNumber": "9M-MTB", "aircraftType": "Airbus A330-300", "route": "MAA ✈️ KUL", "status": "scheduled"},
        {"callsign": "AI 472", "airline": "Air India", "tailNumber": "VT-EXK", "aircraftType": "Airbus A320-200", "route": "MAA ✈️ DEL", "status": "scheduled"},
        {"callsign": "SG 310", "airline": "SpiceJet", "tailNumber": "VT-SGF", "aircraftType": "Boeing 737-800", "route": "MAA ✈️ COK", "status": "delayed"},
    ],
    "HYD": [
        {"callsign": "AI 127", "airline": "Air India", "tailNumber": "VT-ALU", "aircraftType": "Boeing 777-300ER", "route": "HYD ✈️ ORD", "status": "in_progress"},
        {"callsign": "EK 527", "airline": "Emirates", "tailNumber": "A6-EPF", "aircraftType": "Boeing 777-300ER", "route": "HYD ✈️ DXB", "status": "scheduled"},
        {"callsign": "6E 6108", "airline": "IndiGo", "tailNumber": "VT-IFA", "aircraftType": "Airbus A321neo", "route": "HYD ✈️ BLR", "status": "scheduled"},
        {"callsign": "QP 1401", "airline": "Akasa Air", "tailNumber": "VT-YAD", "aircraftType": "Boeing 737 MAX 8", "route": "HYD ✈️ BOM", "status": "scheduled"},
    ],
    "CCU": [
        {"callsign": "TG 314", "airline": "Thai Airways", "tailNumber": "HS-TKF", "aircraftType": "Boeing 777-300ER", "route": "CCU ✈️ BKK", "status": "scheduled"},
        {"callsign": "6E 209", "airline": "IndiGo", "tailNumber": "VT-IZD", "aircraftType": "Airbus A320neo", "route": "CCU ✈️ DEL", "status": "in_progress"},
        {"callsign": "BS 201", "airline": "US-Bangla", "tailNumber": "S2-AJU", "aircraftType": "Boeing 737-800", "route": "CCU ✈️ DAC", "status": "scheduled"},
        {"callsign": "AI 773", "airline": "Air India", "tailNumber": "VT-EXJ", "aircraftType": "Airbus A319", "route": "CCU ✈️ BOM", "status": "delayed"},
    ],
    "COK": [
        {"callsign": "EK 531", "airline": "Emirates", "tailNumber": "A6-EGO", "aircraftType": "Boeing 777-300ER", "route": "COK ✈️ DXB", "status": "in_progress"},
        {"callsign": "QR 515", "airline": "Qatar Airways", "tailNumber": "A7-BCC", "aircraftType": "Boeing 787-8", "route": "COK ✈️ DOH", "status": "scheduled"},
        {"callsign": "IX 412", "airline": "Air India Express", "tailNumber": "VT-AXU", "aircraftType": "Boeing 737-800", "route": "COK ✈️ SHJ", "status": "scheduled"},
        {"callsign": "6E 312", "airline": "IndiGo", "tailNumber": "VT-IZG", "aircraftType": "Airbus A320neo", "route": "COK ✈️ DEL", "status": "scheduled"},
    ],
    "GOI": [
        {"callsign": "6E 521", "airline": "IndiGo", "tailNumber": "VT-IZH", "aircraftType": "Airbus A320neo", "route": "GOI ✈️ BOM", "status": "in_progress"},
        {"callsign": "AI 884", "airline": "Air India", "tailNumber": "VT-EXL", "aircraftType": "Airbus A320-200", "route": "GOI ✈️ DEL", "status": "scheduled"},
        {"callsign": "UK 842", "airline": "Vistara", "tailNumber": "VT-TND", "aircraftType": "Airbus A320neo", "route": "GOI ✈️ BLR", "status": "scheduled"},
        {"callsign": "BA 2062", "airline": "British Airways", "tailNumber": "G-YMMB", "aircraftType": "Boeing 777-200ER", "route": "GOI ✈️ LGW", "status": "scheduled"},
    ],
}


def get_all_flights(airport_code=None):
    if airport_code:
        code = airport_code.upper()
        query = {"$or": [{"airport_code": code}, {"route": {"$regex": code, "$options": "i"}}]}
        docs = list(flights_col.find(query))

        if not docs:
            # Auto-seed preset or dynamic flights for this airport station
            now = datetime.now()
            presets = AIRPORT_STATION_PRESETS.get(code, [
                {"callsign": f"6E {101 + idx * 43}", "airline": "IndiGo", "tailNumber": f"VT-{code}{idx+1}", "aircraftType": "A320neo", "route": f"{code} ✈️ INTL", "status": "scheduled"}
                for idx in range(4)
            ])

            for idx, p in enumerate(presets):
                f_doc = {
                    "callsign": p["callsign"],
                    "airline": p["airline"],
                    "tailNumber": p["tailNumber"],
                    "aircraftType": p["aircraftType"],
                    "route": p["route"],
                    "status": p.get("status", "scheduled"),
                    "airport_code": code,
                    "arrival_time": now,
                    "departure_time": now,
                }
                res = flights_col.insert_one(f_doc)
                f_doc["_id"] = str(res.inserted_id)

            docs = list(flights_col.find(query))

        return [_format_doc(doc) for doc in docs]

    docs = list(flights_col.find({}))
    return [_format_doc(doc) for doc in docs]


def update_flight_status(flight_id, status):
    if not isinstance(flight_id, str) or not ObjectId.is_valid(flight_id):
        return None

    result = flights_col.find_one_and_update(
        {"_id": ObjectId(flight_id)},
        {"$set": {"status": status}},
        return_document=True,
    )
    return _format_doc(result) if result else None


def update_flight_gate(flight_id, gate_id):
    if not isinstance(flight_id, str) or not ObjectId.is_valid(flight_id):
        return None

    result = flights_col.find_one_and_update(
        {"_id": ObjectId(flight_id)},
        {"$set": {"gate_id": str(gate_id) if gate_id else None}},
        return_document=True,
    )
    return _format_doc(result) if result else None


def delete_flight(flight_id):
    if not isinstance(flight_id, str) or not ObjectId.is_valid(flight_id):
        return False

    result = flights_col.delete_one({"_id": ObjectId(flight_id)})
    return result.deleted_count > 0


def get_all_aircraft():
    docs = list(aircraft_col.find({}))
    return [_format_doc(doc) for doc in docs]




