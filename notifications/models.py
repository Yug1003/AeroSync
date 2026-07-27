from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = (
        ("overdue_task", "Overdue Task"),
        ("gate_conflict", "Gate Conflict"),
        ("incident", "Incident"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    task_id = models.CharField(max_length=50, null=True, blank=True)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.notification_type}] {self.message} (Read: {self.is_read})"
