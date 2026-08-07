from django.db import models
import uuid

class Incident(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    description = models.CharField(max_length=255)
    priority = models.CharField(max_length=20, default="medium")
    status = models.CharField(max_length=20, default="open")
    flight_id = models.CharField(max_length=64, blank=True, null=True)
    reported_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    airport_code = models.CharField(max_length=10, default="AMD")

    def __str__(self):
        return f"[{self.priority.upper()}] {self.description[:30]}"
