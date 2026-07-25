from django.urls import path
from gates.views import GateListView

urlpatterns = [
    path("", GateListView.as_view(), name="gate-list"),
]
