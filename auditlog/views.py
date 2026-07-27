from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from auditlog.models import AuditLog
from auditlog.serializers import AuditLogSerializer


class AuditLogListView(APIView):
    """
    GET /api/audit-log/ - List all audit log entries (newest first)
    """

    def get(self, request):
        logs = AuditLog.objects.all().order_by("-timestamp")[:100]
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
