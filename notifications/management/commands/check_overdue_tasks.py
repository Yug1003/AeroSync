from datetime import datetime, timezone
from django.core.management.base import BaseCommand
from tasks.mongo_operations import get_all_tasks
from flights.mongo_operations import get_flight_by_id
from notifications.models import Notification


def _ensure_datetime(dt):
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    if isinstance(dt, datetime) and dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


class Command(BaseCommand):
    help = "Checks all pending/in_progress tasks whose linked flight departure_time has passed and creates Notification entries."

    def handle(self, *args, **options):
        self.stdout.write("Running check_overdue_tasks management command...")
        
        all_tasks = get_all_tasks()
        pending_tasks = [t for t in all_tasks if t.get("status") in ["pending", "in_progress"]]
        
        now_utc = datetime.now(timezone.utc)
        created_count = 0

        for task in pending_tasks:
            flight_id = task.get("flight_id")
            if not flight_id:
                continue

            flight = get_flight_by_id(flight_id)
            if not flight or flight.get("status") == "departed":
                continue

            departure_time = _ensure_datetime(flight.get("departure_time"))
            if departure_time < now_utc:
                task_id = str(task["_id"])
                
                # Duplicate Prevention Approach:
                # Check if a Notification referencing task_id with notification_type='overdue_task' already exists.
                # If it exists, skip creation to prevent duplicate alert notifications.
                exists = Notification.objects.filter(
                    task_id=task_id, notification_type="overdue_task"
                ).exists()

                if not exists:
                    msg = (
                        f"Overdue Task: Task '{task.get('task_type')}' for Flight "
                        f"{flight_id[:6]} is still pending past departure time ({departure_time.strftime('%H:%M')})."
                    )
                    Notification.objects.create(
                        task_id=task_id,
                        message=msg,
                        notification_type="overdue_task",
                        is_read=False,
                    )
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f"Created notification for task {task_id}"))

        self.stdout.write(self.style.SUCCESS(f"Completed! Created {created_count} overdue task notifications."))
