import os
import django
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from rest_framework.test import APIClient
from db.mongo_client import db
from flights.mongo_operations import create_aircraft, create_flight
from weather.mongo_operations import get_current_weather
from notifications.models import Notification
from auditlog.models import AuditLog

def test_phase21_weather():
    print("--- Testing Phase 21 Weather Operations & Automated Delay Engine ---")
    client = APIClient()

    # Clear Mongo flights & weather collections
    db["flights"].delete_many({})
    db["weather"].delete_many({})
    Notification.objects.all().delete()
    AuditLog.objects.all().delete()

    # 1. Fetch default weather via GET /api/weather/
    res1 = client.get("/api/weather/")
    print("Default Weather Status Code:", res1.status_code)
    print("Default Weather:", res1.data["condition"].encode('utf-8', 'ignore').decode('ascii', 'ignore'))
    assert res1.status_code == 200
    assert res1.data["severity"] == "clear"

    # 2. Create a scheduled flight
    now = datetime.now(timezone.utc)
    ac = create_aircraft({"tail_number": "N999WX", "airline": "WeatherAir", "aircraft_type": "A320", "passenger_capacity": 180})
    flight = create_flight({
        "aircraft_id": ac["_id"],
        "arrival_time": now + timedelta(hours=1),
        "departure_time": now + timedelta(hours=3),
        "status": "scheduled",
    })
    print(f"Created scheduled flight {flight['_id']}")

    # 3. Simulate severe weather (Thunderstorm ⛈️) via POST /api/weather/
    payload = {
        "condition": "Severe Thunderstorm ⛈️",
        "temp_c": 18,
        "wind_speed_kts": 42,
        "visibility_miles": 0.5,
        "severity": "severe",
    }
    res2 = client.post("/api/weather/", payload, format="json")
    print("\nUpdate Weather Status Code:", res2.status_code)
    print("Automated Delays Applied:", res2.data["automated_delays_applied"])
    assert res2.status_code == 200
    assert res2.data["automated_delays_applied"] == 1

    # 4. Verify flight status in MongoDB updated to delayed
    fl_check = client.get("/api/flights/")
    target_flight = [f for f in fl_check.data if f["_id"] == flight["_id"]][0]
    print("Updated Flight Status:", target_flight["status"])
    assert target_flight["status"] == "delayed"

    # 5. Verify AuditLog and Notification entries created
    assert AuditLog.objects.filter(action="weather_delay").exists()
    assert Notification.objects.filter(notification_type="gate_conflict").exists()
    print("AuditLog & Weather Alert Notification verified!")

    # 6. Restore demo seed dataset so dashboard remains populated
    from seed_demo_data import seed
    seed()

    print("\nPhase 21 Weather Operations tests passed successfully!")

if __name__ == "__main__":
    test_phase21_weather()
