import os
import django
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from rest_framework.test import APIClient
from flights.mongo_operations import get_all_flights
from tasks.mongo_operations import get_all_tasks

def test_phase6_edgecases():
    print("--- Testing Phase 6 Edge Cases ---")
    client = APIClient()

    # Edge Case 1: Departure time before Arrival time
    now = datetime.now(timezone.utc)
    res1 = client.post("/api/flights/", {
        "aircraft_id": "6a647fdd0a6d58bd8fd41b72",
        "arrival_time": (now + timedelta(hours=5)).isoformat(),
        "departure_time": (now + timedelta(hours=2)).isoformat() # before arrival!
    }, format="json")
    print("\n1. Flight with departure < arrival response:")
    print("   Status Code:", res1.status_code)
    print("   Response Data:", res1.data)
    assert res1.status_code == 400
    assert "departure_time" in res1.data

    # Edge Case 2: Invalid ObjectId format for depart endpoint
    res2 = client.post("/api/flights/invalid-object-id/depart/")
    print("\n2. Depart with invalid ObjectId format response:")
    print("   Status Code:", res2.status_code)
    print("   Response Data:", res2.data)
    assert res2.status_code == 400
    assert "error" in res2.data

    # Edge Case 3: Valid ObjectId format but flight non-existent
    non_existent_id = "507f1f77bcf86cd799439011"
    res3 = client.post(f"/api/flights/{non_existent_id}/depart/")
    print("\n3. Depart with non-existent ObjectId response:")
    print("   Status Code:", res3.status_code)
    print("   Response Data:", res3.data)
    assert res3.status_code == 404
    assert "error" in res3.data

    # Edge Case 4: PATCH task status with invalid choice
    all_tasks = get_all_tasks()
    assert len(all_tasks) > 0
    sample_task_id = all_tasks[0]["_id"]
    res4 = client.patch(f"/api/tasks/{sample_task_id}/", {"status": "invalid_status_choice"}, format="json")
    print("\n4. PATCH task status with invalid choice response:")
    print("   Status Code:", res4.status_code)
    print("   Response Data:", res4.data)
    assert res4.status_code == 400
    assert "error" in res4.data

    print("\nAll Phase 6 edge cases verified successfully!")

if __name__ == "__main__":
    test_phase6_edgecases()
