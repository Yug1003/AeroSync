from flights.mongo_operations import get_all_flights, update_flight_status
from auditlog.utils import log_action
from notifications.models import Notification


def evaluate_weather_delays(weather_doc, user=None):
    """
    Aviation Weather Operations & METAR Advisory System.
    Logs METAR weather advisories and creates controller alerts without
    artificially altering real-world live flight statuses.
    """
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
