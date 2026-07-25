from datetime import datetime, timedelta, timezone
from gates.mongo_operations import create_gate, get_all_gates, get_gate_by_id, update_gate_status
from flights.mongo_operations import create_aircraft, get_aircraft_by_id, create_flight, get_flight_by_id, get_all_flights
from tasks.mongo_operations import create_task, get_tasks_by_flight, update_task_status, get_task_by_id

def test_phase2():
    print("--- Testing Phase 2 PyMongo Operations ---")
    
    # 1. Gate operations
    gate = create_gate({"label": "A1", "status": "available"})
    print("Created Gate:", gate)
    
    fetched_gate = get_gate_by_id(gate["_id"])
    print("Fetched Gate by ID:", fetched_gate)
    
    updated_gate = update_gate_status(gate["_id"], "occupied")
    print("Updated Gate Status:", updated_gate)
    
    # 2. Aircraft operations
    aircraft = create_aircraft({
        "tail_number": "N123AA",
        "airline": "American Airlines",
        "aircraft_type": "Boeing 737",
        "passenger_capacity": 180
    })
    print("\nCreated Aircraft:", aircraft)
    
    fetched_aircraft = get_aircraft_by_id(aircraft["_id"])
    print("Fetched Aircraft by ID:", fetched_aircraft)
    
    # 3. Flight operations
    now = datetime.now(timezone.utc)
    flight = create_flight({
        "aircraft_id": aircraft["_id"],
        "arrival_time": now,
        "departure_time": now + timedelta(hours=2),
        "gate_id": gate["_id"]
    })
    print("\nCreated Flight:", flight)
    
    fetched_flight = get_flight_by_id(flight["_id"])
    print("Fetched Flight by ID:", fetched_flight)
    
    # 4. Task operations
    task = create_task({
        "flight_id": flight["_id"],
        "task_type": "refueling"
    })
    print("\nCreated Task:", task)
    
    tasks_for_flight = get_tasks_by_flight(flight["_id"])
    print("Fetched Tasks for Flight:", tasks_for_flight)
    
    updated_task = update_task_status(task["_id"], "delayed", delay_reason="Fuel truck delayed")
    print("Updated Task Status:", updated_task)
    
    print("\nAll Phase 2 PyMongo tests passed successfully!")

if __name__ == "__main__":
    test_phase2()
