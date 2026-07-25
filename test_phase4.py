import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from rest_framework.test import APIClient
from db.mongo_client import db
from gates.mongo_operations import create_gate
from flights.mongo_operations import create_aircraft
from tasks.mongo_operations import get_tasks_by_flight
from datetime import datetime, timedelta, timezone

def test_phase4():
    print("--- Testing Phase 4 API Endpoints ---")
    client = APIClient()

    # Clean test database
    db["gates"].delete_many({})
    db["flights"].delete_many({})
    db["aircraft"].delete_many({})
    db["tasks"].delete_many({})

    # 1. Seed 1 aircraft and 1 available gate
    aircraft = create_aircraft({"tail_number": "N707UA", "airline": "United", "aircraft_type": "B777", "passenger_capacity": 300})
    gate1 = create_gate({"label": "Gate C1", "status": "available"})
    print(f"Seeded Aircraft ID: {aircraft['_id']}")
    print(f"Seeded Gate ID: {gate1['_id']}")

    now = datetime.now(timezone.utc).replace(microsecond=0)
    arr_time = (now + timedelta(hours=1)).isoformat()
    dep_time = (now + timedelta(hours=3)).isoformat()

    # 2. Test Successful Flight Creation (POST /api/flights/)
    payload1 = {
        "aircraft_id": aircraft["_id"],
        "arrival_time": arr_time,
        "departure_time": dep_time
    }
    
    print("\nSending POST /api/flights/ (Success Scenario)...")
    res1 = client.post("/api/flights/", payload1, format="json")
    print("Response Status Code:", res1.status_code)
    print("Response Data:", res1.data)
    
    assert res1.status_code == 201
    flight_id = res1.data["_id"]
    assert res1.data["gate_id"] == gate1["_id"]

    # Verify 4 tasks were auto-created
    flight_tasks = get_tasks_by_flight(flight_id)
    print(f"\nAuto-created tasks count for flight {flight_id}: {len(flight_tasks)}")
    for t in flight_tasks:
        print(" - Task:", t["task_type"], "| Status:", t["status"])
    assert len(flight_tasks) == 4

    # 3. Test Overlapping Window (400 Conflict Scenario)
    overlap_arr = (now + timedelta(hours=2)).isoformat()
    overlap_dep = (now + timedelta(hours=4)).isoformat()
    payload2 = {
        "aircraft_id": aircraft["_id"],
        "arrival_time": overlap_arr,
        "departure_time": overlap_dep
    }
    
    print("\nSending POST /api/flights/ (Fully Booked Scenario)...")
    res2 = client.post("/api/flights/", payload2, format="json")
    print("Response Status Code:", res2.status_code)
    print("Response Data:", res2.data)
    
    assert res2.status_code == 400
    assert "error" in res2.data

    # 4. Test GET /api/flights/ and GET /api/gates/
    print("\nTesting GET /api/flights/...")
    res_flights = client.get("/api/flights/")
    print(f"Status: {res_flights.status_code}, Flights Count: {len(res_flights.data)}")

    print("\nTesting GET /api/gates/...")
    res_gates = client.get("/api/gates/")
    print(f"Status: {res_gates.status_code}, Gates Count: {len(res_gates.data)}")

    print("\nPhase 4 API tests passed successfully!")

if __name__ == "__main__":
    test_phase4()
