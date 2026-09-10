import json
import os
from datetime import date, datetime
from typing import Any

from flask import Blueprint, current_app, jsonify, request
from google.cloud import bigquery


PROJECT = os.environ.get(
    "GCP_PROJECT",
    "cloudpolice-506015",
)
DATASET = os.environ.get(
    "BQ_DATASET",
    "cloud_police",
)
INCIDENTS_TABLE = (
    f"`{PROJECT}.{DATASET}.incidents`"
)

from access_control import current_access_user, require_minimum_role
from monitor_service.heartbeat import (
    load_monitoring_snapshot,
    unknown_monitoring_snapshot,
)

dashboard_api = Blueprint(
    "dashboard_api",
    __name__,
    url_prefix="/api",
)


def _client() -> bigquery.Client:
    return bigquery.Client(project=PROJECT)


def _safe_limit() -> int:
    try:
        requested = int(
            request.args.get("limit", "25")
        )
    except ValueError:
        requested = 25

    return min(max(requested, 1), 100)


def _json_value(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, list):
        return [
            _json_value(item)
            for item in value
        ]

    return value


def _row_dict(row: Any) -> dict[str, Any]:
    return {
        key: _json_value(value)
        for key, value in dict(row.items()).items()
    }


def _parse_diagnosis(value: Any) -> Any:
    if not isinstance(value, str):
        return value

    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


def _api_error(message: str):
    current_app.logger.exception(message)

    return jsonify(
        status="error",
        message=message,
    ), 500


@dashboard_api.get("/session")
@require_minimum_role("OPERATOR")
def access_session():
    user = current_access_user()
    role = user["role"]

    return jsonify({
        "status": "ok",
        "user": {
            "email": user["email"],
            "role": role,
        },
        "permissions": {
            "can_view_console": True,
            "can_make_decisions": role in {"APPROVER", "ADMIN"},
            "can_administer": role == "ADMIN",
        },
    })


@dashboard_api.get("/dashboard")
@require_minimum_role("OPERATOR")
def dashboard_summary():
    """Return dashboard totals and scheduled monitoring health."""

    query = f"""
    SELECT
      COUNT(*) AS total_cases,
      COUNTIF(
        status = "AWAITING_HUMAN_APPROVAL"
      ) AS awaiting_human_approval,
      COUNTIF(
        incident_type = "NETWORK_INCIDENT"
      ) AS network_incidents,
      COUNTIF(
        incident_type = "COST_ANOMALY"
      ) AS cost_anomalies,
      COUNTIF(
        incident_type = "CHANGE_RISK"
      ) AS change_risks,
      COUNTIF(
        severity IN ("HIGH", "CRITICAL")
      ) AS high_risk_cases,
      COALESCE(
        SUM(
          IF(
            incident_type = "COST_ANOMALY",
            estimated_monthly_impact_usd,
            0
          )
        ),
        0
      ) AS estimated_monthly_cost_impact_usd,
      MAX(updated_ts) AS last_updated
    FROM {INCIDENTS_TABLE}
    """

    try:
        client = _client()
        row = next(
            iter(client.query(query).result()),
            None,
        )

        summary = (
            _row_dict(row)
            if row is not None
            else {}
        )

        try:
            monitoring = load_monitoring_snapshot(client)
        except Exception:
            current_app.logger.warning(
                "Unable to load monitor heartbeat data.",
                exc_info=True,
            )
            monitoring = unknown_monitoring_snapshot()

        return jsonify(
            status="ok",
            safety_mode="human_approval_required",
            summary=summary,
            monitoring=monitoring,
        )

    except Exception:
        return _api_error(
            "Unable to load dashboard summary."
        )


@dashboard_api.get("/cases")
@require_minimum_role("OPERATOR")
def list_cases():
    """Return filtered incident, cost and change cases."""

    filters = ["1 = 1"]
    parameters = []

    incident_type = request.args.get("type")
    cloud_provider = request.args.get("cloud")
    case_status = request.args.get("status")
    include_details = request.args.get("include", "").strip().lower() == "details"

    if incident_type:
        filters.append(
            "UPPER(incident_type) = "
            "UPPER(@incident_type)"
        )
        parameters.append(
            bigquery.ScalarQueryParameter(
                "incident_type",
                "STRING",
                incident_type,
            )
        )

    if cloud_provider:
        filters.append(
            "UPPER(cloud_provider) = "
            "UPPER(@cloud_provider)"
        )
        parameters.append(
            bigquery.ScalarQueryParameter(
                "cloud_provider",
                "STRING",
                cloud_provider,
            )
        )

    if case_status:
        filters.append(
            "UPPER(status) = UPPER(@case_status)"
        )
        parameters.append(
            bigquery.ScalarQueryParameter(
                "case_status",
                "STRING",
                case_status,
            )
        )

    parameters.append(
        bigquery.ScalarQueryParameter(
            "case_limit",
            "INT64",
            _safe_limit(),
        )
    )

    where_clause = " AND ".join(filters)

    detail_columns = """
      diagnosis,
      root_cause,
      blocking_component,
      evidence_event_ids,
      remediation_terraform,
      escalation_note,
      approved_by,
    """ if include_details else ""

    query = f"""
    SELECT
      incident_id,
      created_ts,
      updated_ts,
      incident_type,
      cloud_provider,
      environment,
      severity,
      status,
      summary,
      {detail_columns}
      affected_resource,
      confidence,
      estimated_monthly_impact_usd,
      approval_status
    FROM {INCIDENTS_TABLE}
    WHERE {where_clause}
    ORDER BY
      CASE severity
        WHEN "CRITICAL" THEN 1
        WHEN "HIGH" THEN 2
        WHEN "MEDIUM" THEN 3
        ELSE 4
      END,
      updated_ts DESC
    LIMIT @case_limit
    """

    try:
        job_config = bigquery.QueryJobConfig(
            query_parameters=parameters
        )

        cases = [
            _row_dict(row)
            for row in _client().query(
                query,
                job_config=job_config,
            ).result()
        ]

        if include_details:
            for case in cases:
                case["diagnosis"] = _parse_diagnosis(case.get("diagnosis"))

        return jsonify(
            status="ok",
            count=len(cases),
            cases=cases,
            details_included=include_details,
        )

    except Exception:
        return _api_error(
            "Unable to load Cloud Police cases."
        )


@dashboard_api.get("/cases/<incident_id>")
@require_minimum_role("OPERATOR")
def case_details(incident_id: str):
    """Return complete evidence and AI analysis."""

    query = f"""
    SELECT
      incident_id,
      created_ts,
      updated_ts,
      incident_type,
      cloud_provider,
      environment,
      severity,
      status,
      summary,
      diagnosis,
      root_cause,
      affected_resource,
      blocking_component,
      confidence,
      evidence_event_ids,
      estimated_monthly_impact_usd,
      remediation_terraform,
      escalation_note,
      approval_status,
      approved_by
    FROM {INCIDENTS_TABLE}
    WHERE incident_id = @incident_id
    LIMIT 1
    """

    try:
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter(
                    "incident_id",
                    "STRING",
                    incident_id,
                )
            ]
        )

        row = next(
            iter(
                _client().query(
                    query,
                    job_config=job_config,
                ).result()
            ),
            None,
        )

        if row is None:
            return jsonify(
                status="error",
                message="Case not found.",
            ), 404

        case = _row_dict(row)
        case["diagnosis"] = _parse_diagnosis(
            case.get("diagnosis")
        )

        return jsonify(
            status="ok",
            case=case,
        )

    except Exception:
        return _api_error(
            "Unable to load case details."
        )


@dashboard_api.get("/approvals")
@require_minimum_role("OPERATOR")
def approval_queue():
    """Return cases waiting for human review."""

    query = f"""
    SELECT
      incident_id,
      updated_ts,
      incident_type,
      cloud_provider,
      environment,
      severity,
      summary,
      affected_resource,
      confidence,
      estimated_monthly_impact_usd,
      approval_status
    FROM {INCIDENTS_TABLE}
    WHERE approval_status = "PENDING_REVIEW"
    ORDER BY
      CASE severity
        WHEN "CRITICAL" THEN 1
        WHEN "HIGH" THEN 2
        WHEN "MEDIUM" THEN 3
        ELSE 4
      END,
      updated_ts DESC
    LIMIT 100
    """

    try:
        cases = [
            _row_dict(row)
            for row in _client().query(
                query
            ).result()
        ]

        return jsonify(
            status="ok",
            count=len(cases),
            cases=cases,
        )

    except Exception:
        return _api_error(
            "Unable to load approval queue."
        )
