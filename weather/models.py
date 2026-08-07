from django.db import models

class Weather(models.Model):
    airport_code = models.CharField(max_length=10, primary_key=True)
    condition = models.CharField(max_length=100, default="Clear")
    temp_c = models.IntegerField(default=28)
    wind_kts = models.IntegerField(default=8)
    visibility_km = models.FloatField(default=10.0)
    severity = models.CharField(max_length=20, default="clear")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.airport_code}: {self.temp_c}°C ({self.condition})"
