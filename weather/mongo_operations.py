from datetime import datetime, timezone
from db.mongo_client import db

weather_col = db["weather"]

DEFAULT_WEATHER = {
    "_id": "current_airport_weather",
    "condition": "Clear / Fair ☀️",
    "temp_c": 24,
    "wind_speed_kts": 10,
    "visibility_miles": 10.0,
    "severity": "clear",  # clear, caution, severe
    "updated_at": datetime.now(timezone.utc),
}


def get_current_weather():
    doc = weather_col.find_one({"_id": "current_airport_weather"})
    if not doc:
        doc = dict(DEFAULT_WEATHER)
        weather_col.insert_one(doc)
    return doc


def update_weather(data):
    condition = data.get("condition", "Clear / Fair ☀️")
    temp_c = int(data.get("temp_c", 24))
    wind_speed_kts = int(data.get("wind_speed_kts", 10))
    visibility_miles = float(data.get("visibility_miles", 10.0))
    severity = data.get("severity", "clear")  # clear, caution, severe

    updated_doc = {
        "_id": "current_airport_weather",
        "condition": condition,
        "temp_c": temp_c,
        "wind_speed_kts": wind_speed_kts,
        "visibility_miles": visibility_miles,
        "severity": severity,
        "updated_at": datetime.now(timezone.utc),
    }

    weather_col.replace_one(
        {"_id": "current_airport_weather"}, updated_doc, upsert=True
    )
    return updated_doc
