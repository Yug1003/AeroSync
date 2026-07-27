from datetime import datetime, timezone
from bson.objectid import ObjectId
from db.mongo_client import db

incidents_col = db["incidents"]

VALID_PRIORITIES = ["high", "medium", "low"]
VALID_STATUSES = ["open", "resolved"]


def _format_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def create_incident(data):
    flight_id = data.get("flight_id", None)
    description = data.get("description", "")
    priority = data.get("priority", "medium")
    status = data.get("status", "open")
    reported_at = datetime.now(timezone.utc)

    if not description or not str(description).strip():
        raise ValueError("Incident description is required.")

    if priority not in VALID_PRIORITIES:
        raise ValueError(
            f"Invalid priority: '{priority}'. Must be one of {VALID_PRIORITIES}"
        )

    if status not in VALID_STATUSES:
        raise ValueError(
            f"Invalid status: '{status}'. Must be one of {VALID_STATUSES}"
        )

    doc = {
        "flight_id": str(flight_id) if flight_id else None,
        "description": description,
        "priority": priority,
        "status": status,
        "reported_at": reported_at,
    }
    result = incidents_col.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


def get_all_incidents():
    docs = list(incidents_col.find({}).sort("reported_at", -1))
    return [_format_doc(doc) for doc in docs]


def get_incident_by_id(incident_id):
    if not isinstance(incident_id, str) or not ObjectId.is_valid(incident_id):
        return None
    doc = incidents_col.find_one({"_id": ObjectId(incident_id)})
    return _format_doc(doc) if doc else None


def update_incident_status(incident_id, status):
    if not isinstance(incident_id, str) or not ObjectId.is_valid(incident_id):
        return None

    if status not in VALID_STATUSES:
        raise ValueError(
            f"Invalid status: '{status}'. Must be one of {VALID_STATUSES}"
        )

    result = incidents_col.find_one_and_update(
        {"_id": ObjectId(incident_id)},
        {"$set": {"status": status}},
        return_document=True,
    )
    return _format_doc(result) if result else None
