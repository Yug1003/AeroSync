from datetime import datetime, timezone
from flights.models import Flight
from gates.models import Gate

def _format_gate(g):
    if not g:
        return None
    return {
        "_id": str(g.id),
        "id": str(g.id),
        "label": g.label,
        "status": g.status,
        "current_flight_id": str(g.current_flight_id) if g.current_flight_id else None,
    }

def create_gate(data):
    g_id = data.get("_id") or data.get("id")
    g_kwargs = {
        "label": data.get("label", "Gate 1"),
        "status": data.get("status", "available"),
        "current_flight_id": data.get("current_flight_id"),
    }
    if g_id:
        g_kwargs["id"] = str(g_id)

    gate = Gate.objects.create(**g_kwargs)
    return _format_gate(gate)

def get_all_gates():
    return [_format_gate(g) for g in Gate.objects.all()]

def get_gate_by_id(gate_id):
    try:
        g = Gate.objects.get(id=str(gate_id))
        return _format_gate(g)
    except Gate.DoesNotExist:
        return None

def update_gate_status(gate_id, status, flight_id=None):
    try:
        g = Gate.objects.get(id=str(gate_id))
        g.status = status
        if flight_id is not None:
            g.current_flight_id = str(flight_id) if flight_id else None
        g.save()
        return _format_gate(g)
    except Gate.DoesNotExist:
        return None

def _ensure_datetime(dt):
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
    if isinstance(dt, datetime) and dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def has_conflict(gate_id, arrival_time, departure_time, exclude_flight_id=None):
    arrival_dt = _ensure_datetime(arrival_time)
    departure_dt = _ensure_datetime(departure_time)

    qs = Flight.objects.filter(gate_id=str(gate_id)).exclude(status="departed")
    if exclude_flight_id:
        qs = qs.exclude(id=str(exclude_flight_id))

    for flight in qs:
        ex_arrival = _ensure_datetime(flight.arrival_time)
        ex_departure = _ensure_datetime(flight.departure_time)
        if arrival_dt < ex_departure and departure_dt > ex_arrival:
            return True
    return False

def find_free_gate(arrival_time, departure_time):
    gates = get_all_gates()
    for gate in gates:
        if gate.get("status") == "maintenance":
            continue
        if not has_conflict(gate["_id"], arrival_time, departure_time):
            return gate
    return None
