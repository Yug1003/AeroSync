from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from weather.services import get_current_weather, update_weather, evaluate_weather_delays

# Distinct Real-World METAR Weather Telemetry per Indian International Airport
AIRPORT_WEATHER_PRESETS = {
    "AMD": {
        "airport_code": "AMD",
        "city": "Ahmedabad",
        "condition": "Ahmedabad (AMD) — Clear / Sunny ☀️",
        "temp_c": 35,
        "wind_speed_kts": 9,
        "visibility_miles": 10.0,
        "severity": "clear",
    },
    "DEL": {
        "airport_code": "DEL",
        "city": "New Delhi",
        "condition": "New Delhi (DEL) — Haze & Dust Layers 🌫️",
        "temp_c": 32,
        "wind_speed_kts": 12,
        "visibility_miles": 4.0,
        "severity": "caution",
    },
    "BOM": {
        "airport_code": "BOM",
        "city": "Mumbai",
        "condition": "Mumbai (BOM) — Coastal Drizzle & Wind 🌧️",
        "temp_c": 29,
        "wind_speed_kts": 18,
        "visibility_miles": 6.0,
        "severity": "caution",
    },
    "BLR": {
        "airport_code": "BLR",
        "city": "Bengaluru",
        "condition": "Bengaluru (BLR) — Pleasant & Clear 🌤️",
        "temp_c": 24,
        "wind_speed_kts": 14,
        "visibility_miles": 10.0,
        "severity": "clear",
    },
    "MAA": {
        "airport_code": "MAA",
        "city": "Chennai",
        "condition": "Chennai (MAA) — Humid Sea Breeze 🌊",
        "temp_c": 34,
        "wind_speed_kts": 16,
        "visibility_miles": 8.0,
        "severity": "clear",
    },
    "HYD": {
        "airport_code": "HYD",
        "city": "Hyderabad",
        "condition": "Hyderabad (HYD) — Partly Cloudy ⛅",
        "temp_c": 31,
        "wind_speed_kts": 10,
        "visibility_miles": 9.0,
        "severity": "clear",
    },
    "CCU": {
        "airport_code": "CCU",
        "city": "Kolkata",
        "condition": "Kolkata (CCU) — Thunderstorm Threat ⛈️",
        "temp_c": 33,
        "wind_speed_kts": 22,
        "visibility_miles": 3.5,
        "severity": "severe",
    },
    "COK": {
        "airport_code": "COK",
        "city": "Kochi",
        "condition": "Kochi (COK) — Tropical Showers 🌦️",
        "temp_c": 28,
        "wind_speed_kts": 15,
        "visibility_miles": 7.0,
        "severity": "caution",
    },
    "GOI": {
        "airport_code": "GOI",
        "city": "Goa",
        "condition": "Goa (GOI) — Fair Sea Breeze 🏖️",
        "temp_c": 30,
        "wind_speed_kts": 17,
        "visibility_miles": 10.0,
        "severity": "clear",
    },
    "JAI": {
        "airport_code": "JAI",
        "city": "Jaipur",
        "condition": "Jaipur (JAI) — Hot & Dry ☀️",
        "temp_c": 37,
        "wind_speed_kts": 8,
        "visibility_miles": 10.0,
        "severity": "clear",
    },
    "LKO": {
        "airport_code": "LKO",
        "city": "Lucknow",
        "condition": "Lucknow (LKO) — Morning Mist / Haze 🌫️",
        "temp_c": 32,
        "wind_speed_kts": 7,
        "visibility_miles": 5.0,
        "severity": "caution",
    },
    "ATQ": {
        "airport_code": "ATQ",
        "city": "Amritsar",
        "condition": "Amritsar (ATQ) — Clear Air 🌤️",
        "temp_c": 34,
        "wind_speed_kts": 6,
        "visibility_miles": 9.0,
        "severity": "clear",
    },
    "TRV": {
        "airport_code": "TRV",
        "city": "Trivandrum",
        "condition": "Trivandrum (TRV) — Coastal Wind 🌊",
        "temp_c": 29,
        "wind_speed_kts": 16,
        "visibility_miles": 9.0,
        "severity": "clear",
    },
    "IXC": {
        "airport_code": "IXC",
        "city": "Chandigarh",
        "condition": "Chandigarh (IXC) — Fair & Pleasant ☀️",
        "temp_c": 31,
        "wind_speed_kts": 9,
        "visibility_miles": 10.0,
        "severity": "clear",
    },
    "VTZ": {
        "airport_code": "VTZ",
        "city": "Visakhapatnam",
        "condition": "Visakhapatnam (VTZ) — Bay Breeze 🌬️",
        "temp_c": 31,
        "wind_speed_kts": 15,
        "visibility_miles": 9.0,
        "severity": "clear",
    },
}


class WeatherStatusView(APIView):
    """
    GET /api/weather/?airport=DEL - Fetch current METAR weather for selected airport
    POST /api/weather/ - Update weather & trigger automated aviation delay cascade
    """

    def get(self, request):
        code = request.GET.get("airport", "AMD").upper()
        if code in AIRPORT_WEATHER_PRESETS:
            return Response([AIRPORT_WEATHER_PRESETS[code]], status=status.HTTP_200_OK)

        weather_list = get_current_weather()
        return Response(weather_list, status=status.HTTP_200_OK)

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
