import os
import uuid
from datetime import datetime, timezone
from typing import Any

from google.cloud import bigquery


PROJECT = os.environ.get("GCP_PROJECT", "cloudpolice-506015")
DATASET = os.environ.get("BQ_DATASET", "cloud_police")
AUDIT_TABLE = os.environ.get(
    "ADMIN_AUDIT_TABLE",
    f"{PROJECT}.{DATASET}.admin_user_audit",
)


def record_admin_action(
    *,
    action: str,
    actor: dict[str, Any],
    target_user: dict[str, Any],
    previous_role: str | None = None,
    previous_disabled: bool | None = None,
    reason: str = "",
) -> str:
    """Write one append-only administration audit event."""

    audit_id = f"AUD-{uuid.uuid4().hex}"
    row = {
        "audit_id": audit_id,
        "action": action.strip().upper(),
        "actor_user_id": str(actor.get("user_id") or ""),
        "actor_email": str(actor.get("email") or "").lower(),
        "target_user_id": str(target_user.get("user_id") or ""),
        "target_email": str(target_user.get("email") or "").lower(),
        "previous_role": previous_role,
        "new_role": target_user.get("role"),
        "previous_disabled": previous_disabled,
        "new_disabled": bool(target_user.get("disabled")),
        "reason": reason.strip() or None,
        "performed_at": datetime.now(timezone.utc).isoformat(),
    }

    errors = bigquery.Client(project=PROJECT).insert_rows_json(
        AUDIT_TABLE,
        [row],
        row_ids=[audit_id],
    )

    if errors:
        raise RuntimeError(
            f"BigQuery rejected the admin audit record: {errors}"
        )

    return audit_id
