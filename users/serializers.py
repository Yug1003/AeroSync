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
        valid_roles = ["admin", "ops_manager", "ground_crew"]
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Must be one of {valid_roles}")
        return value

    def create(self, validated_data):
        raw_dept = validated_data.pop("department", "baggage")
        dept = raw_dept.lower() if raw_dept and raw_dept.lower() in ["baggage", "cleaning", "fuel", "catering"] else "baggage"
        password = validated_data.pop("password")

        # Staff accounts require Admin approval before activation
        role = validated_data.get("role", "ground_crew")
        is_active = True if role == "admin" else False
        
        user = User.objects.create_user(
            password=password,
            is_active=is_active,
            **validated_data
        )

        # Sync staff record into MongoDB staff collection if role is ops_manager or ground_crew
        if user.role in ["ops_manager", "ground_crew"]:
            try:
                full_name = f"{user.first_name} {user.last_name}".strip() or user.username
                now_utc = datetime.now(timezone.utc)
                shift_start = now_utc - timedelta(hours=2)
                shift_end = now_utc + timedelta(hours=10)

                create_staff({
                    "name": f"{full_name} ({user.get_role_display()})",
                    "department": dept,
                    "shift_start": shift_start,
                    "shift_end": shift_end,
                    "is_available": is_active,
                })
            except Exception as e:
                print(f"[Staff Sync Notice] Created Django user {user.username}, Mongo staff sync note: {e}")

        return user
