from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from flights.serializers import FlightCreateSerializer
from flights.services import (
    create_flight,
    get_all_flights,
    get_flight_by_id,
    get_aircraft_by_id,
    update_flight_status,
    delete_flight,
    get_all_aircraft,
    create_aircraft,
)
from gates.services import find_free_gate, update_gate_status
from tasks.services import create_tasks_for_flight, get_tasks_by_flight
from users.permissions import IsAdminRole
from auditlog.utils import log_action
from flights.flightradar_service import fetch_live_flightradar24_flights
from flights.opensky_service import fetch_live_opensky_flights


class FlightListCreateView(APIView):
    """
    GET /api/flights/ - List all flights
    POST /api/flights/ - Create flight with auto gate assignment & auto task generation
    """

    def get(self, request):
        airport_code = request.GET.get("airport")
        flights = get_all_flights(airport_code=airport_code)
        return Response(flights, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.copy()
        arrival_time = data.get("arrival_time")
        departure_time = data.get("departure_time")
        aircraft_id = data.get("aircraft_id")

        if not aircraft_id:
            # Fallback or pick first existing aircraft
            all_ac = get_all_aircraft()
            if all_ac:
                aircraft_id = all_ac[0]["_id"]
            else:
                new_ac = create_aircraft({
                    "tail_number": data.get("tailNumber", "VT-AIR1"),
                    "airline": data.get("airline", "IndiGo"),
                    "aircraft_type": data.get("aircraftType", "A320neo"),
                    "passenger_capacity": 180,
                })
                aircraft_id = new_ac["_id"]
            data["aircraft_id"] = aircraft_id

        # Gate assignment
        gate_id = data.get("gate_id")
        gate = None
        if not gate_id and arrival_time and departure_time:
            gate = find_free_gate(arrival_time, departure_time)
            if gate:
                gate_id = gate["_id"]
                data["gate_id"] = gate_id

        flight = create_flight(data)

        if gate_id:
            update_gate_status(gate_id, "occupied")

        tasks = create_tasks_for_flight(flight["_id"])

        log_action(
            request.user if request.user and request.user.is_authenticated else "admin",
            "create_flight",
            "Flight",
            flight["_id"],
            {"assigned_gate": gate_id, "callsign": data.get("callsign")},
        )

        return Response(
            {
                **flight,
                "tasks_created_count": len(tasks),
            },
            status=status.HTTP_201_CREATED,
        )


class DepartFlightView(APIView):
    """
    POST /api/flights/<flight_id>/depart/ - Pushback gating: depart flight only if all tasks are completed
    """

    def post(self, request, flight_id):
        if not flight_id:
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
            request.user if request.user and request.user.is_authenticated else "admin",
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
    PATCH /api/flights/<flight_id>/ - Update flight gate or details
    DELETE /api/flights/<flight_id>/ - Delete flight record
    """

    def patch(self, request, flight_id):
        if not flight_id:
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

        from flights.services import update_flight
        updated = update_flight(flight_id, request.data)
        log_action(
            request.user if request.user and request.user.is_authenticated else "admin",
            "update_flight",
            "Flight",
            flight_id,
            {"updated_fields": list(request.data.keys())},
        )
        return Response(updated, status=status.HTTP_200_OK)

    def delete(self, request, flight_id):
        if not flight_id:
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
            log_action(
                request.user if request.user and request.user.is_authenticated else "admin",
                "delete_flight",
                "Flight",
                flight_id,
            )
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


from flights.disruption_service import run_ai_disruption_recovery
from flights.gse_service import get_gse_telemetry_for_airport


class LiveOpenSkyRadarView(APIView):
    """
    GET /api/flights/live-radar/?airport=DEL
    Fetches real-time ADS-B satellite radar telemetry from Flightradar24 & OpenSky Network
    for any selected Indian International Airport (DEL, BOM, BLR, AMD, MAA, etc.).
    """

    def get(self, request):
        airport_code = request.GET.get("airport", "AMD").upper()
        fr24_flights = fetch_live_flightradar24_flights(airport_code)
        opensky_flights = fetch_live_opensky_flights()

        all_live = fr24_flights + opensky_flights

        return Response({
            "airport_code": airport_code,
            "source": f"Flightradar24 Live ({airport_code}) + OpenSky Satellite Feed",
            "fr24_count": len(fr24_flights),
            "opensky_count": len(opensky_flights),
            "total_count": len(all_live),
            "flights": all_live
        }, status=status.HTTP_200_OK)


class AIDisruptionRecoveryView(APIView):
    """
    POST /api/flights/ai-disruption-recovery/
    Runs the AI Automated Disruption Management algorithm to re-assign conflicting gate stands
    and compress turnaround task slots for disrupted flights.
    """

    def post(self, request):
        airport_code = request.data.get("airport", "AMD")
        flights = request.data.get("flights", [])
        gates = request.data.get("gates", [])

        result = run_ai_disruption_recovery(airport_code, flights, gates)
        return Response(result, status=status.HTTP_200_OK)


from flights.gse_service import (
    get_gse_telemetry_for_airport,
    create_gse_vehicle,
    update_gse_vehicle,
    delete_gse_vehicle,
)


class GSETelemetryView(APIView):
    """
    GET /api/flights/gse-telemetry/?airport=DEL - Returns GSE vehicle fleet telemetry
    POST /api/flights/gse-telemetry/ - Register/dispatch a new GSE vehicle
    """

    def get(self, request):
        airport_code = request.GET.get("airport", "AMD")
        data = get_gse_telemetry_for_airport(airport_code)
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            new_vehicle = create_gse_vehicle(request.data)
            log_action(
                request.user if request.user and request.user.is_authenticated else "admin",
                "create_gse",
                "GSE",
                new_vehicle["id"],
                {"vehicle": new_vehicle.get("vehicle"), "operator": new_vehicle.get("operator")},
            )
            return Response(new_vehicle, status=status.HTTP_201_CREATED)
        except Exception as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)


class GSEDetailView(APIView):
    """
    PATCH /api/flights/gse-telemetry/<gse_id>/ - Update GSE vehicle telemetry/assignment
    DELETE /api/flights/gse-telemetry/<gse_id>/ - Decommission/remove GSE vehicle
    """

    def patch(self, request, gse_id):
        updated = update_gse_vehicle(gse_id, request.data)
        if updated:
            log_action(
                request.user if request.user and request.user.is_authenticated else "admin",
                "update_gse",
                "GSE",
                gse_id,
                {"updated_fields": list(request.data.keys())},
            )
            return Response(updated, status=status.HTTP_200_OK)
        return Response({"error": f"GSE vehicle with id '{gse_id}' not found."}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, gse_id):
        success = delete_gse_vehicle(gse_id)
        if success:
            log_action(
                request.user if request.user and request.user.is_authenticated else "admin",
                "delete_gse",
                "GSE",
                gse_id,
            )
            return Response({"message": f"GSE Vehicle '{gse_id}' removed successfully."}, status=status.HTTP_200_OK)
        return Response({"error": f"Failed to delete GSE vehicle '{gse_id}'."}, status=status.HTTP_404_NOT_FOUND)



class AIDelayPredictorView(APIView):
    """
    GET /api/flights/predict-delays/?airport=AMD
    AI Predictive Engine calculating turnaround delay risks (+X mins).
    """

    def get(self, request):
        from flights.predictor_service import predict_flight_delays
        airport_code = request.GET.get("airport", "AMD")
        data = predict_flight_delays(airport_code)
        return Response(data, status=status.HTTP_200_OK)


class PassengerBaggageCarouselView(APIView):
    """
    GET /api/flights/baggage-carousels/?airport=AMD
    Real-time arrival baggage claim belts (Belts B1 to B8) & carousel status.
    """

    def get(self, request):
        airport_code = request.GET.get("airport", "AMD").upper()
        flights = get_all_flights(airport_code=airport_code)
        carousels = []
        for idx in range(1, 7):
            assigned_fl = flights[(idx - 1) % len(flights)] if flights else None
            carousels.append({
                "carousel_id": f"Belt B{idx}",
                "status": "Active" if assigned_fl else "Standby",
                "flight_callsign": assigned_fl["callsign"] if assigned_fl else "N/A",
                "route": assigned_fl["route"] if assigned_fl else "N/A",
                "bags_processed": (idx * 42) if assigned_fl else 0,
                "airport_code": airport_code,
            })
        return Response({
            "airport_code": airport_code,
            "total_carousels": len(carousels),
            "carousels": carousels,
        }, status=status.HTTP_200_OK)





