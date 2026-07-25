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

    if isinstance(arrival_time, str):
        arrival_time = datetime.fromisoformat(arrival_time)
    if isinstance(departure_time, str):
        departure_time = datetime.fromisoformat(departure_time)

    doc = {
        "aircraft_id": str(aircraft_id) if aircraft_id else None,
        "arrival_time": arrival_time,
        "departure_time": departure_time,
        "status": status,
        "gate_id": str(gate_id) if gate_id else None,
    }
    result = flights_col.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


def get_flight_by_id(flight_id):
    if not isinstance(flight_id, str) or not ObjectId.is_valid(flight_id):
        return None
    doc = flights_col.find_one({"_id": ObjectId(flight_id)})
    return _format_doc(doc) if doc else None


def get_all_flights():
    docs = list(flights_col.find({}))
    return [_format_doc(doc) for doc in docs]
