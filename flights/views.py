from bson.objectid import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from flights.serializers import FlightCreateSerializer
from flights.mongo_operations import (
    create_flight,
    get_all_flights,
    get_flight_by_id,
    get_aircraft_by_id,
    update_flight_status,
    delete_flight,
    get_all_aircraft,
    create_aircraft,
)
from gates.services import find_free_gate
from gates.mongo_operations import update_gate_status
from tasks.mongo_operations import create_tasks_for_flight, get_tasks_by_flight
from users.permissions import IsAdminRole
from auditlog.utils import log_action


class FlightListCreateView(APIView):
    """
    GET /api/flights/ - List all flights
    POST /api/flights/ - Create flight with auto gate assignment & auto task generation
    """

    def get(self, request):
        flights = get_all_flights()
        return Response(flights, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = FlightCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        aircraft_id = serializer.validated_data["aircraft_id"]
        arrival_time = serializer.validated_data["arrival_time"]
        departure_time = serializer.validated_data["departure_time"]

        # 1. Validate aircraft existence
        aircraft = get_aircraft_by_id(aircraft_id)
        if not aircraft:
            return Response(
                {"error": f"Aircraft with id '{aircraft_id}' does not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Check for free gate
        gate = find_free_gate(arrival_time, departure_time)
        if not gate:
            return Response(
                {"error": "No gate available for the requested time window"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Create Flight
        flight = create_flight({
            "aircraft_id": aircraft_id,
            "arrival_time": arrival_time,
            "departure_time": departure_time,
            "gate_id": gate["_id"],
            "status": "scheduled",
        })

        # Mark gate as occupied
        update_gate_status(gate["_id"], "occupied")

        # 4. Auto-generate 4 tasks
        tasks = create_tasks_for_flight(flight["_id"])

        # Log audit entry
        log_action(
            request.user,
            "create_flight",
            "Flight",
            flight["_id"],
            {"assigned_gate": gate["label"], "aircraft_id": aircraft_id},
        )

        response_data = {
            **flight,
            "assigned_gate": gate,
            "tasks_created_count": len(tasks),
        }
        return Response(response_data, status=status.HTTP_201_CREATED)


class DepartFlightView(APIView):
    """
    POST /api/flights/<flight_id>/depart/ - Pushback gating: depart flight only if all tasks are completed
    """

    def post(self, request, flight_id):
        if not isinstance(flight_id, str) or not ObjectId.is_valid(flight_id):
            return Response(
                {"error": f"Invalid flight_id format: '{flight_id}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        flight = get_flight_by_id(flight_id)
        if not flight:
            return Response(
                {"error": f"Flight with id '{flight_id}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if flight.get("status") == "departed":
            return Response(
                {"error": "Flight has already departed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tasks = get_tasks_by_flight(flight_id)
        incomplete_tasks = [t for t in tasks if t.get("status") != "completed"]

        if incomplete_tasks:
            return Response(
                {
                    "error": f"Cannot depart - {len(incomplete_tasks)} task(s) still pending",
                    "incomplete_tasks": [t.get("task_type") for t in incomplete_tasks],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_flight = update_flight_status(flight_id, "departed")
        if flight.get("gate_id"):
            update_gate_status(flight["gate_id"], "available")

        log_action(
            request.user,
            "depart_flight",
            "Flight",
            flight_id,
            {"gate_freed": flight.get("gate_id")},
        )

        return Response(
            {
                "message": "Flight departed successfully",
                "flight": updated_flight,
                "gate_status": "available",
            },
            status=status.HTTP_200_OK,
        )


class FlightDetailView(APIView):
    """
    DELETE /api/flights/<flight_id>/ - Protected action (Requires IsAdminRole)
    """

    permission_classes = [IsAdminRole]

    def delete(self, request, flight_id):
        if not isinstance(flight_id, str) or not ObjectId.is_valid(flight_id):
            return Response(
                {"error": f"Invalid flight_id format: '{flight_id}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        flight = get_flight_by_id(flight_id)
        if not flight:
            return Response(
                {"error": f"Flight with id '{flight_id}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        success = delete_flight(flight_id)
        if success:
            log_action(request.user, "delete_flight", "Flight", flight_id)
            return Response(
                {"message": f"Flight '{flight_id}' deleted successfully."},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"error": "Failed to delete flight."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class AircraftListCreateView(APIView):
    """
    GET /api/aircraft/ - List all aircraft
    POST /api/aircraft/ - Create aircraft
    """

    def get(self, request):
        aircraft = get_all_aircraft()
        return Response(aircraft, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            aircraft = create_aircraft(request.data)
            return Response(aircraft, status=status.HTTP_201_CREATED)
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)



