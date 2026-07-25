from datetime import datetime, timezone
from staff_app.mongo_operations import get_staff_by_id
from flights.mongo_operations import get_flight_by_id
from db.mongo_client import db

tasks_col = db["tasks"]


def _ensure_datetime(dt):
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    if isinstance(dt, datetime) and dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def is_staff_available(staff_id, start_time, end_time):
    """
    Checks if a staff member is available during window [start_time, end_time]:
    1. Staff exists and is_available == True
    2. Window falls within staff shift_start and shift_end
    3. No overlapping task assignments exist for this staff member
    """
    staff = get_staff_by_id(staff_id)
    if not staff:
        return False, f"Staff with id '{staff_id}' not found."

    if not staff.get("is_available", True):
        return False, f"Staff member '{staff['name']}' is marked as unavailable."

    req_start = _ensure_datetime(start_time)
    req_end = _ensure_datetime(end_time)

    shift_start = _ensure_datetime(staff["shift_start"])
    shift_end = _ensure_datetime(staff["shift_end"])

    if req_start < shift_start or req_end > shift_end:
        return (
            False,
            f"Requested window ({req_start.strftime('%H:%M')}-{req_end.strftime('%H:%M')}) is outside staff shift ({shift_start.strftime('%H:%M')}-{shift_end.strftime('%H:%M')}).",
        )

    # Check overlapping task assignments
    assigned_tasks = list(tasks_col.find({"assigned_staff_id": str(staff_id)}))
    for t in assigned_tasks:
        flight = get_flight_by_id(t.get("flight_id"))
        if not flight or flight.get("status") == "departed":
            continue

        fl_start = _ensure_datetime(flight["arrival_time"])
        fl_end = _ensure_datetime(flight["departure_time"])

        # Check interval overlap
        if req_start < fl_end and req_end > fl_start:
            return (
                False,
                f"Staff member '{staff['name']}' is already assigned to a task for an overlapping flight ({fl_start.strftime('%H:%M')}-{fl_end.strftime('%H:%M')}).",
            )

    return True, "Staff is available."
