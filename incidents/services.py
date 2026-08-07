from incidents.models import Incident

def _format_incident(inc):
    if not inc:
        return None
    return {
        "_id": str(inc.id),
        "id": str(inc.id),
        "flight_id": str(inc.flight_id) if inc.flight_id else None,
        "description": inc.description,
        "priority": inc.priority,
        "status": inc.status,
        "reported_at": inc.reported_at.isoformat() if inc.reported_at else None,
        "airport_code": inc.airport_code,
    }

def create_incident(data):
    fl_id = data.get("flight_id")
    inc_id = data.get("_id") or data.get("id")
    inc_kwargs = {
        "description": data.get("description", "Safety Event"),
        "priority": data.get("priority", "medium"),
        "status": data.get("status", "open"),
        "flight_id": str(fl_id) if fl_id else None,
        "airport_code": data.get("airport_code", "AMD"),
    }
    if inc_id:
        inc_kwargs["id"] = str(inc_id)

    inc = Incident.objects.create(**inc_kwargs)
    return _format_incident(inc)

def get_all_incidents():
    qs = Incident.objects.all().order_by("-reported_at")
    return [_format_incident(inc) for inc in qs]

def get_incident_by_id(incident_id):
    try:
        inc = Incident.objects.get(id=str(incident_id))
        return _format_incident(inc)
    except Incident.DoesNotExist:
        return None

def update_incident_status(incident_id, status):
    try:
        inc = Incident.objects.get(id=str(incident_id))
        inc.status = status
        inc.save()
        return _format_incident(inc)
    except Incident.DoesNotExist:
        return None
