from django.urls import path
from flights.views import FlightListCreateView, DepartFlightView, FlightDetailView

urlpatterns = [
    path("", FlightListCreateView.as_view(), name="flight-list-create"),
    path("<str:flight_id>/", FlightDetailView.as_view(), name="flight-detail"),
    path("<str:flight_id>/depart/", DepartFlightView.as_view(), name="flight-depart"),
]


