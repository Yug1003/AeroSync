import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from rest_framework.test import APIClient
from db.mongo_client import db
from gates.mongo_operations import create_gate, get_gate_by_id
from flights.mongo_operations import create_aircraft, get_flight_by_id
from datetime import datetime, timedelta, timezone

def test_phase5():
    print("--- Testing Phase 5: Task Status Updates + Pushback Gating ---")
    client = APIClient()

    # Clean database
    db["gates"].delete_many({})
    db["flights"].delete_many({})
    db["aircraft"].delete_many({})
    db["tasks"].delete_many({})

    # 1. Seed Aircraft and Gate
    aircraft = create_aircraft({"tail_number": "N888DL", "airline": "Delta", "aircraft_type": "A350", "passenger_capacity": 300})
    gate = create_gate({"label": "Gate B4", "status": "available"})
    
    # 2. Create Flight (POST /api/flights/) -> gets 4 auto-created tasks
    now = datetime.now(timezone.utc).replace(microsecond=0)
    arr_time = (now + timedelta(hours=1)).isoformat()
    dep_time = (now + timedelta(hours=3)).isoformat()
    
    create_res = client.post("/api/flights/", {
        "aircraft_id": aircraft["_id"],
        "arrival_time": arr_time,
        "departure_time": dep_time
    }, format="json")
    
    assert create_res.status_code == 201
    flight_id = create_res.data["_id"]
    print("Step 1: Created Flight:", flight_id)
    print("Assigned Gate Status:", get_gate_by_id(gate["_id"])["status"])

    # 3. Call Depart Immediately (POST /api/flights/<id>/depart/) -> Should FAIL with 400 listing 4 pending tasks
    print("\nStep 2: Calling Depart immediately (before completing tasks)...")
    depart_res1 = client.post(f"/api/flights/{flight_id}/depart/")
    print("Depart Response Status:", depart_res1.status_code)
    print("Depart Response Data:", depart_res1.data)
    assert depart_res1.status_code == 400
    assert "error" in depart_res1.data
    assert len(depart_res1.data["incomplete_tasks"]) == 4

    # 4. Fetch Tasks (GET /api/tasks/?flight_id=<id>)
    tasks_res = client.get(f"/api/tasks/?flight_id={flight_id}")
    print("\nStep 3: Fetched tasks for flight:")
    tasks = tasks_res.data
    for t in tasks:
        print(f" - Task ID: {t['_id']} | Type: {t['task_type']} | Status: {t['status']}")

    # 5. PATCH all 4 tasks to status='completed' one by one
    print("\nStep 4: PATCHing all 4 tasks to status='completed'...")
    for t in tasks:
        patch_res = client.patch(f"/api/tasks/{t['_id']}/", {"status": "completed"}, format="json")
        print(f" - Completed Task {t['task_type']} ({t['_id']}): Status Code {patch_res.status_code}")
        assert patch_res.status_code == 200

    # 6. Call Depart again -> Should SUCCEED
    print("\nStep 5: Calling Depart again (all tasks completed)...")
    depart_res2 = client.post(f"/api/flights/{flight_id}/depart/")
    print("Depart Response Status:", depart_res2.status_code)
    print("Depart Response Data:", depart_res2.data)
    assert depart_res2.status_code == 200
    assert depart_res2.data["flight"]["status"] == "departed"
    
    # Verify Gate is back to available
    updated_gate = get_gate_by_id(gate["_id"])
    print("Final Gate Status:", updated_gate["status"])
    assert updated_gate["status"] == "available"

    print("\nPhase 5 tests passed successfully!")

if __name__ == "__main__":
    test_phase5()
