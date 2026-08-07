from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from notifications.models import Notification
from notifications.serializers import NotificationSerializer


class NotificationListView(APIView):
    """
    GET /api/notifications/ - List notifications
    POST /api/notifications/ - Create a notification alert
    """

    def get(self, request):
        notifications = Notification.objects.all().order_by("-created_at")[:50]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        message = request.data.get("message", "System Alert Update")
        task_id = request.data.get("task_id", "DISPATCH_ALERT")
        notification_type = request.data.get("notification_type", "gate_change")
        
        notif = Notification.objects.create(
            message=message,
            task_id=task_id,
            notification_type=notification_type,
            is_read=False
        )
        serializer = NotificationSerializer(notif)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NotificationUpdateView(APIView):
    """
    PATCH /api/notifications/<id>/ - Mark notification as read
    """

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk)
        except Notification.DoesNotExist:
            return Response(
                {"error": f"Notification with id '{pk}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        is_read = request.data.get("is_read", True)
        notification.is_read = is_read
        notification.save()

        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)
