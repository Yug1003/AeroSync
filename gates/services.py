from datetime import datetime, timezone
from bson.objectid import ObjectId
from db.mongo_client import db
from gates.mongo_operations import get_all_gates

flights_col = db["flights"]


def _ensure_datetime(dt):
    """Ensure a string or datetime object is converted to a UTC datetime object."""
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    if isinstance(dt, datetime) and dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def has_conflict(gate_id, arrival_time, departure_time, exclude_flight_id=None):
    """
    Checks if assigning a given gate during [arrival_time, departure_time] creates a schedule conflict.

    Overlap Algorithm Explanation:
    Two time intervals [A_start, A_end] and [B_start, B_end] overlap if and only if:
    NOT (A_end <= B_start OR A_start >= B_end)
    Or equivalently:
    A_start < B_end AND A_end > B_start

    Returns True if a conflicting flight is found at the specified gate; False otherwise.
    """
    arrival_dt = _ensure_datetime(arrival_time)
    departure_dt = _ensure_datetime(departure_time)

    query = {
        "gate_id": str(gate_id),
        "status": {"$ne": "departed"},
    }

    if exclude_flight_id:
        query["_id"] = {"$ne": ObjectId(exclude_flight_id)}

    existing_flights = list(flights_col.find(query))

    for flight in existing_flights:
        ex_arrival = _ensure_datetime(flight["arrival_time"])
        ex_departure = _ensure_datetime(flight["departure_time"])

        # Check standard interval overlap logic
        # Overlap occurs if requested arrival < existing departure AND requested departure > existing arrival
        if arrival_dt < ex_departure and departure_dt > ex_arrival:
            return True

    return False


def find_free_gate(arrival_time, departure_time):
    """
    Finds the first gate that is not under maintenance and has no schedule conflicts
    for the requested window [arrival_time, departure_time].

    Returns the gate dict if a free gate is found, or None if all gates are occupied/conflicting.
    """
    gates = get_all_gates()

    for gate in gates:
        # Skip gates undergoing maintenance
        if gate.get("status") == "maintenance":
            continue

        # Check if the gate has any flight conflict during the window
        if not has_conflict(gate["_id"], arrival_time, departure_time):
            return gate

    return None
