from auditlog.models import AuditLog


def log_action(user, action, model_name, object_id, details=None):
    """
    Utility function to explicitly record audit log entries across database operations.
    Handles anonymous/unauthenticated users safely.
    """
    actual_user = user if (user and hasattr(user, 'is_authenticated') and user.is_authenticated) else None
    try:
        return AuditLog.objects.create(
            user=actual_user,
            action=action,
            model_name=model_name,
            object_id=str(object_id),
            details=details,
        )
    except Exception as err:
        print(f"[AuditLog Error] Failed to log action '{action}': {err}")
        return None
