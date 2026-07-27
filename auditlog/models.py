from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50)
    details = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        username = self.user.username if self.user else "System/Anonymous"
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {username} - {self.action} on {self.model_name}:{self.object_id}"
