from rest_framework import serializers
from auditlog.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ["id", "username", "action", "model_name", "object_id", "details", "timestamp"]

    def get_username(self, obj):
        return obj.user.username if obj.user else "System/Anonymous"
