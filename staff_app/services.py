from datetime import datetime, timezone
from staff_app.models import Staff
from flights.services import get_flight_by_id
from tasks.models import Task

def _format_staff(st):
    if not st:
        return None
    return {
        "_id": str(st.id),
        "id": str(st.id),
        "name": st.name,
        "department": st.department,
        "shift_start": st.shift_start.isoformat() if st.shift_start else None,
        "shift_end": st.shift_end.isoformat() if st.shift_end else None,
        "is_available": st.is_available,
        "assigned_flight_id": str(st.assigned_flight) if st.assigned_flight else None,
        "assigned_flight": str(st.assigned_flight) if st.assigned_flight else None,
    }

def create_staff(data):
    s_id = data.get("_id") or data.get("id")
    st_kwargs = {
        "name": data.get("name", "Ground Crew Member"),
        "department": data.get("department", "fuel"),
        "shift_start": data.get("shift_start") or datetime.now(timezone.utc),
        "shift_end": data.get("shift_end") or datetime.now(timezone.utc),
        "is_available": data.get("is_available", True),
    }
    if s_id:
        st_kwargs["id"] = str(s_id)

    st = Staff.objects.create(**st_kwargs)
    return _format_staff(st)

def get_all_staff():
    return [_format_staff(st) for st in Staff.objects.all()]

def get_staff_by_id(staff_id):
    try:
        st = Staff.objects.get(id=str(staff_id))
        return _format_staff(st)
    except Staff.DoesNotExist:
        return None

def update_staff_assignment(staff_id, flight_id):
    try:
        st = Staff.objects.get(id=str(staff_id))
        st.assigned_flight = str(flight_id) if flight_id else None
        st.save()
        return _format_staff(st)
    except Staff.DoesNotExist:
        return None

def _ensure_datetime(dt):
    if not dt:
        return datetime.now(timezone.utc)
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
    if isinstance(dt, datetime) and dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def is_staff_available(staff_id, start_time, end_time):
    staff = get_staff_by_id(staff_id)
    if not staff:
        return False, f"Staff with id '{staff_id}' not found."

    if not staff.get("is_available", True):
        return False, f"Staff member '{staff['name']}' is marked as unavailable."

    req_start = _ensure_datetime(start_time)
    req_end = _ensure_datetime(end_time)

    assigned_tasks = Task.objects.filter(assigned_to=str(staff_id))
    for t in assigned_tasks:
        flight = get_flight_by_id(t.flight_id)
        if not flight or flight.get("status") == "departed":
            continue
        fl_start = _ensure_datetime(flight["arrival_time"])
        fl_end = _ensure_datetime(flight["departure_time"])
        if req_start < fl_end and req_end > fl_start:
            return (
                False,
                f"Staff member '{staff['name']}' is already assigned to an overlapping flight.",
            )
    return True, "Staff is available."
