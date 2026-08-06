import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from flights.mongo_operations import (
    create_flight,
    get_flight_by_id,
    update_flight,
    delete_flight,
    get_all_flights,
)

def run_tests():
    print("=== TESTING PYTHON FLIGHT CRUD & OPERATIONS ===")
    
    # 1. Test Create Flight
    new_flight_data = {
        "callsign": "6E 999",
        "tailNumber": "VT-TEST99",
        "aircraftType": "A321neo",
        "route": "AMD -> DEL",
        "airline": "IndiGo",
        "airport_code": "AMD",
        "status": "scheduled",
        "arrival_time": "2026-08-06T15:00:00Z",
        "departure_time": "2026-08-06T16:30:00Z",
    }
    flight = create_flight(new_flight_data)
    flight_id = flight["_id"]
    print(f"[OK] 1. Created Flight in Python backend: ID = {flight_id}, Callsign = {flight.get('callsign')}")
    
    # 2. Test Get Flight By ID
    fetched = get_flight_by_id(flight_id)
    assert fetched is not None, "Failed to retrieve flight"
    print(f"[OK] 2. Retrieved Flight: {fetched['callsign']} ({fetched['route']})")
    
    # 3. Test Update Flight Details
    updated = update_flight(flight_id, {
        "status": "in_progress",
        "route": "AMD -> BOM",
        "tailNumber": "VT-UPDATED99"
    })
    assert updated["status"] == "in_progress", "Status update failed"
    assert updated["route"] == "AMD -> BOM", "Route update failed"
    print(f"[OK] 3. Updated Flight Details: Route={updated['route']}, Status={updated['status']}")
    
    # 4. Test Search & Filter logic in Python
    all_flights = get_all_flights()
    filtered_indigo = [f for f in all_flights if f.get("airline") == "IndiGo" or "6E" in (f.get("callsign") or "")]
    filtered_amd = [f for f in all_flights if f.get("airport_code") == "AMD" or "AMD" in (f.get("route") or "")]
    print(f"[OK] 4. Python Search & Filtering: Found {len(all_flights)} total flights, {len(filtered_indigo)} IndiGo flights, {len(filtered_amd)} AMD airport flights.")
    
    # 5. Test Delete Flight
    success = delete_flight(flight_id)
    assert success, "Flight deletion failed"
    deleted_check = get_flight_by_id(flight_id)
    assert deleted_check is None, "Flight should no longer exist after deletion"
    print(f"[OK] 5. Deleted Flight: Successfully removed {flight_id} from MongoDB.")
    
    print("\nALL PYTHON FLIGHT CRUD & SEARCH/FILTER TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
