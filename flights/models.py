from django.db import models
import uuid

class Aircraft(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    callsign = models.CharField(max_length=50)
    tail_number = models.CharField(max_length=50)
    aircraft_type = models.CharField(max_length=50, default="A320neo")
    airline = models.CharField(max_length=50, default="IndiGo")
    airport_code = models.CharField(max_length=10, default="AMD")

    def __str__(self):
        return f"{self.tail_number} ({self.callsign})"

class Flight(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    callsign = models.CharField(max_length=50)
    airline = models.CharField(max_length=50, default="IndiGo")
    tail_number = models.CharField(max_length=50, blank=True, null=True)
    aircraft_type = models.CharField(max_length=50, default="A320neo")
    route = models.CharField(max_length=100, default="AMD ✈️ DEL")
    gate_id = models.CharField(max_length=64, blank=True, null=True)
    aircraft_id = models.CharField(max_length=64, blank=True, null=True)
    arrival_time = models.DateTimeField()
    departure_time = models.DateTimeField()
    status = models.CharField(max_length=30, default="scheduled")
    airport_code = models.CharField(max_length=10, default="AMD")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.callsign} - {self.airport_code}"

class GSE(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    vehicle = models.CharField(max_length=100)
    vehicle_type = models.CharField(max_length=50)
    status = models.CharField(max_length=30, default="available")
    assigned_flight = models.CharField(max_length=64, blank=True, null=True)
    operator = models.CharField(max_length=100, default="Ramp Operations Crew")
    fuel_level = models.IntegerField(default=85)
    airport_code = models.CharField(max_length=10, default="AMD")

    def __str__(self):
        return f"{self.vehicle} ({self.vehicle_type})"
