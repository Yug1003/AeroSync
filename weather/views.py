from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from weather.mongo_operations import get_current_weather, update_weather
from weather.services import evaluate_weather_delays


class WeatherStatusView(APIView):
    """
    GET /api/weather/ - Fetch current airport METAR weather condition
    POST /api/weather/ - Update weather & trigger automated aviation delay cascade
    """

    def get(self, request):
        weather = get_current_weather()
        return Response(weather, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            updated_weather = update_weather(request.data)
            delayed_ids = evaluate_weather_delays(updated_weather, request.user)
            
            return Response(
                {
                    "weather": updated_weather,
                    "automated_delays_applied": len(delayed_ids),
                    "delayed_flight_ids": delayed_ids,
                },
                status=status.HTTP_200_OK,
            )
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)
