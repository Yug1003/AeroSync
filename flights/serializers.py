from rest_framework import serializers


class FlightCreateSerializer(serializers.Serializer):
    aircraft_id = serializers.CharField(max_length=100)
    arrival_time = serializers.DateTimeField()
    departure_time = serializers.DateTimeField()

    def validate(self, data):
        arrival_time = data.get("arrival_time")
        departure_time = data.get("departure_time")

        if departure_time <= arrival_time:
            raise serializers.ValidationError(
                {"departure_time": "departure_time must be after arrival_time."}
            )

        return data
