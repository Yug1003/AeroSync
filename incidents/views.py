from bson.objectid import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from incidents.mongo_operations import (
    create_incident,
    get_all_incidents,
    get_incident_by_id,
    update_incident_status,
)
from auditlog.utils import log_action


class IncidentListCreateView(APIView):
    """
    GET /api/incidents/ - List all incidents (newest first)
    POST /api/incidents/ - Report a new incident
    """

    def get(self, request):
        incidents = get_all_incidents()
        return Response(incidents, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            incident = create_incident(request.data)
            log_action(
                request.user,
                "create_incident",
                "Incident",
                incident["_id"],
                {"priority": incident.get("priority"), "flight_id": incident.get("flight_id")},
            )
            return Response(incident, status=status.HTTP_201_CREATED)
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)


class IncidentUpdateView(APIView):
    """
    PATCH /api/incidents/<incident_id>/ - Update incident status (e.g. resolve)
    """

    def patch(self, request, incident_id):
        if not isinstance(incident_id, str) or not ObjectId.is_valid(incident_id):
            return Response(
                {"error": f"Invalid incident_id format: '{incident_id}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_status = request.data.get("status")
        if not new_status:
            return Response(
                {"error": "Field 'status' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            updated = update_incident_status(incident_id, new_status)
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)

        if not updated:
            return Response(
                {"error": f"Incident with id '{incident_id}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        log_action(
            request.user,
            "update_incident_status",
            "Incident",
            incident_id,
            {"status": new_status},
        )

        return Response(updated, status=status.HTTP_200_OK)
