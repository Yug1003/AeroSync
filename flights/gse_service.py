import random

# Real-world GSE Fleet Definitions for major Indian International Airports (AMD Hub Expanded to 10 Vehicles)
GSE_BASE_FLEET = {
    "AMD": [
        {"id": "GSE-FT-01", "type": "Fuel Hydrant Dispenser", "vehicle": "Volvo FL Fuel Truck", "operator": "Rajesh Kumar", "battery": 92, "status": "Active / Refueling", "gate": "T1-G1", "assigned_flight": "6E 214"},
        {"id": "GSE-BT-02", "type": "Baggage Tug & Conveyor", "vehicle": "TLD Electric Tug", "operator": "Vikram Singh", "battery": 85, "status": "Loading Baggage", "gate": "T1-G2", "assigned_flight": "AI 011"},
        {"id": "GSE-CT-03", "type": "Catering Hi-Lift", "vehicle": "Mallaghan Catering Truck", "operator": "Sanjay Patel", "battery": 78, "status": "Uploading Catering", "gate": "T2-INT1", "assigned_flight": "SQ 505"},
        {"id": "GSE-JB-04", "type": "Passenger Jetbridge", "vehicle": "ThyssenKrupp Jetbridge A", "operator": "Amit Sharma", "battery": 96, "status": "Docked at Door 1L", "gate": "T1-G3", "assigned_flight": "QP 1102"},
        {"id": "GSE-WC-05", "type": "Potable Water Service Truck", "vehicle": "Isuzu Water Bowser", "operator": "Deepak Verma", "battery": 64, "status": "Standby / Ready", "gate": "T1-G4", "assigned_flight": "SG 531"},
        {"id": "GSE-PB-06", "type": "Aircraft Pushback Tug", "vehicle": "Goldhofer AST-2 Tractor", "operator": "Sunil Mehta", "battery": 89, "status": "Pushback En Route", "gate": "T3-A12", "assigned_flight": "AI 101"},
        {"id": "GSE-CL-07", "type": "Cabin Cleaning Van", "vehicle": "Force Traveler Ops Van", "operator": "Karan Malhotra", "battery": 73, "status": "Cabin Sanitation", "gate": "T3-B22", "assigned_flight": "EK 517"},
        {"id": "GSE-AC-08", "type": "Air Conditioning Unit (ACU)", "vehicle": "TLD Air Conditioning", "operator": "Pooja Joshi", "battery": 91, "status": "Cooling Cabin", "gate": "T1-01", "assigned_flight": "6E 5021"},
        {"id": "GSE-AS-09", "type": "Air Start Unit (ASU)", "vehicle": "Rheinmetall ASU-100", "operator": "Nitin Desai", "battery": 82, "status": "Engine Start Ready", "gate": "T2-G45", "assigned_flight": "AI 130"},
        {"id": "GSE-LU-10", "type": "Lavatory Service Truck", "vehicle": "Scania Waste Service", "operator": "Anil Rao", "battery": 77, "status": "Servicing Lavatories", "gate": "T2-G47", "assigned_flight": "LH 757"},
    ],
    "DEL": [
        {"id": "GSE-DEL-01", "type": "Heavy Aircraft Pushback Tug", "vehicle": "Goldhofer AST-1X (Widebody)", "operator": "Deepak Verma", "battery": 95, "status": "Pushback Ready", "gate": "T3-A12", "assigned_flight": "AI 101"},
        {"id": "GSE-DEL-02", "type": "Fuel Hydrant Super-Truck", "vehicle": "Mercedes Actros Tanker", "operator": "Sunil Mehta", "battery": 88, "status": "Active / Refueling", "gate": "T3-B22", "assigned_flight": "EK 517"},
        {"id": "GSE-DEL-03", "type": "Container Pallet Loader", "vehicle": "TLD Commander 15", "operator": "Rohan Gupta", "battery": 72, "status": "Loading ULD Containers", "gate": "T3-A14", "assigned_flight": "BA 142"},
        {"id": "GSE-DEL-04", "type": "Baggage Electric Tug", "vehicle": "Charlatte T308", "operator": "Karan Malhotra", "battery": 91, "status": "Unloading Luggage", "gate": "T1-01", "assigned_flight": "6E 5021"},
    ],
    "BOM": [
        {"id": "GSE-BOM-01", "type": "Air Start Unit (ASU)", "vehicle": "Rheinmetall ASU-100", "operator": "Mahesh Bhosale", "battery": 89, "status": "Active Engine Start", "gate": "T2-G45", "assigned_flight": "AI 130"},
        {"id": "GSE-BOM-02", "type": "Catering Double-Scissor Lift", "vehicle": "Dobo-Tech 747-Lift", "operator": "Ganesh Pawar", "battery": 80, "status": "Uploading Catering", "gate": "T2-G47", "assigned_flight": "LH 757"},
        {"id": "GSE-BOM-03", "type": "Electric Baggage Tractor", "vehicle": "Mulag Comet 4E", "operator": "Santosh Patil", "battery": 94, "status": "Loading Freight", "gate": "T1A-1", "assigned_flight": "6E 5312"},
    ],
}

def get_gse_telemetry_for_airport(airport_code):
    """
    Returns active GSE (Ground Support Equipment) vehicle telemetry for selected airport
    with real-time dynamic battery level fluctuations on refresh.
    """
    code = (airport_code or "AMD").upper()
    preset = GSE_BASE_FLEET.get(code)

    if not preset:
        preset = [
            {"id": f"GSE-{code}-01", "type": "Fuel Hydrant Dispenser", "vehicle": "Volvo FL Fuel Truck", "operator": f"Operator {code}-1", "battery": 90, "status": "Active / Refueling", "gate": f"{code}-G1", "assigned_flight": f"6E {random.randint(100, 999)}"},
            {"id": f"GSE-{code}-02", "type": "Electric Baggage Tug", "vehicle": "TLD Electric Tug", "operator": f"Operator {code}-2", "battery": 84, "status": "Loading Baggage", "gate": f"{code}-G2", "assigned_flight": f"AI {random.randint(100, 999)}"},
            {"id": f"GSE-{code}-03", "type": "Catering Scissor Lift", "vehicle": "Mallaghan Catering Truck", "operator": f"Operator {code}-3", "battery": 76, "status": "Uploading Catering", "gate": f"{code}-G3", "assigned_flight": f"QP {random.randint(100, 999)}"},
        ]

    # Apply real-time dynamic battery & status fluctuations on each request
    dynamic_fleet = []
    statuses = ["Active / Dispatch", "In Service", "Turnaround Duty", "Standby / Ready", "En Route to Gate"]
    
    for item in preset:
        item_copy = dict(item)
        # Fluctuate battery by -2 to +2% dynamically
        fluc = random.choice([-2, -1, 0, 1, 2])
        new_battery = max(45, min(100, item_copy["battery"] + fluc))
        item_copy["battery"] = new_battery
        dynamic_fleet.append(item_copy)

    return {
        "airport": code,
        "total_vehicles_active": len(dynamic_fleet),
        "fleet": dynamic_fleet
    }
