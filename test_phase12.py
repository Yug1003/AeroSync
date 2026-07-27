import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from rest_framework.test import APIClient
from db.mongo_client import db

def test_phase12():
    print("--- Testing Phase 12 Incident Management ---")
    client = APIClient()

    # Clear incidents collection
    db["incidents"].delete_many({})

    # 1. Create an incident via POST /api/incidents/
    payload = {
        "description": "Fuel leakage detected near Gate A1 during refueling",
        "priority": "high",
    }
    res1 = client.post("/api/incidents/", payload, format="json")
    print("Create Incident Status:", res1.status_code)
    print("Create Incident Response:", res1.data)
    assert res1.status_code == 201
    assert res1.data["priority"] == "high"
    assert res1.data["status"] == "open"
    incident_id = res1.data["_id"]

    # 2. Get list of incidents via GET /api/incidents/
    res2 = client.get("/api/incidents/")
    print("List Incidents Count:", len(res2.data))
    assert res2.status_code == 200
    assert len(res2.data) == 1

    # 3. Resolve incident via PATCH /api/incidents/<id>/
    res3 = client.patch(f"/api/incidents/{incident_id}/", {"status": "resolved"}, format="json")
    print("Resolve Incident Status:", res3.status_code)
    print("Resolve Incident Response:", res3.data)
    assert res3.status_code == 200
    assert res3.data["status"] == "resolved"

    print("\nPhase 12 Incident Management tests passed successfully!")

if __name__ == "__main__":
    test_phase12()
