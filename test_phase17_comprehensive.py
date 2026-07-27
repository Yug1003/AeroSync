import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from rest_framework.test import APIClient
from flights.mongo_operations import get_all_flights
from tasks.mongo_operations import get_tasks_by_flight

def test_phase17():
    print("--- Testing Phase 17 Comprehensive Edge Cases ---")
    client = APIClient()

    # 1. Missing required fields on flight creation
    res1 = client.post("/api/flights/", {}, format="json")
    print("1. Missing fields on flight creation status:", res1.status_code)
    assert res1.status_code == 400

    # 2. Invalid-format flight_id on lookup/depart endpoint
    res2 = client.post("/api/flights/invalid-id-format/depart/")
    print("2. Invalid flight_id format status:", res2.status_code)
    assert res2.status_code == 400
    assert "Invalid flight_id format" in res2.data["error"]

    # 3. Calling depart twice on an already-departed flight
    flights = get_all_flights()
    departed_flight = [f for f in flights if f.get("status") == "departed"][0]
    res3 = client.post(f"/api/flights/{departed_flight['_id']}/depart/")
    print("3. Calling depart twice status:", res3.status_code)
    assert res3.status_code == 400
    assert "already departed" in res3.data["error"]

    # 4. Accessing protected endpoint with an invalid JWT token
    client.credentials(HTTP_AUTHORIZATION="Bearer invalid_jwt_token_12345")
    res4 = client.delete(f"/api/flights/{departed_flight['_id']}/")
    print("4. Invalid JWT token status:", res4.status_code)
    assert res4.status_code == 401

    print("\nPhase 17 Comprehensive edge case tests passed successfully!")

if __name__ == "__main__":
    test_phase17()
