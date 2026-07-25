import os
import django
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from rest_framework.test import APIClient
from db.mongo_client import db
from staff_app.mongo_operations import create_staff
from flights.mongo_operations import create_aircraft, create_flight
from tasks.mongo_operations import get_tasks_by_flight

def test_phase11():
    print("--- Testing Phase 11 Staff Allocation & Conflict Checking ---")
    client = APIClient()

    # Clear Mongo collections
    db["staff"].delete_many({})
    db["flights"].delete_many({})
    db["tasks"].delete_many({})
    db["aircraft"].delete_many({})

    # 1. Create Staff Members
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    shift_start = now
    shift_end = now + timedelta(hours=10)

    staff1 = create_staff({
        "name": "John Refueler",
        "department": "fuel",
        "shift_start": shift_start.isoformat(),
        "shift_end": shift_end.isoformat(),
        "is_available": True
    })
    print(f"Created Staff 1: {staff1['name']} ({staff1['_id']})")

    # 2. Create Aircraft & Flight
    aircraft = create_aircraft({"tail_number": "N555ST", "airline": "StarAir", "aircraft_type": "A320", "passenger_capacity": 150})
    flight = create_flight({
        "aircraft_id": aircraft["_id"],
        "arrival_time": now + timedelta(hours=1),
        "departure_time": now + timedelta(hours=3),
        "status": "scheduled"
    })
    
    # Create task linked to flight
    res_tasks = client.post("/api/flights/", {
        "aircraft_id": aircraft["_id"],
        "arrival_time": (now + timedelta(hours=1)).isoformat(),
        "departure_time": (now + timedelta(hours=3)).isoformat()
    }, format="json")
    
    from tasks.mongo_operations import create_tasks_for_flight
    tasks = create_tasks_for_flight(flight["_id"])
    task_id = tasks[0]["_id"]
    print(f"Testing task assignment on Task ID: {task_id}")

    # 3. Assign Staff 1 to Task (Should succeed)
    res_assign1 = client.post(f"/api/tasks/{task_id}/assign_staff/", {"staff_id": staff1["_id"]}, format="json")
    print("Assignment #1 Status:", res_assign1.status_code)
    print("Assignment #1 Response:", res_assign1.data)
    assert res_assign1.status_code == 200

    # 4. Create Flight 2 with overlapping window (02:00 to 04:00)
    flight2 = create_flight({
        "aircraft_id": aircraft["_id"],
        "arrival_time": now + timedelta(hours=2),
        "departure_time": now + timedelta(hours=4),
        "status": "scheduled"
    })
    tasks2 = get_tasks_by_flight(flight2["_id"])
    if not tasks2:
        from tasks.mongo_operations import create_tasks_for_flight
        tasks2 = create_tasks_for_flight(flight2["_id"])
    task2_id = tasks2[0]["_id"]

    # 5. Try assigning Staff 1 to second overlapping task (Should fail with 400 conflict)
    print("\nAttempting second overlapping assignment for Staff 1...")
    res_assign2 = client.post(f"/api/tasks/{task2_id}/assign_staff/", {"staff_id": staff1["_id"]}, format="json")
    print("Assignment #2 Status:", res_assign2.status_code)
    print("Assignment #2 Response:", res_assign2.data)
    assert res_assign2.status_code == 400
    assert "already assigned to a task for an overlapping flight" in res_assign2.data["error"]

    print("\nPhase 11 staff allocation tests passed successfully!")

if __name__ == "__main__":
    test_phase11()
