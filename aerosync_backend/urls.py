"""
URL configuration for aerosync_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from flights.views import AircraftListCreateView


class APIRootView(APIView):
    """
    GET /api/ & /
    Returns a clean JSON endpoint directory for AeroSync REST Backend.
    """
    def get(self, request):
        return Response({
            "service": "AeroSync Command & Control System Backend",
            "status": "HEALTHY 🟢",
            "endpoints": {
                "auth": "/api/auth/login/",
                "flights": "/api/flights/",
                "live_radar": "/api/flights/live-radar/?airport=AMD",
                "aircraft": "/api/aircraft/",
                "gates": "/api/gates/",
                "tasks": "/api/tasks/",
                "staff": "/api/staff/",
                "incidents": "/api/incidents/",
                "audit_log": "/api/audit-log/",
                "notifications": "/api/notifications/",
                "weather": "/api/weather/",
                "analytics": "/api/analytics/kpis/",
            }
        }, status=status.HTTP_200_OK)


urlpatterns = [
    path('', APIRootView.as_view(), name='root-view'),
    path('api/', APIRootView.as_view(), name='api-root-view'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/flights/', include('flights.urls')),
    path('api/aircraft/', AircraftListCreateView.as_view(), name='aircraft-list-create'),
    path('api/gates/', include('gates.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/staff/', include('staff_app.urls')),
    path('api/incidents/', include('incidents.urls')),
    path('api/audit-log/', include('auditlog.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/weather/', include('weather.urls')),
    path('api/analytics/', include('analytics.urls')),
]
