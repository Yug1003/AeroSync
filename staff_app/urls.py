from django.urls import path
from staff_app.views import StaffListCreateView

urlpatterns = [
    path("", StaffListCreateView.as_view(), name="staff-list-create"),
]
