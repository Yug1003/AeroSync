import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from rest_framework.test import APIClient
from seed_demo_data import seed

def test_phase13():
    print("--- Testing Phase 13 Pandas Analytics Endpoint ---")
    client = APIClient()

    # Re-seed data so we have flights and gates loaded
    seed()

    # Call GET /api/analytics/kpis/
    res = client.get("/api/analytics/kpis/")
    print("KPI Analytics Status Code:", res.status_code)
    print("KPI Analytics Response JSON:")
    import json
    print(json.dumps(res.data, indent=2))

    assert res.status_code == 200
    assert "gate_utilization" in res.data
    assert "problem_gates" in res.data
    assert isinstance(res.data["gate_utilization"], list)

    print("\nPhase 13 Pandas Analytics tests passed successfully!")

if __name__ == "__main__":
    test_phase13()
