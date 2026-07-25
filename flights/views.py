from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from flights.serializers import FlightCreateSerializer
from flights.mongo_operations import create_flight, get_all_flights, get_flight_by_id, get_aircraft_by_id
from gates.services import find_free_gate
from gates.mongo_operations import update_gate_status
from tasks.mongo_operations import create_tasks_for_flight


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

        response_data = {
            **flight,
            "assigned_gate": gate,
            "tasks_created_count": len(tasks),
        }
        return Response(response_data, status=status.HTTP_201_CREATED)
