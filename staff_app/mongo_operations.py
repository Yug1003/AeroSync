from datetime import datetime, timezone
from bson.objectid import ObjectId
from db.mongo_client import db

staff_col = db["staff"]

VALID_DEPARTMENTS = ["baggage", "cleaning", "fuel", "catering", "operations", "ramp"]

DEFAULT_STAFF_ROSTER = [
    {"_id": "st_01", "name": "Rajesh Kumar", "role": "Refueling Captain", "department": "fuel", "phone": "+91 98765 43210", "assigned_flight": "6E 214", "assigned_gate": "T1-G1", "status": "ON DUTY"},
    {"_id": "st_02", "name": "Vikram Singh", "role": "Baggage Crew Lead", "department": "baggage", "phone": "+91 98765 43211", "assigned_flight": "AI 011", "assigned_gate": "T1-G2", "status": "ON DUTY"},
    {"_id": "st_03", "name": "Sanjay Patel", "role": "Catering Specialist", "department": "catering", "phone": "+91 98765 43212", "assigned_flight": "SQ 505", "assigned_gate": "T2-INT1", "status": "ON DUTY"},
    {"_id": "st_04", "name": "Amit Sharma", "role": "Cabin Sanitation Ops", "department": "cleaning", "phone": "+91 98765 43213", "assigned_flight": "QP 1102", "assigned_gate": "T1-G3", "status": "ON DUTY"},
    {"_id": "st_05", "name": "Deepak Verma", "role": "Ramp Marshal", "department": "operations", "phone": "+91 98765 43214", "assigned_flight": "SG 531", "assigned_gate": "T1-G4", "status": "ON DUTY"},
    {"_id": "st_06", "name": "Sunil Mehta", "role": "Fuel Hydrant Operator", "department": "fuel", "phone": "+91 98765 43215", "assigned_flight": "AI 101", "assigned_gate": "T3-A12", "status": "ON DUTY"},
    {"_id": "st_07", "name": "Karan Malhotra", "role": "Baggage Handler", "department": "baggage", "phone": "+91 98765 43216", "assigned_flight": "EK 517", "assigned_gate": "T3-B22", "status": "ON DUTY"},
    {"_id": "st_08", "name": "Pooja Joshi", "role": "Ops Dispatch Coordinator", "department": "operations", "phone": "+91 98765 43217", "assigned_flight": None, "assigned_gate": None, "status": "STANDBY / AVAILABLE"},
    {"_id": "st_09", "name": "Nitin Desai", "role": "Aircraft Wash & Clean", "department": "cleaning", "phone": "+91 98765 43218", "assigned_flight": None, "assigned_gate": None, "status": "STANDBY / AVAILABLE"},
    {"_id": "st_10", "name": "Anil Rao", "role": "Catering Uplift Agent", "department": "catering", "phone": "+91 98765 43219", "assigned_flight": None, "assigned_gate": None, "status": "STANDBY / AVAILABLE"},
]


def _format_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def _ensure_datetime(dt):
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    if isinstance(dt, datetime) and dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def create_staff(data):
    name = data.get("name")
    department = data.get("department")
    shift_start = _ensure_datetime(data.get("shift_start"))
    shift_end = _ensure_datetime(data.get("shift_end"))
    is_available = data.get("is_available", True)

    if department not in VALID_DEPARTMENTS:
        raise ValueError(
            f"Invalid department: '{department}'. Must be one of {VALID_DEPARTMENTS}"
        )

    doc = {
        "name": name,
        "department": department,
        "shift_start": shift_start,
        "shift_end": shift_end,
        "is_available": is_available,
    }
    result = staff_col.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


def get_all_staff():
    docs = list(staff_col.find({}))
    if not docs:
        return DEFAULT_STAFF_ROSTER
    return [_format_doc(doc) for doc in docs]


def get_staff_by_id(staff_id):
    if not isinstance(staff_id, str):
        return None
    if ObjectId.is_valid(staff_id):
        doc = staff_col.find_one({"_id": ObjectId(staff_id)})
        return _format_doc(doc) if doc else None
    
    # Check default fallback roster
    for s in DEFAULT_STAFF_ROSTER:
        if s["_id"] == staff_id:
            return s
    return None


def update_staff_assignment(staff_id, flight_id, flight_callsign, gate_label):
    if ObjectId.is_valid(staff_id):
        staff_col.update_one(
            {"_id": ObjectId(staff_id)},
            {"$set": {
                "assigned_flight": flight_callsign,
                "assigned_gate": gate_label,
                "status": "ON DUTY" if flight_callsign else "STANDBY / AVAILABLE"
            }}
        )
    else:
        for s in DEFAULT_STAFF_ROSTER:
            if s["_id"] == staff_id:
                s["assigned_flight"] = flight_callsign
                s["assigned_gate"] = gate_label
                s["status"] = "ON DUTY" if flight_callsign else "STANDBY / AVAILABLE"
                return s

    return get_staff_by_id(staff_id)
