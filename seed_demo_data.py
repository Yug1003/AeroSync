import os
import django
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from db.mongo_client import db
from gates.mongo_operations import create_gate
from flights.mongo_operations import create_aircraft, create_flight
from tasks.mongo_operations import create_tasks_for_flight, update_task_status, update_task_assignment
from staff_app.mongo_operations import create_staff
from incidents.mongo_operations import create_incident
from weather.mongo_operations import update_weather
from auditlog.models import AuditLog
from auditlog.utils import log_action
from notifications.models import Notification
from django.core.management import call_command


def seed_ahmedabad():
    print("--- Seeding Real-World Data for Sardar Vallabhbhai Patel International Airport, Ahmedabad (AMD / VAAH) ---")

    # 1. Clear Mongo collections & ORM tables
    db["gates"].delete_many({})
    db["aircraft"].delete_many({})
    db["flights"].delete_many({})
    db["tasks"].delete_many({})
    db["staff"].delete_many({})
    db["incidents"].delete_many({})
    db["weather"].delete_many({})
    AuditLog.objects.all().delete()
    Notification.objects.all().delete()

    # 2. Seed Ahmedabad Gates (Terminal 1 Domestic & Terminal 2 International)
    gate_data = [
        {"label": "T1-A1", "status": "available"},
        {"label": "T1-A2", "status": "available"},
        {"label": "T1-A3", "status": "available"},
        {"label": "T1-B1", "status": "available"},
        {"label": "T2-INT1", "status": "available"},
        {"label": "T2-INT2", "status": "maintenance"},
    ]
    created_gates = [create_gate(g) for g in gate_data]
    print(f"Created {len(created_gates)} Ahmedabad Gates (Terminal 1 & 2).")

    # 3. Seed Real-World Fleet Operating at Ahmedabad (AMD)
    aircraft_data = [
        {"tail_number": "VT-IFH", "airline": "IndiGo", "aircraft_type": "Airbus A320neo", "passenger_capacity": 186},
        {"tail_number": "VT-EXN", "airline": "Air India", "aircraft_type": "Airbus A320-200", "passenger_capacity": 162},
        {"tail_number": "VT-YAB", "airline": "Akasa Air", "aircraft_type": "Boeing 737 MAX 8", "passenger_capacity": 189},
        {"tail_number": "VT-SGK", "airline": "SpiceJet", "aircraft_type": "Boeing 737-800", "passenger_capacity": 189},
        {"tail_number": "VT-TNC", "airline": "Vistara", "aircraft_type": "Airbus A320neo", "passenger_capacity": 164},
        {"tail_number": "A6-EBC", "airline": "Emirates", "aircraft_type": "Boeing 777-300ER", "passenger_capacity": 354},
        {"tail_number": "9V-SHD", "airline": "Singapore Airlines", "aircraft_type": "Airbus A350-900", "passenger_capacity": 303},
    ]
    created_aircraft = [create_aircraft(a) for a in aircraft_data]
    print(f"Created {len(created_aircraft)} Real-World Aircraft.")

    # 4. Seed Ground Crew Staff at AMD
    now_utc = datetime.now(timezone.utc)
    shift_start = now_utc - timedelta(hours=12)
    shift_end = now_utc + timedelta(hours=24)

    staff_data = [
        {"name": "Patel Rajesh (Ramp Lead)", "department": "fuel", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
        {"name": "Shah Amit (Baggage Handling)", "department": "baggage", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
        {"name": "Joshi Priyanshu (Cabin Ops)", "department": "cleaning", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
        {"name": "Mehta Sneha (Catering Supervisor)", "department": "catering", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
        {"name": "Rathod Vikram (Fuel Ops)", "department": "fuel", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
        {"name": "Desai Pooja (Cabin Cleaning)", "department": "cleaning", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
        {"name": "Parmar Hardik (Ramp Marshal)", "department": "baggage", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
    ]
    created_staff = [create_staff(s) for s in staff_data]
    print(f"Created {len(created_staff)} AMD Ground Operations Staff.")

    # 5. Real-Time Dynamic Flight Schedule for Ahmedabad (AMD)
    # Schedule flights relative to current real-time UTC timestamp
    routes = [
        ("6E 214", "AMD -> DEL (New Delhi)"),
        ("AI 011", "BOM (Mumbai) -> AMD"),
        ("QP 1102", "AMD -> BLR (Bengaluru)"),
        ("SG 531", "AMD -> JAI (Jaipur)"),
        ("UK 945", "AMD -> CCU (Kolkata)"),
        ("EK 539", "AMD -> DXB (Dubai Int)"),
        ("SQ 531", "AMD -> SIN (Singapore)"),
        ("6E 6108", "HYD (Hyderabad) -> AMD"),
        ("AI 472", "AMD -> MAA (Chennai)"),
        ("QP 1341", "GOI (Goa) -> AMD"),
    ]

    created_flights = []
    
    # 15 Historical & Upcoming Real-World Flight Slots relative to NOW
    time_offsets = [
        -36, -30, -24, -18, -12, -6, -4, -2,
        0.5, 1.5, 3.0, 4.5, 6.0, 8.0, 12.0
    ]

    for idx, offset in enumerate(time_offsets):
        ac = created_aircraft[idx % len(created_aircraft)]
        gate = created_gates[idx % 5] # Distribute across 5 active AMD gates
        route_code, route_name = routes[idx % len(routes)]

        arr_time = now_utc + timedelta(hours=offset)
        dep_time = arr_time + timedelta(hours=2)

        if offset < -2:
            status = "departed"
        elif offset <= 0.5:
            status = "in_progress"
        elif idx % 4 == 0:
            status = "delayed"
        else:
            status = "scheduled"

        flight = create_flight({
            "aircraft_id": ac["_id"],
            "arrival_time": arr_time,
            "departure_time": dep_time,
            "gate_id": gate["_id"],
            "status": status,
        })
        created_flights.append(flight)

        # Generate 4 Turnaround Tasks
        tasks = create_tasks_for_flight(flight["_id"])

        if status == "departed":
            for t in tasks:
                update_task_status(t["_id"], "completed")
                dept_staff = [s for s in created_staff if s["department"] in t["task_type"]]
                if dept_staff:
                    update_task_assignment(t["_id"], dept_staff[0]["_id"])

        log_action(None, "create_flight", "Flight", flight["_id"], {"route": route_name, "tail_number": ac["tail_number"]})

    print(f"Created {len(created_flights)} Real-Time Synchronized Flights for Ahmedabad Airport (AMD).")

    # 6. Real-World Incidents for Ahmedabad (AMD)
    incidents_data = [
        {"description": "Baggage carousel 2 motor trip at Terminal 1 Arrivals", "priority": "medium", "status": "open", "flight_id": created_flights[1]["_id"]},
        {"description": "Fuel hydrant coupling pressure valve check at Gate T2-INT1", "priority": "low", "status": "resolved", "flight_id": created_flights[5]["_id"]},
        {"description": "Bird strike inspection required on Runway 23 after EK 539 departure", "priority": "high", "status": "open", "flight_id": None},
    ]
    for inc in incidents_data:
        inc_doc = create_incident(inc)
        log_action(None, "create_incident", "Incident", inc_doc["_id"], {"priority": inc["priority"]})
    print(f"Created {len(incidents_data)} AMD Safety & Ops Incidents.")

    # 7. Real-Time Ahmedabad Airport METAR Weather Condition
    update_weather({
        "condition": "Ahmedabad (AMD) - Clear / Haze ☀️",
        "temp_c": 33,
        "wind_speed_kts": 12,
        "visibility_miles": 6.0,
        "severity": "clear",
    })
    print("Updated Real-World Ahmedabad METAR Weather Condition.")

    # 8. Check Overdue Tasks
    call_command("check_overdue_tasks")

    print("\n--- Ahmedabad Airport (AMD / VAAH) Seed Refresh Complete! ---")

if __name__ == "__main__":
    seed_ahmedabad()
