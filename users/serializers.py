from rest_framework import serializers
from django.contrib.auth import get_user_model
from staff_app.mongo_operations import create_staff
from datetime import datetime, timedelta, timezone

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4)
    department = serializers.CharField(write_only=True, required=False, allow_blank=True, default="baggage")

    class Meta:
        model = User
        fields = ["id", "username", "password", "email", "first_name", "last_name", "role", "department", "is_active"]
        read_only_fields = ["is_active"]

    def validate_role(self, value):
        if value == "admin":
            raise serializers.ValidationError("Admin accounts cannot be registered via public registration.")
        return "ground_crew"

    def create(self, validated_data):
        raw_dept = validated_data.pop("department", "fuel")
        dept = raw_dept.lower() if raw_dept and raw_dept.lower() in ["cleaning", "fuel", "catering"] else "fuel"
        password = validated_data.pop("password")

        # Public staff accounts require Admin approval before activation
        role = "ground_crew"
        validated_data["role"] = role
        is_active = False

        user = User.objects.create_user(
            password=password,
            is_active=is_active,
            **validated_data
        )

        # Sync staff record into MongoDB staff collection
        try:
            full_name = f"{user.first_name} {user.last_name}".strip() or user.username
            now_utc = datetime.now(timezone.utc)
            shift_start = now_utc - timedelta(hours=2)
            shift_end = now_utc + timedelta(hours=10)

            create_staff({
                "name": full_name,
                "department": dept,
                "shift_start": shift_start,
                "shift_end": shift_end,
                "is_available": is_active,
            })
        except Exception as e:
            print(f"[Staff Sync Notice] Created Django user {user.username}, Mongo staff sync note: {e}")

        return user
