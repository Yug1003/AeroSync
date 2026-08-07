from django.db import models
import uuid

class Staff(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=50)
    shift_start = models.DateTimeField(null=True, blank=True)
    shift_end = models.DateTimeField(null=True, blank=True)
    assigned_flight = models.CharField(max_length=64, blank=True, null=True)
    is_available = models.BooleanField(default=True)
    airport_code = models.CharField(max_length=10, default="AMD")

    def __str__(self):
        return f"{self.name} ({self.department})"
