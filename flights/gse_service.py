import random
from django.db.models import Q
from flights.models import GSE

GSE_BASE_FLEET = {
    "AMD": [
        {"id": "GSE-FT-01", "type": "Fuel Hydrant Dispenser", "vehicle": "Volvo FL Fuel Truck", "operator": "Rajesh Kumar", "battery": 92, "status": "Active / Refueling", "gate": "T1-G1", "assigned_flight": "6E 214", "airport_code": "AMD"},
        {"id": "GSE-BT-02", "type": "Baggage Tug & Conveyor", "vehicle": "TLD Electric Tug", "operator": "Vikram Singh", "battery": 85, "status": "Loading Baggage", "gate": "T1-G2", "assigned_flight": "AI 011", "airport_code": "AMD"},
        {"id": "GSE-CT-03", "type": "Catering Hi-Lift", "vehicle": "Mallaghan Catering Truck", "operator": "Sanjay Patel", "battery": 78, "status": "Uploading Catering", "gate": "T2-INT1", "assigned_flight": "SQ 505", "airport_code": "AMD"},
        {"id": "GSE-JB-04", "type": "Passenger Jetbridge", "vehicle": "ThyssenKrupp Jetbridge A", "operator": "Amit Sharma", "battery": 96, "status": "Docked at Door 1L", "gate": "T1-G3", "assigned_flight": "QP 1102", "airport_code": "AMD"},
        {"id": "GSE-WC-05", "type": "Potable Water Service Truck", "vehicle": "Isuzu Water Bowser", "operator": "Deepak Verma", "battery": 64, "status": "Standby / Ready", "gate": "T1-G4", "assigned_flight": "SG 531", "airport_code": "AMD"},
        {"id": "GSE-PB-06", "type": "Aircraft Pushback Tug", "vehicle": "Goldhofer AST-2 Tractor", "operator": "Sunil Mehta", "battery": 89, "status": "Pushback En Route", "gate": "T3-A12", "assigned_flight": "AI 101", "airport_code": "AMD"},
        {"id": "GSE-CL-07", "type": "Cabin Cleaning Van", "vehicle": "Force Traveler Ops Van", "operator": "Karan Malhotra", "battery": 73, "status": "Cabin Sanitation", "gate": "T3-B22", "assigned_flight": "EK 517", "airport_code": "AMD"},
        {"id": "GSE-AC-08", "type": "Air Conditioning Unit (ACU)", "vehicle": "TLD Air Conditioning", "operator": "Pooja Joshi", "battery": 91, "status": "Cooling Cabin", "gate": "T1-01", "assigned_flight": "6E 5021", "airport_code": "AMD"},
        {"id": "GSE-AS-09", "type": "Air Start Unit (ASU)", "vehicle": "Rheinmetall ASU-100", "operator": "Nitin Desai", "battery": 82, "status": "Engine Start Ready", "gate": "T2-G45", "assigned_flight": "AI 130", "airport_code": "AMD"},
        {"id": "GSE-LU-10", "type": "Lavatory Service Truck", "vehicle": "Scania Waste Service", "operator": "Anil Rao", "battery": 77, "status": "Servicing Lavatories", "gate": "T2-G47", "assigned_flight": "LH 757", "airport_code": "AMD"},
    ],
    "DEL": [
        {"id": "GSE-DEL-01", "type": "Heavy Aircraft Pushback Tug", "vehicle": "Goldhofer AST-1X (Widebody)", "operator": "Deepak Verma", "battery": 95, "status": "Pushback Ready", "gate": "T3-A12", "assigned_flight": "AI 101", "airport_code": "DEL"},
        {"id": "GSE-DEL-02", "type": "Fuel Hydrant Super-Truck", "vehicle": "Mercedes Actros Tanker", "operator": "Sunil Mehta", "battery": 88, "status": "Active / Refueling", "gate": "T3-B22", "assigned_flight": "EK 517", "airport_code": "DEL"},
        {"id": "GSE-DEL-03", "type": "Container Pallet Loader", "vehicle": "TLD Commander 15", "operator": "Rohan Gupta", "battery": 72, "status": "Loading ULD Containers", "gate": "T3-A14", "assigned_flight": "BA 142", "airport_code": "DEL"},
        {"id": "GSE-DEL-04", "type": "Baggage Electric Tug", "vehicle": "Charlatte T308", "operator": "Karan Malhotra", "battery": 91, "status": "Unloading Luggage", "gate": "T1-01", "assigned_flight": "6E 5021", "airport_code": "DEL"},
    ],
    "BOM": [
        {"id": "GSE-BOM-01", "type": "Air Start Unit (ASU)", "vehicle": "Rheinmetall ASU-100", "operator": "Mahesh Bhosale", "battery": 89, "status": "Active Engine Start", "gate": "T2-G45", "assigned_flight": "AI 130", "airport_code": "BOM"},
        {"id": "GSE-BOM-02", "type": "Catering Double-Scissor Lift", "vehicle": "Dobo-Tech 747-Lift", "operator": "Ganesh Pawar", "battery": 80, "status": "Uploading Catering", "gate": "T2-G47", "assigned_flight": "LH 757", "airport_code": "BOM"},
        {"id": "GSE-BOM-03", "type": "Electric Baggage Tractor", "vehicle": "Mulag Comet 4E", "operator": "Santosh Patil", "battery": 94, "status": "Loading Freight", "gate": "T1A-1", "assigned_flight": "6E 5312", "airport_code": "BOM"},
    ],
}

def _format_gse(g):
    if not g:
        return None
    return {
        "_id": str(g.id),
        "id": str(g.id),
        "vehicle": g.vehicle,
        "type": g.vehicle_type,
        "operator": g.operator,
        "battery": g.fuel_level,
        "status": g.status,
        "assigned_flight": g.assigned_flight or "",
        "airport_code": g.airport_code,
    }

def get_gse_telemetry_for_airport(airport_code):
    code = (airport_code or "AMD").upper()
    qs = GSE.objects.filter(Q(airport_code=code) | Q(id__icontains=code))
    if not qs.exists():
        preset = GSE_BASE_FLEET.get(code)
        if not preset:
            preset = [
                {"id": f"GSE-{code}-01", "type": "Fuel Hydrant Dispenser", "vehicle": "Volvo FL Fuel Truck", "operator": f"Operator {code}-1", "battery": 90, "status": "Active / Refueling", "assigned_flight": f"6E {random.randint(100, 999)}", "airport_code": code},
                {"id": f"GSE-{code}-02", "type": "Electric Baggage Tug", "vehicle": "TLD Electric Tug", "operator": f"Operator {code}-2", "battery": 84, "status": "Loading Baggage", "assigned_flight": f"AI {random.randint(100, 999)}", "airport_code": code},
                {"id": f"GSE-{code}-03", "type": "Catering Scissor Lift", "vehicle": "Mallaghan Catering Truck", "operator": f"Operator {code}-3", "battery": 76, "status": "Uploading Catering", "assigned_flight": f"QP {random.randint(100, 999)}", "airport_code": code},
            ]
        for p in preset:
            GSE.objects.update_or_create(
                id=p["id"],
                defaults={
                    "vehicle": p["vehicle"],
                    "vehicle_type": p["type"],
                    "operator": p["operator"],
                    "fuel_level": p.get("battery", 85),
                    "status": p.get("status", "available"),
                    "assigned_flight": p.get("assigned_flight", ""),
                    "airport_code": code,
                }
            )
        qs = GSE.objects.filter(Q(airport_code=code) | Q(id__icontains=code))

    fleet = [_format_gse(g) for g in qs]
    return {
        "airport": code,
        "total_vehicles_active": len(fleet),
        "fleet": fleet
    }

def create_gse_vehicle(data):
    vehicle_id = data.get("id") or f"GSE-{random.randint(1000, 9999)}"
    airport_code = (data.get("airport_code") or "AMD").upper()
    gse = GSE.objects.create(
        id=vehicle_id,
        vehicle=data.get("vehicle", "GSE Tractor"),
        vehicle_type=data.get("type", "General Support"),
        operator=data.get("operator", "Ramp Operator"),
        fuel_level=int(data.get("battery", 90)),
        status=data.get("status", "Active / Ready"),
        assigned_flight=data.get("assigned_flight", "General"),
        airport_code=airport_code,
    )
    return _format_gse(gse)

def update_gse_vehicle(gse_id, update_fields):
    try:
        gse = GSE.objects.get(id=str(gse_id))
        for key, val in update_fields.items():
            if key == "type":
                gse.vehicle_type = val
            elif key == "battery":
                gse.fuel_level = int(val)
            elif hasattr(gse, key):
                setattr(gse, key, val)
        gse.save()
        return _format_gse(gse)
    except GSE.DoesNotExist:
        return None

def delete_gse_vehicle(gse_id):
    try:
        gse = GSE.objects.get(id=str(gse_id))
        gse.delete()
        return True
    except GSE.DoesNotExist:
        return False

