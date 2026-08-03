from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from auditlog.utils import log_action
from .serializers import UserRegistrationSerializer

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get(self.username_field)

        # Check if user exists in database but pending approval
        user = User.objects.filter(username=username).first()

        if user and not user.is_active:
            raise AuthenticationFailed(
                "Your staff account is pending Admin approval. Please contact your Control Tower Administrator.",
                code="user_pending_approval"
            )

        data = super().validate(attrs)
        data["role"] = self.user.role
        data["username"] = self.user.username
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Registers a new staff user (Admin, Ops Manager, Ground Crew).
    Non-admin staff accounts require Admin Approval (is_active=False).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            if user.is_active:
                msg = f"Admin account '{user.username}' created successfully! You can now sign in."
            else:
                msg = f"Registration submitted for '{user.username}'! Your staff account is pending Admin approval before you can sign in."

            log_action(
                user=None,
                action="staff_registration",
                model_name="User",
                object_id=str(user.id),
                details={"username": user.username, "role": user.role, "is_active": user.is_active}
            )

            return Response({
                "message": msg,
                "requires_approval": not user.is_active,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "role_display": user.get_role_display(),
                    "is_active": user.is_active
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    Returns authenticated user information.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "role_display": user.get_role_display(),
            "is_active": user.is_active
        })


class PendingStaffListView(APIView):
    """
    GET /api/auth/pending-staff/
    Lists all staff accounts waiting for Admin approval.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin" and not request.user.is_superuser:
            return Response({"detail": "Admin permission required."}, status=status.HTTP_403_FORBIDDEN)

        pending_users = User.objects.filter(is_active=False).order_by("-date_joined")
        data = [
            {
                "id": u.id,
                "username": u.username,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "full_name": f"{u.first_name} {u.last_name}".strip() or u.username,
                "email": u.email,
                "role": u.role,
                "role_display": u.get_role_display(),
                "date_joined": u.date_joined,
                "is_active": u.is_active
            }
            for u in pending_users
        ]
        return Response(data, status=status.HTTP_200_OK)


class ApproveStaffView(APIView):
    """
    POST /api/auth/approve-staff/<int:user_id>/
    Allows Admin to approve or reject a staff user account.
    Payload: { "action": "approve" | "reject" }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role != "admin" and not request.user.is_superuser:
            return Response({"detail": "Admin permission required."}, status=status.HTTP_403_FORBIDDEN)

        target_user = User.objects.filter(id=user_id).first()
        if not target_user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        action_type = request.data.get("action", "approve")

        if action_type == "reject":
            username = target_user.username
            target_user.delete()
            log_action(request.user, "reject_staff", "User", str(user_id), {"username": username})
            return Response({"message": f"Staff account for '{username}' rejected and removed."}, status=status.HTTP_200_OK)
        else:
            target_user.is_active = True
            target_user.save()
            log_action(request.user, "approve_staff", "User", str(target_user.id), {"username": target_user.username, "role": target_user.role})
            return Response({
                "message": f"Staff account for '{target_user.username}' has been APPROVED!",
                "user": {
                    "id": target_user.id,
                    "username": target_user.username,
                    "role": target_user.role,
                    "is_active": target_user.is_active
                }
            }, status=status.HTTP_200_OK)
