from django.urls import path
from weather.views import WeatherStatusView

urlpatterns = [
    path("", WeatherStatusView.as_view(), name="weather-status"),
]
