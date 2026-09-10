import hashlib
import os
import re
from datetime import date, datetime
from typing import Any

from flask import Blueprint, current_app, g, jsonify, request
from google.api_core.exceptions import BadRequest
from google.cloud import bigquery

from approval_service.auth import require_admin, require_approver, require_operator
from approval_service.transitions import reopen_error, transition_error


PROJECT = os.environ.get("GCP_PROJECT", "cloudpolice-506015")
DATASET = os.environ.get("BQ_DATASET", "cloud_police")
INCIDENTS_TABLE = f"`{PROJECT}.{DATASET}.incidents`"
DECISIONS_TABLE = f"`{PROJECT}.{DATASET}.approval_decisions`"

VALID_ACTIONS = {
    "APPROVE": ("APPROVED", "APPROVED_FOR_PLANNING"),
    "REJECT": ("REJECTED", "REJECTED"),
    "REQUEST_EVIDENCE": (
        "EVIDENCE_REQUESTED",
        "AWAITING_EVIDENCE",
    ),
}
IDEMPOTENCY_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{8,128}$")
MAX_REASON_LENGTH = 4000

SAFETY_NOTICE = (
    "Decision recorded. Cloud Police did not execute or apply an "
    "infrastructure change."
)
REOPEN_SAFETY_NOTICE = (
    "Case reopened by an administrator for re-review. Cloud Police "
    "did not execute or apply an infrastructure change."
)

approval_api = Blueprint("approval_api", __name__, url_prefix="/api")


def _client() -> bigquery.Client:
    return bigquery.Client(project=PROJECT)


def _json_value(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, list):
        return [_json_value(item) for item in value]
    return value


def _row_dict(row: Any) -> dict[str, Any]:
    return {
        key: _json_value(value)
        for key, value in dict(row.items()).items()
    }


def _error(message: str, status_code: int):
    return jsonify(status="error", message=message), status_code


def _safe_limit() -> int:
    try:
        requested = int(request.args.get("limit", "100"))
    except ValueError:
        requested = 100
    return min(max(requested, 1), 250)


def _decision_id(reviewer_user_id: str, idempotency_key: str) -> str:
    digest = hashlib.sha256(
        f"{reviewer_user_id}:{idempotency_key}".encode("utf-8")
    ).hexdigest()
    return f"DEC-{digest}"


def _idempotency_hash(idempotency_key: str) -> str:
    return hashlib.sha256(idempotency_key.encode("utf-8")).hexdigest()


DECISION_COLUMNS = """
  decision_id,
  incident_id,
  action,
  reason,
  previous_approval_status,
  resulting_approval_status,
  resulting_case_status,
  reviewer_user_id,
  reviewer_email,
  reviewer_name,
  decided_ts,
  identity_issuer,
  identity_provider,
  idempotency_key_hash,
  safety_notice
"""


def _load_decision(
    client: bigquery.Client,
    decision_id: str,
) -> dict[str, Any] | None:
    query = f"""
    SELECT {DECISION_COLUMNS}
    FROM {DECISIONS_TABLE}
    WHERE decision_id = @decision_id
    LIMIT 1
    """
    config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "decision_id", "STRING", decision_id
            )
        ]
    )
    row = next(
        iter(client.query(query, job_config=config).result()),
        None,
    )
    return _row_dict(row) if row is not None else None


def _load_case(
    client: bigquery.Client,
    incident_id: str,
) -> dict[str, Any] | None:
    query = f"""
    SELECT incident_id, status, approval_status
    FROM {INCIDENTS_TABLE}
    WHERE incident_id = @incident_id
    LIMIT 1
    """
    config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "incident_id", "STRING", incident_id
            )
        ]
    )
    row = next(
        iter(client.query(query, job_config=config).result()),
        None,
    )
    return _row_dict(row) if row is not None else None


def _same_request(
    existing: dict[str, Any],
    incident_id: str,
    action: str,
    reason: str,
    reviewer_user_id: str,
) -> bool:
    return (
        existing.get("incident_id") == incident_id
        and existing.get("action") == action
        and (existing.get("reason") or "") == reason
        and existing.get("reviewer_user_id") == reviewer_user_id
    )


def _record_decision(
    client: bigquery.Client,
    *,
    decision_id: str,
    incident_id: str,
    action: str,
    reason: str,
    previous_approval_status: str,
    resulting_approval_status: str,
    resulting_case_status: str,
    reviewer: dict[str, Any],
    idempotency_key: str,
) -> dict[str, Any]:
    query = f"""
    BEGIN TRANSACTION;

    IF NOT EXISTS (
      SELECT 1
      FROM {DECISIONS_TABLE}
      WHERE decision_id = @decision_id
    ) THEN
      ASSERT EXISTS (
        SELECT 1
        FROM {INCIDENTS_TABLE}
        WHERE incident_id = @incident_id
      ) AS "CASE_NOT_FOUND";

      ASSERT NOT EXISTS (
        SELECT 1
        FROM {INCIDENTS_TABLE}
        WHERE incident_id = @incident_id
          AND UPPER(COALESCE(approval_status, ""))
            IN ("APPROVED", "REJECTED")
      ) AS "CASE_ALREADY_HAS_FINAL_DECISION";

      ASSERT EXISTS (
        SELECT 1
        FROM {INCIDENTS_TABLE}
        WHERE incident_id = @incident_id
          AND UPPER(COALESCE(approval_status, ""))
            = @previous_approval_status
      ) AS "CASE_STATE_CHANGED";

      ASSERT (
        (@action = "REQUEST_EVIDENCE"
          AND @previous_approval_status IN (
            "", "PENDING", "PENDING_REVIEW", "AWAITING_APPROVAL"
          ))
        OR
        (@action IN ("APPROVE", "REJECT")
          AND @previous_approval_status IN (
            "", "PENDING", "PENDING_REVIEW", "AWAITING_APPROVAL",
            "EVIDENCE_REQUESTED"
          ))
      ) AS "INVALID_STATE_TRANSITION";

      INSERT INTO {DECISIONS_TABLE} (
        decision_id,
        incident_id,
        action,
        reason,
        previous_approval_status,
        resulting_approval_status,
        resulting_case_status,
        reviewer_user_id,
        reviewer_email,
        reviewer_name,
        decided_ts,
        identity_issuer,
        identity_provider,
        idempotency_key_hash,
        safety_notice
      )
      VALUES (
        @decision_id,
        @incident_id,
        @action,
        @reason,
        @previous_approval_status,
        @resulting_approval_status,
        @resulting_case_status,
        @reviewer_user_id,
        @reviewer_email,
        @reviewer_name,
        CURRENT_TIMESTAMP(),
        @identity_issuer,
        @identity_provider,
        @idempotency_key_hash,
        @safety_notice
      );

      UPDATE {INCIDENTS_TABLE}
      SET
        updated_ts = CURRENT_TIMESTAMP(),
        status = @resulting_case_status,
        approval_status = @resulting_approval_status,
        approved_by = IF(
          @action = "APPROVE",
          @reviewer_email,
          NULL
        )
      WHERE incident_id = @incident_id;
    END IF;

    COMMIT TRANSACTION;
    """
    provider_claims = reviewer.get("firebase") or {}
    identity_provider = (
        provider_claims.get("sign_in_provider")
        if isinstance(provider_claims, dict)
        else None
    )
    parameters = [
        bigquery.ScalarQueryParameter(
            "decision_id", "STRING", decision_id
        ),
        bigquery.ScalarQueryParameter(
            "incident_id", "STRING", incident_id
        ),
        bigquery.ScalarQueryParameter("action", "STRING", action),
        bigquery.ScalarQueryParameter("reason", "STRING", reason),
        bigquery.ScalarQueryParameter(
            "previous_approval_status",
            "STRING",
            previous_approval_status,
        ),
        bigquery.ScalarQueryParameter(
            "resulting_approval_status",
            "STRING",
            resulting_approval_status,
        ),
        bigquery.ScalarQueryParameter(
            "resulting_case_status",
            "STRING",
            resulting_case_status,
        ),
        bigquery.ScalarQueryParameter(
            "reviewer_user_id",
            "STRING",
            reviewer["reviewer_id"],
        ),
        bigquery.ScalarQueryParameter(
            "reviewer_email",
            "STRING",
            reviewer["reviewer_email"],
        ),
        bigquery.ScalarQueryParameter(
            "reviewer_name",
            "STRING",
            str(reviewer.get("name") or "").strip() or None,
        ),
        bigquery.ScalarQueryParameter(
            "identity_issuer", "STRING", reviewer.get("iss")
        ),
        bigquery.ScalarQueryParameter(
            "identity_provider", "STRING", identity_provider
        ),
        bigquery.ScalarQueryParameter(
            "idempotency_key_hash",
            "STRING",
            _idempotency_hash(idempotency_key),
        ),
        bigquery.ScalarQueryParameter(
            "safety_notice", "STRING", SAFETY_NOTICE
        ),
    ]
    client.query(
        query,
        job_config=bigquery.QueryJobConfig(
            query_parameters=parameters
        ),
    ).result()

    saved = _load_decision(client, decision_id)
    if saved is None:
        raise RuntimeError(
            "The decision was not found after it was recorded."
        )
    return saved


def _record_reopen(
    client: bigquery.Client,
    *,
    decision_id: str,
    incident_id: str,
    reason: str,
    previous_approval_status: str,
    reviewer: dict[str, Any],
    idempotency_key: str,
) -> dict[str, Any]:
    """Move a finalized case back to PENDING_REVIEW as an audited admin action.

    This is intentionally a separate transaction from _record_decision,
    with its own precondition (the case must currently BE final), so the
    normal approve/reject path's "a final case can never be touched again"
    guarantee is never weakened by this admin override existing.
    """

    query = f"""
    BEGIN TRANSACTION;

    IF NOT EXISTS (
      SELECT 1
      FROM {DECISIONS_TABLE}
      WHERE decision_id = @decision_id
    ) THEN
      ASSERT EXISTS (
        SELECT 1
        FROM {INCIDENTS_TABLE}
        WHERE incident_id = @incident_id
      ) AS "CASE_NOT_FOUND";

      ASSERT EXISTS (
        SELECT 1
        FROM {INCIDENTS_TABLE}
        WHERE incident_id = @incident_id
          AND UPPER(COALESCE(approval_status, ""))
            = @previous_approval_status
      ) AS "CASE_STATE_CHANGED";

      ASSERT (
        @previous_approval_status IN ("APPROVED", "REJECTED")
      ) AS "CASE_NOT_FINAL";

      INSERT INTO {DECISIONS_TABLE} (
        decision_id,
        incident_id,
        action,
        reason,
        previous_approval_status,
        resulting_approval_status,
        resulting_case_status,
        reviewer_user_id,
        reviewer_email,
        reviewer_name,
        decided_ts,
        identity_issuer,
        identity_provider,
        idempotency_key_hash,
        safety_notice
      )
      VALUES (
        @decision_id,
        @incident_id,
        "REOPEN",
        @reason,
        @previous_approval_status,
        "PENDING_REVIEW",
        "AWAITING_HUMAN_APPROVAL",
        @reviewer_user_id,
        @reviewer_email,
        @reviewer_name,
        CURRENT_TIMESTAMP(),
        @identity_issuer,
        @identity_provider,
        @idempotency_key_hash,
        @safety_notice
      );

      UPDATE {INCIDENTS_TABLE}
      SET
        updated_ts = CURRENT_TIMESTAMP(),
        status = "AWAITING_HUMAN_APPROVAL",
        approval_status = "PENDING_REVIEW",
        approved_by = NULL
      WHERE incident_id = @incident_id;
    END IF;

    COMMIT TRANSACTION;
    """
    provider_claims = reviewer.get("firebase") or {}
    identity_provider = (
        provider_claims.get("sign_in_provider")
        if isinstance(provider_claims, dict)
        else None
    )
    parameters = [
        bigquery.ScalarQueryParameter(
            "decision_id", "STRING", decision_id
        ),
        bigquery.ScalarQueryParameter(
            "incident_id", "STRING", incident_id
        ),
        bigquery.ScalarQueryParameter("reason", "STRING", reason),
        bigquery.ScalarQueryParameter(
            "previous_approval_status",
            "STRING",
            previous_approval_status,
        ),
        bigquery.ScalarQueryParameter(
            "reviewer_user_id",
            "STRING",
            reviewer["reviewer_id"],
        ),
        bigquery.ScalarQueryParameter(
            "reviewer_email",
            "STRING",
            reviewer["reviewer_email"],
        ),
        bigquery.ScalarQueryParameter(
            "reviewer_name",
            "STRING",
            str(reviewer.get("name") or "").strip() or None,
        ),
        bigquery.ScalarQueryParameter(
            "identity_issuer", "STRING", reviewer.get("iss")
        ),
        bigquery.ScalarQueryParameter(
            "identity_provider", "STRING", identity_provider
        ),
        bigquery.ScalarQueryParameter(
            "idempotency_key_hash",
            "STRING",
            _idempotency_hash(idempotency_key),
        ),
        bigquery.ScalarQueryParameter(
            "safety_notice", "STRING", REOPEN_SAFETY_NOTICE
        ),
    ]
    client.query(
        query,
        job_config=bigquery.QueryJobConfig(
            query_parameters=parameters
        ),
    ).result()

    saved = _load_decision(client, decision_id)
    if saved is None:
        raise RuntimeError(
            "The reopen action was not found after it was recorded."
        )
    return saved


@approval_api.post("/cases/<incident_id>/decisions")
@approval_api.post("/approvals/<incident_id>/decision")
@require_approver
def record_approval_decision(incident_id: str):
    """Verify the reviewer and persist one human decision."""

    if not incident_id.strip() or len(incident_id) > 256:
        return _error("A valid case ID is required.", 400)

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return _error("A JSON decision body is required.", 400)

    action = str(
        payload.get("action") or payload.get("decision") or ""
    ).strip().upper()
    action_aliases = {
        "APPROVED": "APPROVE",
        "REJECTED": "REJECT",
        "EVIDENCE_REQUESTED": "REQUEST_EVIDENCE",
    }
    action = action_aliases.get(action, action)
    reason = str(
        payload.get("reason") or payload.get("evidence_request") or ""
    ).strip()
    idempotency_key = str(
        request.headers.get("Idempotency-Key")
        or payload.get("idempotency_key")
        or ""
    ).strip()

    if action not in VALID_ACTIONS:
        return _error(
            "Action must be APPROVE, REJECT or REQUEST_EVIDENCE.",
            400,
        )
    if len(reason) > MAX_REASON_LENGTH:
        return _error(
            "Decision notes must be 4,000 characters or fewer.",
            400,
        )
    if action in {"REJECT", "REQUEST_EVIDENCE"} and len(reason) < 5:
        return _error(
            "A short reason is required for this decision.",
            400,
        )
    if not reason:
        reason = "Reviewed and approved for engineering planning."
    if not IDEMPOTENCY_PATTERN.fullmatch(idempotency_key):
        return _error(
            "A valid Idempotency-Key header is required.",
            400,
        )

    reviewer = g.reviewer
    decision_id = _decision_id(
        reviewer["reviewer_id"], idempotency_key
    )

    try:
        client = _client()
        existing = _load_decision(client, decision_id)
        if existing is not None:
            if not _same_request(
                existing,
                incident_id,
                action,
                reason,
                reviewer["reviewer_id"],
            ):
                return _error(
                    "This request key was already used for a different decision.",
                    409,
                )
            return jsonify(
                status="ok",
                repeated_request=True,
                decision=existing,
            )

        case = _load_case(client, incident_id)
        if case is None:
            return _error("Case not found.", 404)

        previous_approval_status = str(
            case.get("approval_status") or "PENDING_REVIEW"
        ).upper()
        invalid_transition = transition_error(
            previous_approval_status,
            action,
        )
        if invalid_transition:
            return _error(invalid_transition, 409)

        resulting_approval, resulting_status = VALID_ACTIONS[action]
        saved = _record_decision(
            client,
            decision_id=decision_id,
            incident_id=incident_id,
            action=action,
            reason=reason,
            previous_approval_status=previous_approval_status,
            resulting_approval_status=resulting_approval,
            resulting_case_status=resulting_status,
            reviewer=reviewer,
            idempotency_key=idempotency_key,
        )
        return jsonify(
            status="ok",
            repeated_request=False,
            decision=saved,
        ), 201
    except BadRequest as error:
        error_text = str(error)
        if "CASE_STATE_CHANGED" in error_text:
            return _error(
                "The case changed while this decision was being saved. Refresh and try again.",
                409,
            )
        if (
            "INVALID_STATE_TRANSITION" in error_text
            or "CASE_ALREADY_HAS_FINAL_DECISION" in error_text
        ):
            return _error(
                "This decision is no longer allowed for the case's current state.",
                409,
            )
        current_app.logger.exception(
            "BigQuery rejected the approval decision."
        )
        return _error(
            "The decision could not be saved. Please try again.",
            500,
        )
    except Exception:
        current_app.logger.exception(
            "Unable to record approval decision."
        )
        return _error(
            "The decision could not be saved. Please try again.",
            500,
        )


@approval_api.post("/cases/<incident_id>/reopen")
@require_admin
def reopen_case(incident_id: str):
    """Allow an admin to reopen a finalized case for re-review.

    This never mutates history: the original decision row stays exactly
    as it was, and this action is appended to the same append-only
    decisions table with action="REOPEN", so the full sequence of what
    happened is always visible.
    """

    if not incident_id.strip() or len(incident_id) > 256:
        return _error("A valid case ID is required.", 400)

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return _error(
            "A JSON body with a reason is required.", 400
        )

    reason = str(payload.get("reason") or "").strip()
    idempotency_key = str(
        request.headers.get("Idempotency-Key")
        or payload.get("idempotency_key")
        or ""
    ).strip()

    if len(reason) < 5:
        return _error(
            "A reason of at least 5 characters is required "
            "to reopen a case.",
            400,
        )
    if len(reason) > MAX_REASON_LENGTH:
        return _error(
            "Reason must be 4,000 characters or fewer.", 400
        )
    if not IDEMPOTENCY_PATTERN.fullmatch(idempotency_key):
        return _error(
            "A valid Idempotency-Key header is required.", 400
        )

    reviewer = g.reviewer
    decision_id = _decision_id(
        reviewer["reviewer_id"], idempotency_key
    )

    try:
        client = _client()
        existing = _load_decision(client, decision_id)
        if existing is not None:
            if not _same_request(
                existing,
                incident_id,
                "REOPEN",
                reason,
                reviewer["reviewer_id"],
            ):
                return _error(
                    "This request key was already used for a "
                    "different decision.",
                    409,
                )
            return jsonify(
                status="ok",
                repeated_request=True,
                decision=existing,
            )

        case = _load_case(client, incident_id)
        if case is None:
            return _error("Case not found.", 404)

        previous_approval_status = str(
            case.get("approval_status") or ""
        ).upper()

        invalid = reopen_error(previous_approval_status)
        if invalid:
            return _error(invalid, 409)

        saved = _record_reopen(
            client,
            decision_id=decision_id,
            incident_id=incident_id,
            reason=reason,
            previous_approval_status=previous_approval_status,
            reviewer=reviewer,
            idempotency_key=idempotency_key,
        )
        return jsonify(
            status="ok",
            repeated_request=False,
            decision=saved,
        ), 201
    except BadRequest as error:
        error_text = str(error)
        if "CASE_STATE_CHANGED" in error_text:
            return _error(
                "The case changed while this was being saved. "
                "Refresh and try again.",
                409,
            )
        if "CASE_NOT_FINAL" in error_text:
            return _error(
                "Only a finalized (approved or rejected) case "
                "can be reopened.",
                409,
            )
        current_app.logger.exception(
            "BigQuery rejected the reopen request."
        )
        return _error(
            "The case could not be reopened. Please try again.",
            500,
        )
    except Exception:
        current_app.logger.exception("Unable to reopen case.")
        return _error(
            "The case could not be reopened. Please try again.",
            500,
        )


def _list_decisions(incident_id: str | None = None):
    where_clause = ""
    parameters: list[Any] = [
        bigquery.ScalarQueryParameter(
            "decision_limit", "INT64", _safe_limit()
        )
    ]
    if incident_id is not None:
        where_clause = "WHERE incident_id = @incident_id"
        parameters.append(
            bigquery.ScalarQueryParameter(
                "incident_id", "STRING", incident_id
            )
        )

    query = f"""
    SELECT {DECISION_COLUMNS}
    FROM {DECISIONS_TABLE}
    {where_clause}
    ORDER BY decided_ts DESC
    LIMIT @decision_limit
    """
    try:
        rows = [
            _row_dict(row)
            for row in _client().query(
                query,
                job_config=bigquery.QueryJobConfig(
                    query_parameters=parameters
                ),
            ).result()
        ]
        return jsonify(
            status="ok", count=len(rows), decisions=rows
        )
    except Exception:
        current_app.logger.exception(
            "Unable to load approval history."
        )
        return _error(
            "Approval history could not be loaded.", 500
        )


@approval_api.get("/approval-decisions")
@require_operator
def list_approval_decisions():
    """Return recent decisions for the authenticated console."""

    return _list_decisions()


@approval_api.get("/cases/<incident_id>/decisions")
@require_operator
def list_case_approval_decisions(incident_id: str):
    """Return the append-only decision history for one case."""

    return _list_decisions(incident_id)
