from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    CurrentUserView,
    PendingStaffListView,
    ApproveStaffView,
)

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("register/", RegisterView.as_view(), name="user-register"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("pending-staff/", PendingStaffListView.as_view(), name="pending-staff-list"),
    path("approve-staff/<int:user_id>/", ApproveStaffView.as_view(), name="approve-staff"),
]
