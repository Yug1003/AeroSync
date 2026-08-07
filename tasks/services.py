from tasks.models import Task

VALID_TASK_TYPES = ["baggage_unload", "cabin_cleaning", "refueling", "catering", "baggage", "cleaning", "refuel"]
VALID_TASK_STATUSES = ["pending", "in_progress", "completed", "delayed"]

def _format_task(t):
    if not t:
        return None
    return {
        "_id": str(t.id),
        "id": str(t.id),
        "flight_id": str(t.flight_id),
        "task_type": t.task_type,
        "status": t.status,
        "assigned_staff_id": str(t.assigned_to) if t.assigned_to else None,
        "assigned_to": str(t.assigned_to) if t.assigned_to else None,
    }

def create_task(data):
    fl_id = data.get("flight_id")
    task_type = data.get("task_type", "cleaning")
    status = data.get("status", "pending")
    assigned_staff_id = data.get("assigned_staff_id") or data.get("assigned_to")
    t_id = data.get("_id") or data.get("id")

    t_kwargs = {
        "flight_id": str(fl_id) if fl_id else "GENERAL",
        "task_type": task_type,
        "status": status,
        "assigned_to": str(assigned_staff_id) if assigned_staff_id else None,
    }
    if t_id:
        t_kwargs["id"] = str(t_id)

    task = Task.objects.create(**t_kwargs)
    return _format_task(task)

def get_tasks_by_flight(flight_id):
    qs = Task.objects.filter(flight_id=str(flight_id))
    return [_format_task(t) for t in qs]

def get_task_by_id(task_id):
    try:
        task = Task.objects.get(id=str(task_id))
        return _format_task(task)
    except Task.DoesNotExist:
        return None

def update_task_status(task_id, status, delay_reason=None):
    try:
        task = Task.objects.get(id=str(task_id))
        task.status = status
        task.save()
        return _format_task(task)
    except Task.DoesNotExist:
        return None

def create_tasks_for_flight(flight_id):
    created_tasks = []
    types = ["baggage", "cleaning", "refuel", "catering"]
    for task_type in types:
        t = create_task({"flight_id": str(flight_id), "task_type": task_type, "status": "pending"})
        created_tasks.append(t)
    return created_tasks

def get_all_tasks():
    return [_format_task(t) for t in Task.objects.all()]

def update_task_assignment(task_id, staff_id):
    try:
        task = Task.objects.get(id=str(task_id))
        task.assigned_to = str(staff_id) if staff_id else None
        task.save()
        return _format_task(task)
    except Task.DoesNotExist:
        return None


