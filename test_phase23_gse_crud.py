import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from flights.gse_service import (
    get_gse_telemetry_for_airport,
    create_gse_vehicle,
    update_gse_vehicle,
    delete_gse_vehicle,
)

def run_gse_tests():
    print("=== TESTING PYTHON GSE VEHICLE CRUD & TELEMETRY ===")

    # 1. Test Read / Auto-Seed GSE Telemetry
    telemetry = get_gse_telemetry_for_airport("AMD")
    assert telemetry is not None, "Failed to get GSE telemetry"
    fleet = telemetry.get("fleet", [])
    print(f"[OK] 1. Fetched GSE Telemetry for AMD: {len(fleet)} active vehicles.")

    # 2. Test Create GSE Vehicle
    new_gse = create_gse_vehicle({
        "id": "GSE-TEST-99",
        "vehicle": "Volvo E-Tug 500",
        "type": "Heavy Electric Pushback Tug",
        "operator": "Vikram Patel",
        "battery": 98,
        "status": "Active / Dispatch",
        "gate": "T1-G2",
        "assigned_flight": "6E 505",
        "airport_code": "AMD",
    })
    gse_id = new_gse["id"]
    print(f"[OK] 2. Created GSE Vehicle: ID = {gse_id}, Vehicle = {new_gse.get('vehicle')}")

    # 3. Test Update GSE Vehicle
    updated = update_gse_vehicle(gse_id, {
        "status": "En Route to Gate T2",
        "battery": 92,
        "operator": "Vikram Patel (Lead)",
    })
    assert updated is not None, "Update GSE failed"
    assert updated["status"] == "En Route to Gate T2", "Status update assertion failed"
    print(f"[OK] 3. Updated GSE Vehicle: Status = {updated['status']}, Battery = {updated['battery']}%")

    # 4. Test Delete GSE Vehicle
    deleted = delete_gse_vehicle(gse_id)
    assert deleted, "Delete GSE failed"
    print(f"[OK] 4. Deleted GSE Vehicle: Successfully removed {gse_id}.")

    print("\nALL PYTHON GSE CRUD & TELEMETRY TESTS PASSED!")

if __name__ == "__main__":
    run_gse_tests()
