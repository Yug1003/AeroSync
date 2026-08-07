from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("ground_crew", "Ground Crew"),
    )
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default="ground_crew"
    )

    def __str__(self):
        return f"{self.username} ({self.role})"
