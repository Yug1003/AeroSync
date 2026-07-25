from datetime import datetime, timezone
from bson.objectid import ObjectId
from db.mongo_client import db

staff_col = db["staff"]

VALID_DEPARTMENTS = ["baggage", "cleaning", "fuel", "catering"]


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
    return [_format_doc(doc) for doc in docs]


def get_staff_by_id(staff_id):
    if not isinstance(staff_id, str) or not ObjectId.is_valid(staff_id):
        return None
    doc = staff_col.find_one({"_id": ObjectId(staff_id)})
    return _format_doc(doc) if doc else None
