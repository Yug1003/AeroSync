import os
import django
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from gates.models import Gate
from flights.models import Aircraft, Flight, GSE
from staff_app.models import Staff
from tasks.models import Task
from incidents.models import Incident
from weather.models import Weather
from users.models import User

from gates.services import create_gate
from flights.services import create_aircraft, create_flight
from tasks.services import create_tasks_for_flight, update_task_status, update_task_assignment
from staff_app.services import create_staff
from incidents.services import create_incident
from weather.services import update_weather
from auditlog.models import AuditLog
from auditlog.utils import log_action
from notifications.models import Notification
from django.core.management import call_command


def seed_ahmedabad():
    print("--- Seeding Real-World Data for Sardar Vallabhbhai Patel International Airport, Ahmedabad (AMD / VAAH) ---")

    # 1. Clear Django ORM tables
    User.objects.all().delete()
    Gate.objects.all().delete()
    Aircraft.objects.all().delete()
    Flight.objects.all().delete()
    GSE.objects.all().delete()
    Staff.objects.all().delete()
    Task.objects.all().delete()
    Incident.objects.all().delete()
    Weather.objects.all().delete()
    AuditLog.objects.all().delete()
    Notification.objects.all().delete()

    # 1.5. Seed Default User Credentials (Admin & Staff)
    User.objects.create_superuser(
        username="admin",
        email="admin@aerosync.com",
        password="admin123",
        role="admin",
    )
    User.objects.create_user(
        username="staff",
        email="staff@aerosync.com",
        password="admin123",
        role="ground_crew",
    )
    print("Created Default User Credentials: admin (@admin / adminpassword123), staff (@staff / staffpassword123)")

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

    # 5. Real-World Incidents for Ahmedabad (AMD)
    incidents_data = [
        {"description": "Baggage carousel 2 motor trip at Terminal 1 Arrivals", "priority": "medium", "status": "open", "flight_id": None},
        {"description": "Fuel hydrant coupling pressure valve check at Gate T2-INT1", "priority": "low", "status": "resolved", "flight_id": None},
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
