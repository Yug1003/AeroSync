import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from db.mongo_client import db
from flights.mongo_operations import create_aircraft, create_flight

User = get_user_model()

def test_phase7():
    print("--- Testing Phase 7: JWT Authentication & Role Permissions ---")
    client = APIClient()

    # Clear Django Users and Mongo database
    User.objects.all().delete()
    db["flights"].delete_many({})
    db["aircraft"].delete_many({})

    # 1. Create Admin User & Ground Crew User
    admin_user = User.objects.create_superuser(username="admin_user", password="adminpassword", role="admin")
    crew_user = User.objects.create_user(username="crew_user", password="crewpassword", role="ground_crew")
    print(f"Created Admin user: {admin_user.username} ({admin_user.role})")
    print(f"Created Crew user: {crew_user.username} ({crew_user.role})")

    # 2. Login as Ground Crew via /api/auth/login/
    login_crew = client.post("/api/auth/login/", {"username": "crew_user", "password": "crewpassword"}, format="json")
    assert login_crew.status_code == 200
    crew_token = login_crew.data["access"]
    print("Obtained JWT Access Token for Ground Crew")

    # 3. Login as Admin via /api/auth/login/
    login_admin = client.post("/api/auth/login/", {"username": "admin_user", "password": "adminpassword"}, format="json")
    assert login_admin.status_code == 200
    admin_token = login_admin.data["access"]
    print("Obtained JWT Access Token for Admin")

    # 4. Create dummy flight in Mongo
    aircraft = create_aircraft({"tail_number": "N999TEST", "airline": "TestAir", "aircraft_type": "A320", "passenger_capacity": 150})
    flight = create_flight({"aircraft_id": aircraft["_id"], "arrival_time": "2026-07-25T10:00:00Z", "departure_time": "2026-07-25T12:00:00Z"})
    flight_id = flight["_id"]
    print(f"Created Flight for testing deletion: {flight_id}")

    # 5. Try DELETE flight as Ground Crew (Should fail with 403 Forbidden)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {crew_token}")
    res_crew = client.delete(f"/api/flights/{flight_id}/")
    print("Ground Crew DELETE Flight Status Code:", res_crew.status_code)
    print("Ground Crew DELETE Response:", res_crew.data)
    assert res_crew.status_code == 403

    # 6. Try DELETE flight as Admin (Should succeed with 200 OK)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    res_admin = client.delete(f"/api/flights/{flight_id}/")
    print("Admin DELETE Flight Status Code:", res_admin.status_code)
    print("Admin DELETE Response:", res_admin.data)
    assert res_admin.status_code == 200
    assert "deleted successfully" in res_admin.data["message"]

    print("\nPhase 7 JWT Auth & Role permission tests passed successfully!")

if __name__ == "__main__":
    test_phase7()
