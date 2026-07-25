from bson.objectid import ObjectId
from db.mongo_client import db

gates_col = db["gates"]


def _format_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def create_gate(data):
    label = data.get("label")
    status = data.get("status", "available")
    valid_statuses = ["available", "occupied", "maintenance", "reserved"]
    if status not in valid_statuses:
        raise ValueError(f"Invalid status: {status}. Must be one of {valid_statuses}")

    doc = {
        "label": label,
        "status": status,
    }
    result = gates_col.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


def get_all_gates():
    docs = list(gates_col.find({}))
    return [_format_doc(doc) for doc in docs]


def get_gate_by_id(gate_id):
    if not isinstance(gate_id, str) or not ObjectId.is_valid(gate_id):
        return None
    doc = gates_col.find_one({"_id": ObjectId(gate_id)})
    return _format_doc(doc) if doc else None


def update_gate_status(gate_id, status):
    if not isinstance(gate_id, str) or not ObjectId.is_valid(gate_id):
        return None
    valid_statuses = ["available", "occupied", "maintenance", "reserved"]
    if status not in valid_statuses:
        raise ValueError(f"Invalid status: {status}. Must be one of {valid_statuses}")

    result = gates_col.find_one_and_update(
        {"_id": ObjectId(gate_id)},
        {"$set": {"status": status}},
        return_document=True,
    )
    return _format_doc(result) if result else None
