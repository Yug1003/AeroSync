from db.mongo_client import db

gse_col = db["gse"]

# Real-world GSE Fleet Definitions for major Indian International Airports
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


def _format_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def get_gse_telemetry_for_airport(airport_code):
    """
    Returns active GSE vehicle telemetry for selected airport from MongoDB,
    auto-seeding default presets if collection is empty.
    """
    code = (airport_code or "AMD").upper()
    query = {"$or": [{"airport_code": code}, {"id": {"$regex": f"^{code}|{code}", "$options": "i"}}]}
    docs = list(gse_col.find(query))

    if not docs:
        preset = GSE_BASE_FLEET.get(code)
        if not preset:
            preset = [
                {"id": f"GSE-{code}-01", "type": "Fuel Hydrant Dispenser", "vehicle": "Volvo FL Fuel Truck", "operator": f"Operator {code}-1", "battery": 90, "status": "Active / Refueling", "gate": f"{code}-G1", "assigned_flight": f"6E {random.randint(100, 999)}", "airport_code": code},
                {"id": f"GSE-{code}-02", "type": "Electric Baggage Tug", "vehicle": "TLD Electric Tug", "operator": f"Operator {code}-2", "battery": 84, "status": "Loading Baggage", "gate": f"{code}-G2", "assigned_flight": f"AI {random.randint(100, 999)}", "airport_code": code},
                {"id": f"GSE-{code}-03", "type": "Catering Scissor Lift", "vehicle": "Mallaghan Catering Truck", "operator": f"Operator {code}-3", "battery": 76, "status": "Uploading Catering", "gate": f"{code}-G3", "assigned_flight": f"QP {random.randint(100, 999)}", "airport_code": code},
            ]
        for p in preset:
            doc = dict(p)
            doc["airport_code"] = code
            gse_col.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
        docs = list(gse_col.find(query))

    fleet = [_format_doc(d) for d in docs]
    return {
        "airport": code,
        "total_vehicles_active": len(fleet),
        "fleet": fleet
    }


def create_gse_vehicle(data):
    vehicle_id = data.get("id") or f"GSE-{random.randint(1000, 9999)}"
    airport_code = (data.get("airport_code") or "AMD").upper()

    doc = {
        "id": vehicle_id,
        "vehicle": data.get("vehicle", "GSE Tractor"),
        "type": data.get("type", "General Support"),
        "operator": data.get("operator", "Ramp Operator"),
        "battery": int(data.get("battery", 90)),
        "status": data.get("status", "Active / Ready"),
        "gate": data.get("gate", "T1-G1"),
        "assigned_flight": data.get("assigned_flight", "General"),
        "airport_code": airport_code,
    }
    result = gse_col.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


def update_gse_vehicle(gse_id, update_fields):
    allowed = ["vehicle", "type", "operator", "battery", "status", "gate", "assigned_flight", "airport_code"]
    set_dict = {}
    for key, val in update_fields.items():
        if key in allowed:
            if key == "battery":
                try:
                    val = int(val)
                except (ValueError, TypeError):
                    pass
            set_dict[key] = val

    if not set_dict:
        doc = gse_col.find_one({"$or": [{"id": gse_id}, {"_id": gse_id}]})
        return _format_doc(doc) if doc else None

    from bson.objectid import ObjectId
    query = {"id": gse_id}
    if ObjectId.is_valid(gse_id):
        query = {"$or": [{"id": gse_id}, {"_id": ObjectId(gse_id)}]}

    updated = gse_col.find_one_and_update(query, {"$set": set_dict}, return_document=True)
    return _format_doc(updated) if updated else None


def delete_gse_vehicle(gse_id):
    from bson.objectid import ObjectId
    query = {"id": gse_id}
    if ObjectId.is_valid(gse_id):
        query = {"$or": [{"id": gse_id}, {"_id": ObjectId(gse_id)}]}

    res = gse_col.delete_one(query)
    return res.deleted_count > 0

