from datetime import datetime
from django.db.models import Q
from flights.models import Aircraft, Flight

def _format_aircraft(ac):
    if not ac:
        return None
    return {
        "_id": str(ac.id),
        "id": str(ac.id),
        "callsign": ac.callsign,
        "tail_number": ac.tail_number,
        "tailNumber": ac.tail_number,
        "aircraft_type": ac.aircraft_type,
        "aircraftType": ac.aircraft_type,
        "airline": ac.airline,
        "airport_code": ac.airport_code,
    }

def _format_flight(f):
    if not f:
        return None
    return {
        "_id": str(f.id),
        "id": str(f.id),
        "callsign": f.callsign,
        "airline": f.airline,
        "tailNumber": f.tail_number,
        "tail_number": f.tail_number,
        "aircraftType": f.aircraft_type,
        "aircraft_type": f.aircraft_type,
        "route": f.route,
        "gate_id": str(f.gate_id) if f.gate_id else None,
        "aircraft_id": str(f.aircraft_id) if f.aircraft_id else None,
        "arrival_time": f.arrival_time.isoformat() if f.arrival_time else None,
        "departure_time": f.departure_time.isoformat() if f.departure_time else None,
        "status": f.status,
        "airport_code": f.airport_code,
    }

def create_aircraft(data):
    tail_number = data.get("tail_number") or data.get("tailNumber")
    callsign = data.get("callsign", "AIR")
    airline = data.get("airline", "IndiGo")
    aircraft_type = data.get("aircraft_type") or data.get("aircraftType", "A320neo")
    airport_code = data.get("airport_code", "AMD")
    ac_id = data.get("_id") or data.get("id")

    ac_kwargs = {
        "callsign": callsign,
        "tail_number": tail_number,
        "airline": airline,
        "aircraft_type": aircraft_type,
        "airport_code": airport_code,
    }
    if ac_id:
        ac_kwargs["id"] = str(ac_id)

    ac = Aircraft.objects.create(**ac_kwargs)
    return _format_aircraft(ac)

def get_aircraft_by_id(aircraft_id):
    try:
        ac = Aircraft.objects.get(id=str(aircraft_id))
        return _format_aircraft(ac)
    except Aircraft.DoesNotExist:
        return None

def create_flight(data):
    arr = data.get("arrival_time") or datetime.now()
    dep = data.get("departure_time") or datetime.now()
    if isinstance(arr, str):
        arr = datetime.fromisoformat(arr.replace("Z", "+00:00"))
    if isinstance(dep, str):
        dep = datetime.fromisoformat(dep.replace("Z", "+00:00"))

    fl_id = data.get("_id") or data.get("id")
    fl_kwargs = {
        "callsign": data.get("callsign", "6E-101"),
        "airline": data.get("airline", "IndiGo"),
        "tail_number": data.get("tailNumber") or data.get("tail_number", "VT-AIR"),
        "aircraft_type": data.get("aircraftType") or data.get("aircraft_type", "A320neo"),
        "route": data.get("route", "AMD ✈️ DEL"),
        "gate_id": str(data.get("gate_id")) if data.get("gate_id") else None,
        "aircraft_id": str(data.get("aircraft_id")) if data.get("aircraft_id") else None,
        "arrival_time": arr,
        "departure_time": dep,
        "status": data.get("status", "scheduled"),
        "airport_code": data.get("airport_code", "AMD"),
    }
    if fl_id:
        fl_kwargs["id"] = str(fl_id)

    flight = Flight.objects.create(**fl_kwargs)
    return _format_flight(flight)

def update_flight(flight_id, update_fields):
    try:
        flight = Flight.objects.get(id=str(flight_id))
        for key, val in update_fields.items():
            if key == "gate_id":
                flight.gate_id = str(val) if val else None
            elif key == "aircraft_id":
                flight.aircraft_id = str(val) if val else None
            elif key in ["tailNumber", "tail_number"]:
                flight.tail_number = val
            elif key in ["aircraftType", "aircraft_type"]:
                flight.aircraft_type = val
            elif key in ["arrival_time", "departure_time"]:
                if isinstance(val, str):
                    val = datetime.fromisoformat(val.replace("Z", "+00:00"))
                setattr(flight, key, val)
            elif hasattr(flight, key):
                setattr(flight, key, val)
        flight.save()
        return _format_flight(flight)
    except Flight.DoesNotExist:
        return None

def get_flight_by_id(flight_id):
    try:
        flight = Flight.objects.get(id=str(flight_id))
        return _format_flight(flight)
    except Flight.DoesNotExist:
        return None

def get_all_flights(airport_code=None):
    qs = Flight.objects.all()
    if airport_code:
        code = airport_code.upper()
        qs = qs.filter(Q(airport_code=code) | Q(route__icontains=code))

    return [_format_flight(f) for f in qs]

def update_flight_status(flight_id, status):
    return update_flight(flight_id, {"status": status})

def update_flight_gate(flight_id, gate_id):
    return update_flight(flight_id, {"gate_id": gate_id})

def delete_flight(flight_id):
    try:
        flight = Flight.objects.get(id=str(flight_id))
        flight.delete()
        return True
    except Flight.DoesNotExist:
        return False

def get_all_aircraft():
    return [_format_aircraft(ac) for ac in Aircraft.objects.all()]




