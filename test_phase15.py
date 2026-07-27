import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerosync_backend.settings")
django.setup()

from rest_framework.test import APIClient
from auditlog.models import AuditLog
from auditlog.utils import log_action

def test_phase15():
    print("--- Testing Phase 15 Audit Log ---")
    client = APIClient()

    # Clear AuditLog table
    AuditLog.objects.all().delete()

    # 1. Manually trigger log_action
    log_action(None, "manual_test_action", "Flight", "test_id_123", {"note": "Phase 15 Test"})

    # 2. Fetch via GET /api/audit-log/
    res = client.get("/api/audit-log/")
    print("Audit Log Status Code:", res.status_code)
    print("Audit Log Response Count:", len(res.data))
    print("Audit Log Latest Entry:", res.data[0] if res.data else None)

    assert res.status_code == 200
    assert len(res.data) >= 1
    assert res.data[0]["action"] == "manual_test_action"

    print("\nPhase 15 Audit Log tests passed successfully!")

if __name__ == "__main__":
    test_phase15()
