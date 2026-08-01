import os
import django
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from db.mongo_client import db
from gates.mongo_operations import create_gate, update_gate_status
from flights.mongo_operations import create_aircraft, create_flight, update_flight_status
from gates.services import find_free_gate
from tasks.mongo_operations import create_tasks_for_flight, update_task_status, update_task_assignment
from staff_app.mongo_operations import create_staff
from incidents.mongo_operations import create_incident, update_incident_status
from auditlog.models import AuditLog
from auditlog.utils import log_action
from notifications.models import Notification
from django.core.management import call_command

def seed():
    print("--- Phase 17: Comprehensive Demo Seed Data Refresh ---")
    
    # 1. Clear Mongo collections & ORM tables
    db["gates"].delete_many({})
    db["aircraft"].delete_many({})
    db["flights"].delete_many({})
    db["tasks"].delete_many({})
    db["staff"].delete_many({})
    db["incidents"].delete_many({})
    AuditLog.objects.all().delete()
    Notification.objects.all().delete()
    
    # 2. Seed 6 Gates
    gate_data = [
        {"label": "A1", "status": "available"},
        {"label": "A2", "status": "available"},
        {"label": "A3", "status": "available"},
        {"label": "B1", "status": "available"},
        {"label": "B2", "status": "available"},
        {"label": "B3", "status": "maintenance"},
    ]
    created_gates = [create_gate(g) for g in gate_data]
    print(f"Created {len(created_gates)} Gates (A1-A3, B1-B3).")

    # 3. Seed 5 Aircraft
    aircraft_data = [
        {"tail_number": "N101AA", "airline": "American Airlines", "aircraft_type": "Boeing 737-800", "passenger_capacity": 160},
        {"tail_number": "N202UA", "airline": "United Airlines", "aircraft_type": "Boeing 787-9", "passenger_capacity": 250},
        {"tail_number": "N303DL", "airline": "Delta Air Lines", "aircraft_type": "Airbus A320neo", "passenger_capacity": 150},
        {"tail_number": "N404SW", "airline": "Southwest Airlines", "aircraft_type": "Boeing 737-700", "passenger_capacity": 143},
        {"tail_number": "N505BA", "airline": "British Airways", "aircraft_type": "Airbus A350-1000", "passenger_capacity": 330},
    ]
    created_aircraft = [create_aircraft(a) for a in aircraft_data]
    print(f"Created {len(created_aircraft)} Aircraft.")

    # 4. Seed 7 Staff Members
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    shift_start = now - timedelta(hours=12)
    shift_end = now + timedelta(hours=24)

    staff_data = [
        {"name": "John Refueler", "department": "fuel", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
        {"name": "Sarah Cleaner", "department": "cleaning", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
        {"name": "Mike Baggage", "department": "baggage", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
        {"name": "Lisa Catering", "department": "catering", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
        {"name": "David Fuel", "department": "fuel", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
        {"name": "Emma Cleaner", "department": "cleaning", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
        {"name": "Alex Operations", "department": "baggage", "shift_start": shift_start, "shift_end": shift_end, "is_available": True},
    ]
    created_staff = [create_staff(s) for s in staff_data]
    print(f"Created {len(created_staff)} Staff members.")

    # 5. Seed ~25 Flights across past 3 days and next 1 day
    created_flights = []
    
    # Generate flight time slots
    slots = []
    # Past 3 days (18 flights)
    for day in range(3, 0, -1):
        for h in [2, 6, 10, 14, 18, 22]:
            arr = now - timedelta(days=day, hours=-h)
            dep = arr + timedelta(hours=2)
            slots.append((arr, dep, "past"))
    # Today & Next 1 day (7 flights)
    for h in [1, 4, 7, 10, 13, 16, 19]:
        arr = now + timedelta(hours=h)
        dep = arr + timedelta(hours=2)
        slots.append((arr, dep, "future"))

    ac_idx = 0
    for arr, dep, timeframe in slots[:25]:
        ac = created_aircraft[ac_idx % len(created_aircraft)]
        gate = created_gates[ac_idx % 5] # Distribute evenly across Gates A1, A2, A3, B1, B2
        ac_idx += 1
        
        status = "departed" if timeframe == "past" else ("scheduled" if ac_idx % 4 != 0 else "delayed")
        
        flight = create_flight({
            "aircraft_id": ac["_id"],
            "arrival_time": arr,
            "departure_time": dep,
            "gate_id": gate["_id"],
            "status": status,
        })
        created_flights.append(flight)
        
        # Create 4 tasks per flight
        tasks = create_tasks_for_flight(flight["_id"])
        
        # If flight is departed, mark all tasks completed
        if status == "departed":
            for t in tasks:
                update_task_status(t["_id"], "completed")
                # Assign a staff member
                dept_staff = [s for s in created_staff if s["department"] in t["task_type"]]
                if dept_staff:
                    update_task_assignment(t["_id"], dept_staff[0]["_id"])
        
        # Audit log for flight creation
        log_action(None, "create_flight", "Flight", flight["_id"], {"aircraft": ac["tail_number"], "gate_id": gate["_id"]})

    print(f"Created {len(created_flights)} Flights across past 3 days and next 24 hours.")

    # 6. Seed 5 Incidents
    incidents_data = [
        {"description": "Fuel truck hose pressure valve leak near Gate A1", "priority": "high", "status": "open", "flight_id": created_flights[0]["_id"]},
        {"description": "Baggage carousel belt jammed at Terminal A", "priority": "medium", "status": "resolved", "flight_id": created_flights[1]["_id"]},
        {"description": "Water service truck failure during cabin servicing", "priority": "low", "status": "open", "flight_id": None},
        {"description": "Hydraulic fluid spill on taxiway connector Bravo", "priority": "high", "status": "resolved", "flight_id": None},
        {"description": "Catering lift truck mechanical fault at Gate B2", "priority": "medium", "status": "open", "flight_id": created_flights[3]["_id"]},
    ]
    for inc in incidents_data:
        inc_doc = create_incident(inc)
        log_action(None, "create_incident", "Incident", inc_doc["_id"], {"priority": inc["priority"]})
    print(f"Created {len(incidents_data)} Incidents.")

    # 7. Run check_overdue_tasks management command to trigger realistic notifications
    call_command("check_overdue_tasks")

    print("\nPhase 17 Seed Refresh Complete!")

if __name__ == "__main__":
    seed()
