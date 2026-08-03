from django.urls import path
from flights.views import (
    FlightListCreateView,
    DepartFlightView,
    FlightDetailView,
    LiveOpenSkyRadarView,
    AIDisruptionRecoveryView,
    GSETelemetryView,
    AIDelayPredictorView,
    PassengerBaggageCarouselView,
)

urlpatterns = [
    path("", FlightListCreateView.as_view(), name="flight-list-create"),
    path("live-radar/", LiveOpenSkyRadarView.as_view(), name="live-radar"),
    path("ai-disruption-recovery/", AIDisruptionRecoveryView.as_view(), name="ai-disruption-recovery"),
    path("gse-telemetry/", GSETelemetryView.as_view(), name="gse-telemetry"),
    path("predict-delays/", AIDelayPredictorView.as_view(), name="predict-delays"),
    path("baggage-carousels/", PassengerBaggageCarouselView.as_view(), name="baggage-carousels"),
    path("<str:flight_id>/", FlightDetailView.as_view(), name="flight-detail"),
    path("<str:flight_id>/depart/", DepartFlightView.as_view(), name="flight-depart"),
]
