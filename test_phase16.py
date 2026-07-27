import os
import django
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from django.core.management import call_command
from rest_framework.test import APIClient
from db.mongo_client import db
from flights.mongo_operations import create_aircraft, create_flight
from tasks.mongo_operations import create_tasks_for_flight
from notifications.models import Notification

def test_phase16():
    print("--- Testing Phase 16 Notifications & Overdue Tasks Management Command ---")
    client = APIClient()

    # Clear Mongo collections & Notification table
    db["flights"].delete_many({})
    db["tasks"].delete_many({})
    db["aircraft"].delete_many({})
    Notification.objects.all().delete()

    # 1. Create a flight in the past (overdue arrival & departure)
    now = datetime.now(timezone.utc)
    aircraft = create_aircraft({"tail_number": "N777OVER", "airline": "PastAir", "aircraft_type": "B737", "passenger_capacity": 150})
    flight = create_flight({
        "aircraft_id": aircraft["_id"],
        "arrival_time": (now - timedelta(hours=4)),
        "departure_time": (now - timedelta(hours=2)), # 2 hours past!
        "status": "scheduled"
    })
    
    # Create 4 tasks for this past flight
    tasks = create_tasks_for_flight(flight["_id"])
    print(f"Created flight {flight['_id']} in the past with {len(tasks)} tasks.")

    # 2. Run check_overdue_tasks management command manually
    print("\nExecuting management command 'check_overdue_tasks'...")
    call_command("check_overdue_tasks")

    # Verify notifications created (should be 4 notifications for 4 pending tasks)
    notifs = Notification.objects.filter(notification_type="overdue_task")
    print(f"Notifications created count: {notifs.count()}")
    assert notifs.count() == 4

    # 3. Test Duplicate Prevention: Run check_overdue_tasks a SECOND time
    print("\nExecuting management command 'check_overdue_tasks' a SECOND time (Duplicate Check)...")
    call_command("check_overdue_tasks")
    assert Notification.objects.filter(notification_type="overdue_task").count() == 4
    print("Duplicate prevention verified! Still exactly 4 notifications.")

    # 4. Fetch notifications via GET /api/notifications/
    res_list = client.get("/api/notifications/")
    print("\nGET /api/notifications/ Status Code:", res_list.status_code)
    print("Notifications Count:", len(res_list.data))
    assert res_list.status_code == 200
    assert len(res_list.data) == 4

    # 5. Mark first notification as read via PATCH /api/notifications/<id>/
    first_id = res_list.data[0]["id"]
    res_patch = client.patch(f"/api/notifications/{first_id}/", {"is_read": True}, format="json")
    print(f"\nMarking notification {first_id} as read:")
    print("Status Code:", res_patch.status_code)
    print("Response Data:", res_patch.data)
    assert res_patch.status_code == 200
    assert res_patch.data["is_read"] is True

    print("\nPhase 16 Notifications tests passed successfully!")

if __name__ == "__main__":
    test_phase16()
