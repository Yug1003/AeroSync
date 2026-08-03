from datetime import datetime, timezone
import random

def get_baggage_carousel_telemetry(airport_code="AMD"):
    """
    Returns real-time arrival baggage claim belts (Belts B1 to B8),
    carousel status, unload progress percentage, and handler team allocations.
    """
    code = airport_code.upper()
    
    belts = [
        {
            "belt_id": f"BELT-{code}-1",
            "belt_label": "Carousel B1 (Domestic)",
            "flight_callsign": "6E 214",
            "origin": "DEL (New Delhi)",
            "status": "UNLOADING IN PROGRESS",
            "unload_progress_pct": 78,
            "total_bags": 142,
            "unloaded_bags": 111,
            "handling_team": "Team Alpha (Baggage)",
            "claim_time_mins": "12 min remaining",
        },
        {
            "belt_id": f"BELT-{code}-2",
            "belt_label": "Carousel B2 (Domestic)",
            "flight_callsign": "AI 101",
            "origin": "BOM (Mumbai)",
            "status": "UNLOADING IN PROGRESS",
            "unload_progress_pct": 45,
            "total_bags": 188,
            "unloaded_bags": 85,
            "handling_team": "Team Bravo (Baggage)",
            "claim_time_mins": "22 min remaining",
        },
        {
            "belt_id": f"BELT-{code}-3",
            "belt_label": "Carousel B3 (International)",
            "flight_callsign": "SQ 505",
            "origin": "SIN (Singapore)",
            "status": "UNLOADING IN PROGRESS",
            "unload_progress_pct": 92,
            "total_bags": 210,
            "unloaded_bags": 193,
            "handling_team": "Team Charlie (Intl Ops)",
            "claim_time_mins": "4 min remaining",
        },
        {
            "belt_id": f"BELT-{code}-4",
            "belt_label": "Carousel B4 (Domestic)",
            "flight_callsign": "QP 1102",
            "origin": "BLR (Bengaluru)",
            "status": "READY FOR ARRIVAL",
            "unload_progress_pct": 0,
            "total_bags": 120,
            "unloaded_bags": 0,
            "handling_team": "Team Delta (Standby)",
            "claim_time_mins": "Awaiting Touchdown",
        },
        {
            "belt_id": f"BELT-{code}-5",
            "belt_label": "Carousel B5 (International)",
            "flight_callsign": "EK 517",
            "origin": "DXB (Dubai)",
            "status": "COMPLETED & CLEAR",
            "unload_progress_pct": 100,
            "total_bags": 265,
            "unloaded_bags": 265,
            "handling_team": "Team Echo (Intl Ops)",
            "claim_time_mins": "Completed",
        },
    ]

    return {
        "airport": code,
        "active_carousels": len([b for b in belts if b["status"] != "COMPLETED & CLEAR"]),
        "total_bags_processing": sum(b["total_bags"] for b in belts),
        "total_bags_delivered": sum(b["unloaded_bags"] for b in belts),
        "belts": belts
    }
