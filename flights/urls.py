from django.urls import path
from flights.views import FlightListCreateView, DepartFlightView

urlpatterns = [
    path("", FlightListCreateView.as_view(), name="flight-list-create"),
    path("<str:flight_id>/depart/", DepartFlightView.as_view(), name="flight-depart"),
]

