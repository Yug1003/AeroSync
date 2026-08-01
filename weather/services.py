from flights.mongo_operations import get_all_flights, update_flight_status
from auditlog.utils import log_action
from notifications.models import Notification


def evaluate_weather_delays(weather_doc, user=None):
    """
    Automated Aviation Weather Delay Engine.
    When severe weather occurs (e.g. Thunderstorms, High Winds, Dense Fog),
    all active/scheduled flights are automatically updated to delayed,
    audit logs are recorded, and controller alert notifications are generated.
    """
    severity = weather_doc.get("severity", "clear")
    condition = weather_doc.get("condition", "")
    wind_kts = weather_doc.get("wind_speed_kts", 0)
    vis_miles = weather_doc.get("visibility_miles", 10.0)

    # Determine if conditions trigger automated flight delays
    is_hazardous = (
        severity in ["severe", "caution"]
        or wind_kts > 35
        or vis_miles < 1.0
        or any(keyword in condition for keyword in ["Thunderstorm", "Fog", "Snow", "Wind"])
    )

    delayed_flight_ids = []

    if is_hazardous:
        all_flights = get_all_flights()
        active_flights = [
            f for f in all_flights if f.get("status") in ["scheduled", "in_progress"]
        ]

        delay_reason = f"Weather Delay: {condition} (Wind: {wind_kts} kts, Vis: {vis_miles} mi)"

        for flight in active_flights:
            flight_id = flight["_id"]
            # Update status in MongoDB
            update_flight_status(flight_id, "delayed")
            delayed_flight_ids.append(flight_id)

            # Audit log entry
            log_action(
                user,
                "weather_delay",
                "Flight",
                flight_id,
                {"condition": condition, "wind_speed_kts": wind_kts, "visibility": vis_miles},
            )

            # Create Alert Notification (prevent duplicates by checking task_id string)
            notif_task_id = f"weather_{flight_id}"
            if not Notification.objects.filter(task_id=notif_task_id).exists():
                Notification.objects.create(
                    task_id=notif_task_id,
                    message=f"WEATHER ALERT: Flight {flight_id[:6]} delayed due to {condition}.",
                    notification_type="gate_conflict",
                    is_read=False,
                )

    return delayed_flight_ids
