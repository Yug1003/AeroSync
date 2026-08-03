from django.urls import path
from staff_app.views import StaffListCreateView, AssignStaffFlightView

urlpatterns = [
    path("", StaffListCreateView.as_view(), name="staff-list-create"),
    path("assign-flight/", AssignStaffFlightView.as_view(), name="assign-staff-flight"),
]
