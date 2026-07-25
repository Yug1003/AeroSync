import os
import django
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from db.mongo_client import db
from gates.mongo_operations import create_gate, update_gate_status
from flights.mongo_operations import create_aircraft, create_flight
from gates.services import find_free_gate
from tasks.mongo_operations import create_tasks_for_flight

def seed():
    print("--- Seeding Demo Data (Phase 6) ---")
    
    # Clear existing collections
    db["gates"].delete_many({})
    db["aircraft"].delete_many({})
    db["flights"].delete_many({})
    db["tasks"].delete_many({})
    
    # 1. Create 6 Gates
    gate_data = [
        {"label": "A1", "status": "available"},
        {"label": "A2", "status": "available"},
        {"label": "A3", "status": "available"},
        {"label": "B1", "status": "available"},
        {"label": "B2", "status": "available"},
        {"label": "B3", "status": "maintenance"}, # B3 set to maintenance
    ]
    created_gates = []
    for g in gate_data:
        gate = create_gate(g)
        created_gates.append(gate)
        print(f"Created Gate: {gate['label']} (ID: {gate['_id']}, Status: {gate['status']})")

    # 2. Create 5 Aircraft
    aircraft_data = [
        {"tail_number": "N101AA", "airline": "American Airlines", "aircraft_type": "Boeing 737-800", "passenger_capacity": 160},
        {"tail_number": "N202UA", "airline": "United Airlines", "aircraft_type": "Boeing 787-9", "passenger_capacity": 250},
        {"tail_number": "N303DL", "airline": "Delta Air Lines", "aircraft_type": "Airbus A320neo", "passenger_capacity": 150},
        {"tail_number": "N404SW", "airline": "Southwest Airlines", "aircraft_type": "Boeing 737-700", "passenger_capacity": 143},
        {"tail_number": "N505BA", "airline": "British Airways", "aircraft_type": "Airbus A350-1000", "passenger_capacity": 330},
    ]
    created_aircraft = []
    for a in aircraft_data:
        ac = create_aircraft(a)
        created_aircraft.append(ac)
        print(f"Created Aircraft: {ac['tail_number']} ({ac['airline']}) - ID: {ac['_id']}")

    # 3. Schedule 8 Flights across next 24 hours
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    
    flight_requests = [
        # Non-overlapping batch
        {"ac": created_aircraft[0], "arr": now + timedelta(hours=1), "dep": now + timedelta(hours=3)},
        {"ac": created_aircraft[1], "arr": now + timedelta(hours=2), "dep": now + timedelta(hours=4)},
        {"ac": created_aircraft[2], "arr": now + timedelta(hours=3), "dep": now + timedelta(hours=5)},
        {"ac": created_aircraft[3], "arr": now + timedelta(hours=4), "dep": now + timedelta(hours=6)},
        {"ac": created_aircraft[4], "arr": now + timedelta(hours=5), "dep": now + timedelta(hours=7)},
        
        # Overlapping attempts
        {"ac": created_aircraft[0], "arr": now + timedelta(hours=1, minutes=30), "dep": now + timedelta(hours=3, minutes=30)},
        {"ac": created_aircraft[1], "arr": now + timedelta(hours=2, minutes=30), "dep": now + timedelta(hours=4, minutes=30)},
        {"ac": created_aircraft[2], "arr": now + timedelta(hours=2, minutes=0), "dep": now + timedelta(hours=5, minutes=0)},
    ]

    print("\n--- Processing Flight Creation Requests ---")
    created_flights_count = 0
    failed_flights_count = 0

    for idx, req in enumerate(flight_requests, 1):
        arr = req["arr"]
        dep = req["dep"]
        ac = req["ac"]
        
        gate = find_free_gate(arr, dep)
        if gate:
            flight = create_flight({
                "aircraft_id": ac["_id"],
                "arrival_time": arr,
                "departure_time": dep,
                "gate_id": gate["_id"],
                "status": "scheduled",
            })
            update_gate_status(gate["_id"], "occupied")
            tasks = create_tasks_for_flight(flight["_id"])
            created_flights_count += 1
            print(f"Request #{idx}: SUCCESS -> Flight {flight['_id']} assigned to Gate {gate['label']} ({arr.strftime('%H:%M')} - {dep.strftime('%H:%M')}) with {len(tasks)} tasks.")
        else:
            failed_flights_count += 1
            print(f"Request #{idx}: REJECTED -> No free gate for window ({arr.strftime('%H:%M')} - {dep.strftime('%H:%M')})")

    print(f"\nSeeding Complete! Successfully created {created_flights_count} flights, rejected {failed_flights_count} due to gate conflicts.")

if __name__ == "__main__":
    seed()
