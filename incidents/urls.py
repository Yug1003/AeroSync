from django.urls import path
from incidents.views import IncidentListCreateView, IncidentUpdateView

urlpatterns = [
    path("", IncidentListCreateView.as_view(), name="incident-list-create"),
    path("<str:incident_id>/", IncidentUpdateView.as_view(), name="incident-update"),
]
