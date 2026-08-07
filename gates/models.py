from django.db import models
import uuid

class Gate(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    label = models.CharField(max_length=50)
    status = models.CharField(max_length=30, default="available")
    current_flight_id = models.CharField(max_length=64, blank=True, null=True)
    airport_code = models.CharField(max_length=10, default="AMD")

    def __str__(self):
        return f"Gate {self.label} ({self.status})"
