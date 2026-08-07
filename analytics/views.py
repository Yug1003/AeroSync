from datetime import datetime, timezone
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from flights.services import get_all_flights
from gates.services import get_all_gates


class KPIAnalyticsView(APIView):
    """
    GET /api/analytics/kpis/ - Advanced operational analytics powered by Pandas
    Reads flight & gate data from database models, converts into DataFrames, and performs
    in-memory data wrangling, grouping, and statistical metrics calculation.
    """

    def get(self, request):
        flights = get_all_flights()
        gates = get_all_gates()

        # Step 1: Load MongoDB document lists into Pandas DataFrames
        df_flights = pd.DataFrame(flights)
        df_gates = pd.DataFrame(gates)

        # Handle empty database cases cleanly
        if df_gates.empty:
            return Response(
                {
                    "total_flights_today": 0,
                    "delayed_flights": 0,
                    "occupied_gates": 0,
                    "total_active_gates": 0,
                    "avg_turnaround_minutes": 0.0,
                    "gate_utilization": [],
                    "problem_gates": [],
                },
                status=status.HTTP_200_OK,
            )

        # Step 2: Manual relational join (Map MongoDB gate_id string -> Gate Label string)
        gate_label_map = {str(g["_id"]): g["label"] for g in gates}
        
        if not df_flights.empty:
            df_flights["gate_label"] = df_flights["gate_id"].map(gate_label_map).fillna("Unassigned")

            # Step 3: Convert arrival_time and departure_time strings/datetimes to Pandas datetime objects
            df_flights["arrival_time"] = pd.to_datetime(df_flights["arrival_time"], utc=True)
            df_flights["departure_time"] = pd.to_datetime(df_flights["departure_time"], utc=True)

            # Step 4: Calculate Turnaround Duration in minutes using Pandas Series subtraction
            df_flights["turnaround_mins"] = (
                df_flights["departure_time"] - df_flights["arrival_time"]
            ).dt.total_seconds() / 60.0

            # Step 5: Filter Today's flights using Pandas date accessor
            today_utc = pd.Timestamp.now(tz="UTC").date()
            df_today = df_flights[df_flights["arrival_time"].dt.date == today_utc]
            total_flights_today = int(len(df_today))

            # Step 6: Count Delayed flights
            delayed_flights = int((df_flights["status"] == "delayed").sum())

            # Step 7: Average turnaround time across all departed flights
            departed_df = df_flights[df_flights["status"] == "departed"]
            avg_turnaround_minutes = (
                float(departed_df["turnaround_mins"].mean())
                if not departed_df.empty
                else 0.0
            )

            # Step 8: Compute Gate Utilization (Flights Handled per Gate) via GroupBy
            utilization_series = df_flights[df_flights["gate_id"].notna()].groupby("gate_label").size()
            
            # Ensure every gate in df_gates appears in utilization list (even with 0 flights)
            gate_utilization = []
            for g in gates:
                g_label = g["label"]
                count = int(utilization_series.get(g_label, 0))
                gate_utilization.append({"gate": g_label, "flights_handled": count})

            # Step 9: Flag Problem Gates (> 1 Standard Deviation above mean turnaround time)
            problem_gates = []
            if len(departed_df) >= 2:
                overall_mean = departed_df["turnaround_mins"].mean()
                overall_std = departed_df["turnaround_mins"].std()
                threshold = overall_mean + overall_std

                gate_turnarounds = (
                    departed_df.groupby("gate_label")["turnaround_mins"].mean()
                )
                flagged = gate_turnarounds[gate_turnarounds > threshold]
                problem_gates = list(flagged.index)
        else:
            total_flights_today = 0
            delayed_flights = 0
            avg_turnaround_minutes = 0.0
            gate_utilization = [{"gate": g["label"], "flights_handled": 0} for g in gates]
            problem_gates = []

        # Gate metrics from df_gates
        occupied_gates = int((df_gates["status"] == "occupied").sum())
        total_active_gates = int((df_gates["status"] != "maintenance").sum())

        return Response(
            {
                "total_flights_today": total_flights_today,
                "delayed_flights": delayed_flights,
                "occupied_gates": occupied_gates,
                "total_active_gates": total_active_gates,
                "avg_turnaround_minutes": round(avg_turnaround_minutes, 1),
                "gate_utilization": gate_utilization,
                "problem_gates": problem_gates,
            },
            status=status.HTTP_200_OK,
        )
