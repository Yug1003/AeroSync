from django.db import models
import uuid

class Task(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    flight_id = models.CharField(max_length=64)
    task_type = models.CharField(max_length=50)
    status = models.CharField(max_length=30, default="pending")
    assigned_to = models.CharField(max_length=64, blank=True, null=True)
    due_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.task_type} for Flight {self.flight_id} ({self.status})"
