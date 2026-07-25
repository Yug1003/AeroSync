from datetime import datetime, timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from flights.mongo_operations import get_all_flights
from gates.mongo_operations import get_all_gates


def _ensure_datetime(dt):
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    if isinstance(dt, datetime) and dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


class KPIAnalyticsView(APIView):
    """
    GET /api/analytics/kpis/ - Returns lightweight real-time operational KPIs
    """

    def get(self, request):
        flights = get_all_flights()
        gates = get_all_gates()

        today_utc = datetime.now(timezone.utc).date()

        total_flights_today = 0
        delayed_flights = 0
        departed_turnarounds = []

        for f in flights:
            arr_dt = _ensure_datetime(f.get("arrival_time"))
            dep_dt = _ensure_datetime(f.get("departure_time"))

            if arr_dt.date() == today_utc:
                total_flights_today += 1

            if f.get("status") == "delayed":
                delayed_flights += 1

            if f.get("status") == "departed" and arr_dt.date() == today_utc:
                turnaround_mins = (dep_dt - arr_dt).total_seconds() / 60.0
                departed_turnarounds.append(turnaround_mins)

        active_gates = [g for g in gates if g.get("status") != "maintenance"]
        occupied_gates = [g for g in gates if g.get("status") == "occupied"]

        avg_turnaround = (
            sum(departed_turnarounds) / len(departed_turnarounds)
            if departed_turnarounds
            else 0.0
        )

        return Response(
            {
                "total_flights_today": total_flights_today,
                "delayed_flights": delayed_flights,
                "occupied_gates": len(occupied_gates),
                "total_active_gates": len(active_gates),
                "avg_turnaround_minutes": round(avg_turnaround, 1),
            },
            status=status.HTTP_200_OK,
        )
