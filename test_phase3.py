from datetime import datetime, timedelta, timezone
from db.mongo_client import db
from gates.mongo_operations import create_gate, update_gate_status
from flights.mongo_operations import create_aircraft, create_flight
from gates.services import has_conflict, find_free_gate

def test_phase3():
    print("--- Testing Phase 3 Gate Conflict-Detection Algorithm ---")
    
    # Clean up test collections for clean run
    db["gates"].delete_many({})
    db["flights"].delete_many({})
    db["aircraft"].delete_many({})

    # 1. Create 3 gates
    gate1 = create_gate({"label": "Gate 1", "status": "available"})
    gate2 = create_gate({"label": "Gate 2", "status": "available"})
    gate3 = create_gate({"label": "Gate 3", "status": "maintenance"})
    print(f"Created gates: {gate1['label']} ({gate1['_id']}), {gate2['label']} ({gate2['_id']}), {gate3['label']} ({gate3['_id']} - maintenance)")

    # 2. Create Aircraft and Flight occupying Gate 1 from 10:00 to 12:00 UTC
    aircraft = create_aircraft({"tail_number": "N555AA", "airline": "Delta", "aircraft_type": "A320", "passenger_capacity": 150})
    base_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    
    flight1_arrival = base_time + timedelta(hours=10)
    flight1_departure = base_time + timedelta(hours=12)
    
    flight1 = create_flight({
        "aircraft_id": aircraft["_id"],
        "arrival_time": flight1_arrival,
        "departure_time": flight1_departure,
        "gate_id": gate1["_id"],
        "status": "scheduled"
    })
    print(f"\nCreated Flight 1 on {gate1['label']} for interval: {flight1_arrival.strftime('%H:%M')} to {flight1_departure.strftime('%H:%M')}")

    # 3. Test find_free_gate for an overlapping window: 11:00 to 13:00 UTC
    overlap_arrival = base_time + timedelta(hours=11)
    overlap_departure = base_time + timedelta(hours=13)
    
    print(f"\nSearching free gate for overlapping interval: {overlap_arrival.strftime('%H:%M')} to {overlap_departure.strftime('%H:%M')}")
    free_gate = find_free_gate(overlap_arrival, overlap_departure)
    print("Assigned free gate:", free_gate["label"] if free_gate else None)
    assert free_gate is not None and free_gate["_id"] == gate2["_id"], "Should assign Gate 2 (Gate 1 busy, Gate 3 maintenance)"

    # 4. Now occupy Gate 2 during that same window as well
    flight2 = create_flight({
        "aircraft_id": aircraft["_id"],
        "arrival_time": overlap_arrival,
        "departure_time": overlap_departure,
        "gate_id": gate2["_id"],
        "status": "scheduled"
    })
    print(f"Created Flight 2 on {gate2['label']} for interval: {overlap_arrival.strftime('%H:%M')} to {overlap_departure.strftime('%H:%M')}")

    # 5. Search for free gate for an interval overlapping BOTH Gate 1 and Gate 2: 11:30 to 12:30 UTC
    busy_arrival = base_time + timedelta(hours=11, minutes=30)
    busy_departure = base_time + timedelta(hours=12, minutes=30)
    
    print(f"\nSearching free gate for fully booked interval: {busy_arrival.strftime('%H:%M')} to {busy_departure.strftime('%H:%M')}")
    no_gate = find_free_gate(busy_arrival, busy_departure)
    print("Assigned free gate:", no_gate["label"] if no_gate else None)
    assert no_gate is None, "Should return None when all gates are occupied/maintenance"

    print("\nPhase 3 tests passed successfully!")

if __name__ == "__main__":
    test_phase3()
