from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from staff_app.mongo_operations import create_staff, get_all_staff


class StaffListCreateView(APIView):
    """
    GET /api/staff/ - List all staff
    POST /api/staff/ - Create new staff member
    """

    def get(self, request):
        staff = get_all_staff()
        return Response(staff, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            staff_doc = create_staff(request.data)
            return Response(staff_doc, status=status.HTTP_201_CREATED)
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)
