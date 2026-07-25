from bson.objectid import ObjectId
from db.mongo_client import db

tasks_col = db["tasks"]

VALID_TASK_TYPES = ["baggage_unload", "cabin_cleaning", "refueling", "catering"]
VALID_TASK_STATUSES = ["pending", "in_progress", "completed", "delayed"]


def _format_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def create_task(data):
    flight_id = data.get("flight_id")
    task_type = data.get("task_type")
    status = data.get("status", "pending")
    assigned_staff_id = data.get("assigned_staff_id", None)

    if task_type not in VALID_TASK_TYPES:
        raise ValueError(
            f"Invalid task_type: '{task_type}'. Must be one of {VALID_TASK_TYPES}"
        )

    if status not in VALID_TASK_STATUSES:
        raise ValueError(
            f"Invalid status: '{status}'. Must be one of {VALID_TASK_STATUSES}"
        )

    doc = {
        "flight_id": str(flight_id) if flight_id else None,
        "task_type": task_type,
        "status": status,
        "assigned_staff_id": (
            str(assigned_staff_id) if assigned_staff_id else None
        ),
    }
    result = tasks_col.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


def get_tasks_by_flight(flight_id):
    docs = list(tasks_col.find({"flight_id": str(flight_id)}))
    return [_format_doc(doc) for doc in docs]


def get_task_by_id(task_id):
    if not isinstance(task_id, str) or not ObjectId.is_valid(task_id):
        return None
    doc = tasks_col.find_one({"_id": ObjectId(task_id)})
    return _format_doc(doc) if doc else None


def update_task_status(task_id, status, delay_reason=None):
    if not isinstance(task_id, str) or not ObjectId.is_valid(task_id):
        return None

    if status not in VALID_TASK_STATUSES:
        raise ValueError(
            f"Invalid status: '{status}'. Must be one of {VALID_TASK_STATUSES}"
        )

    if status == "delayed":
        if not delay_reason or not str(delay_reason).strip():
            raise ValueError(
                "delay_reason is required when setting status to 'delayed'."
            )

    update_fields = {"status": status}
    if delay_reason is not None:
        update_fields["delay_reason"] = delay_reason

    result = tasks_col.find_one_and_update(
        {"_id": ObjectId(task_id)},
        {"$set": update_fields},
        return_document=True,
    )
    return _format_doc(result) if result else None
