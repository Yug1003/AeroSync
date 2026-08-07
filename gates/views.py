from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from gates.services import get_all_gates


class GateListView(APIView):
    """
    GET /api/gates/ - List all gates
    """

    def get(self, request):
        gates = get_all_gates()
        return Response(gates, status=status.HTTP_200_OK)
