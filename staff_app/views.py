from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from staff_app.services import create_staff, get_all_staff, update_staff_assignment, get_staff_by_id
from auditlog.utils import log_action


class StaffListCreateView(APIView):
    """
    GET /api/staff/ - List all ground crew & ops staff members
    POST /api/staff/ - Create new staff member
    """
    permission_classes = [AllowAny]

    def get(self, request):
        staff = get_all_staff()
        return Response(staff, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            staff_doc = create_staff(request.data)
            log_action(
                request.user,
                "create_staff",
                "Staff",
                staff_doc["_id"],
                {"name": staff_doc.get("name"), "department": staff_doc.get("department")},
            )
            return Response(staff_doc, status=status.HTTP_201_CREATED)
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)


class AssignStaffFlightView(APIView):
    """
    POST /api/staff/assign-flight/
    Allows Admin / Ops Managers to assign or re-assign any staff member
    to any aircraft currently standing at the airport.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        staff_id = request.data.get("staff_id")
        flight_callsign = request.data.get("flight_callsign")
        gate_label = request.data.get("gate_label")

        if not staff_id:
            return Response({"error": "staff_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        updated_staff = update_staff_assignment(staff_id, None, flight_callsign, gate_label)
        
        staff_name = updated_staff.get("name", "Staff Member") if updated_staff else "Staff Member"
        assignment_msg = f"Assigned to Flight {flight_callsign} at Gate {gate_label}" if flight_callsign else "Set to Standby / Available"

        log_action(
            request.user,
            "assign_staff_aircraft",
            "Staff",
            staff_id,
            {"staff_name": staff_name, "flight_callsign": flight_callsign, "gate_label": gate_label},
        )

        return Response({
            "message": f"✓ Staff member {staff_name} {assignment_msg} successfully.",
            "staff": updated_staff
        }, status=status.HTTP_200_OK)
