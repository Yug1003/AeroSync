from django.urls import path
from flights.views import FlightListCreateView, DepartFlightView, FlightDetailView, LiveOpenSkyRadarView

urlpatterns = [
    path("", FlightListCreateView.as_view(), name="flight-list-create"),
    path("live-radar/", LiveOpenSkyRadarView.as_view(), name="live-radar"),
    path("<str:flight_id>/", FlightDetailView.as_view(), name="flight-detail"),
    path("<str:flight_id>/depart/", DepartFlightView.as_view(), name="flight-depart"),
]


