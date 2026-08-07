from weather.models import Weather
from auditlog.utils import log_action
from notifications.models import Notification

def _format_weather(w):
    if not w:
        return None
    return {
        "_id": "current_airport_weather",
        "condition": w.condition,
        "temp_c": w.temp_c,
        "wind_speed_kts": w.wind_kts,
        "visibility_miles": w.visibility_km,
        "severity": w.severity,
        "airport_code": w.airport_code,
        "updated_at": w.updated_at.isoformat() if w.updated_at else None,
    }

def get_current_weather(airport_code="AMD"):
    code = (airport_code or "AMD").upper()
    try:
        w = Weather.objects.get(airport_code=code)
    except Weather.DoesNotExist:
        w = Weather.objects.create(
            airport_code=code,
            condition="Clear / Fair ☀️",
            temp_c=28,
            wind_kts=10,
            visibility_km=10.0,
            severity="clear"
        )
    return _format_weather(w)

def update_weather(data):
    code = (data.get("airport_code") or "AMD").upper()
    w, _ = Weather.objects.get_or_create(airport_code=code)
    if "condition" in data:
        w.condition = data["condition"]
    if "temp_c" in data:
        w.temp_c = int(data["temp_c"])
    if "wind_speed_kts" in data:
        w.wind_kts = int(data["wind_speed_kts"])
    if "visibility_miles" in data:
        w.visibility_km = float(data["visibility_miles"])
    if "severity" in data:
        w.severity = data["severity"]
    w.save()
    return _format_weather(w)

def evaluate_weather_delays(weather_doc, user=None):
    severity = weather_doc.get("severity", "clear")
    condition = weather_doc.get("condition", "")
    wind_kts = weather_doc.get("wind_speed_kts", 0)
    vis_miles = weather_doc.get("visibility_miles", 10.0)

    is_hazardous = (
        severity in ["severe", "caution"]
        or wind_kts > 35
        or vis_miles < 1.0
        or any(keyword in condition for keyword in ["Thunderstorm", "Fog", "Snow", "Wind"])
    )

    if is_hazardous:
        log_action(
            user,
            "weather_advisory",
            "Weather",
            "AMD_METAR",
            {"condition": condition, "wind_speed_kts": wind_kts, "visibility": vis_miles},
        )

        notif_id = f"weather_advisory_{condition.replace(' ', '_')}"
        if not Notification.objects.filter(task_id=notif_id).exists():
            Notification.objects.create(
                task_id=notif_id,
                message=f"METAR ADVISORY: Hazardous conditions reported at AMD ({condition}). Operations on caution.",
                notification_type="gate_conflict",
                is_read=False,
            )

    return []
