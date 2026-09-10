import json
import os
from typing import Any

from google.cloud import bigquery
from monitor_service.safety import sanitize_network_outputs


PROJECT = os.environ.get("GCP_PROJECT", "cloudpolice-506015")
DATASET = os.environ.get("BQ_DATASET", "cloud_police")
INCIDENTS_TABLE = f"`{PROJECT}.{DATASET}.incidents`"
CONNECTIVITY_TESTS_TABLE = f"`{PROJECT}.{DATASET}.connectivity_tests`"
COST_EVENTS_TABLE = f"`{PROJECT}.{DATASET}.cost_events`"
FIREWALL_LOGS_TABLE = f"`{PROJECT}.{DATASET}.firewall_logs`"
PROPOSED_CHANGES_TABLE = f"`{PROJECT}.{DATASET}.proposed_changes`"
TERRAFORM_DIFFS_TABLE = f"`{PROJECT}.{DATASET}.terraform_diffs`"

VALID_SEVERITIES = {
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
}


def _as_dict(value: Any) -> dict[str, Any]:
    """Convert ADK state values into a normal dictionary."""

    if isinstance(value, dict):
        return value

    if hasattr(value, "model_dump"):
        return value.model_dump()

    if isinstance(value, str):
        try:
            parsed = json.loads(value)

            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            return {}

    return {}


def _string_list(value: Any) -> list[str]:
    """Return a clean list of evidence identifiers."""

    if not isinstance(value, list):
        return []

    return [
        str(item).strip()
        for item in value
        if str(item).strip()
    ]


def _merge_evidence_ids(*values: Any) -> list[str]:
    """Merge evidence identifiers in source order without duplicates."""

    merged: list[str] = []
    seen: set[str] = set()

    for value in values:
        for evidence_id in _string_list(value):
            if evidence_id in seen:
                continue
            seen.add(evidence_id)
            merged.append(evidence_id)

    return merged


def _safe_float(value: Any) -> float | None:
    """Convert a numeric value safely."""

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_confidence(value: Any) -> float | None:
    """Keep confidence inside the valid zero-to-one range."""

    confidence = _safe_float(value)

    if confidence is None:
        return None

    return min(max(confidence, 0.0), 1.0)


def _safe_severity(value: Any) -> str:
    """Return only a supported severity."""

    severity = str(value or "MEDIUM").upper()

    if severity not in VALID_SEVERITIES:
        return "MEDIUM"

    return severity


def _json_text(value: Any) -> str:
    """Serialize structured agent output for BigQuery."""

    return json.dumps(
        value,
        ensure_ascii=False,
        default=str,
    )


def _validated_evidence_ids(
    client: bigquery.Client,
    evidence_ids: list[str],
) -> list[str]:
    """Keep candidate identifiers that exist in an evidence table."""

    if not evidence_ids:
        return []

    query = f"""
    SELECT test_id AS evidence_id FROM {CONNECTIVITY_TESTS_TABLE}
    WHERE test_id IN UNNEST(@candidate_evidence_ids)
    UNION DISTINCT
    SELECT cost_id FROM {COST_EVENTS_TABLE}
    WHERE cost_id IN UNNEST(@candidate_evidence_ids)
    UNION DISTINCT
    SELECT event_id FROM {FIREWALL_LOGS_TABLE}
    WHERE event_id IN UNNEST(@candidate_evidence_ids)
    UNION DISTINCT
    SELECT change_id FROM {PROPOSED_CHANGES_TABLE}
    WHERE change_id IN UNNEST(@candidate_evidence_ids)
    UNION DISTINCT
    SELECT diff_id FROM {TERRAFORM_DIFFS_TABLE}
    WHERE diff_id IN UNNEST(@candidate_evidence_ids)
    UNION DISTINCT
    SELECT incident_id FROM {TERRAFORM_DIFFS_TABLE}
    WHERE incident_id IN UNNEST(@candidate_evidence_ids)
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ArrayQueryParameter(
                "candidate_evidence_ids",
                "STRING",
                evidence_ids,
            )
        ]
    )
    existing_ids = {
        str(row["evidence_id"])
        for row in client.query(
            query,
            job_config=job_config,
        ).result()
    }
    return [
        evidence_id
        for evidence_id in evidence_ids
        if evidence_id in existing_ids
    ]


def _prepare_network_result(
    agent_state: dict[str, Any],
) -> dict[str, Any]:
    diagnosis = _as_dict(
        agent_state.get("diagnosis_result")
    )
    remediation = _as_dict(
        agent_state.get("remediation_result")
    )

    if not diagnosis and not remediation:
        raise ValueError(
            "Network workflow returned no diagnosis or remediation."
        )

    diagnosis, remediation = sanitize_network_outputs(
        diagnosis,
        remediation,
    )

    evidence_ids = _merge_evidence_ids(
        diagnosis.get("evidence_event_ids"),
        remediation.get("evidence_ids"),
    )

    return {
        "severity": _safe_severity(
            diagnosis.get("severity")
        ),
        "diagnosis": _json_text(
            {
                "diagnosis": diagnosis,
                "remediation": remediation,
            }
        ),
        "root_cause": diagnosis.get("root_cause"),
        "affected_resource": diagnosis.get(
            "affected_resource"
        ),
        "blocking_component": diagnosis.get(
            "blocking_component"
        ),
        "confidence": _safe_confidence(
            diagnosis.get("confidence")
        ),
        "evidence_ids": evidence_ids,
        "estimated_monthly_impact_usd": None,
        "remediation_terraform": remediation.get(
            "terraform_change_draft"
        ),
        "escalation_note": remediation.get(
            "escalation_note"
        ),
    }


def _prepare_cost_result(
    agent_state: dict[str, Any],
) -> dict[str, Any]:
    cost_result = _as_dict(
        agent_state.get("cost_result")
    )

    if not cost_result:
        raise ValueError(
            "Cost Agent returned no structured result."
        )

    evidence_ids = _string_list(
        cost_result.get("evidence_cost_ids")
        or cost_result.get("evidence_ids")
    )

    return {
        "severity": _safe_severity(
            cost_result.get("severity")
        ),
        "diagnosis": _json_text(cost_result),
        "root_cause": cost_result.get("likely_cause"),
        "affected_resource": cost_result.get(
            "resource_name"
        ),
        "blocking_component": cost_result.get(
            "service"
        ),
        "confidence": _safe_confidence(
            cost_result.get("confidence")
        ),
        "evidence_ids": evidence_ids,
        "estimated_monthly_impact_usd": _safe_float(
            cost_result.get(
                "estimated_monthly_extra_usd"
            )
        ),
        "remediation_terraform": None,
        "escalation_note": cost_result.get(
            "recommended_next_action"
        ),
    }


def _prepare_change_result(
    agent_state: dict[str, Any],
) -> dict[str, Any]:
    change_result = _as_dict(
        agent_state.get("change_inspection_result")
    )

    if not change_result:
        raise ValueError(
            "Cloud Inspector returned no structured result."
        )

    required_checks = _string_list(
        change_result.get("required_human_checks")
    )

    escalation_note = (
        "Recommendation: "
        + str(
            change_result.get(
                "recommendation",
                "HUMAN_REVIEW_REQUIRED",
            )
        )
    )

    if required_checks:
        escalation_note += (
            ". Required checks: "
            + "; ".join(required_checks)
        )

    return {
        "severity": _safe_severity(
            change_result.get("risk_level")
        ),
        "diagnosis": _json_text(change_result),
        "root_cause": change_result.get(
            "predicted_impact"
        ),
        "affected_resource": change_result.get(
            "resource_address"
        ),
        "blocking_component": change_result.get(
            "change_type"
        ),
        "confidence": _safe_confidence(
            change_result.get("confidence")
        ),
        "evidence_ids": _string_list(
            change_result.get(
                "supporting_evidence_ids"
            )
        ),
        "estimated_monthly_impact_usd": _safe_float(
            change_result.get(
                "estimated_monthly_cost_change_usd"
            )
        ),
        "remediation_terraform": None,
        "escalation_note": escalation_note,
    }


def prepare_saved_result(
    incident_type: str,
    agent_state: dict[str, Any],
) -> dict[str, Any]:
    """Map the relevant agent output into incident fields."""

    if incident_type == "NETWORK_INCIDENT":
        return _prepare_network_result(agent_state)

    if incident_type == "COST_ANOMALY":
        return _prepare_cost_result(agent_state)

    if incident_type == "CHANGE_RISK":
        return _prepare_change_result(agent_state)

    raise ValueError(
        f"Unsupported incident type: {incident_type}"
    )


def save_agent_result(
    incident_id: str,
    incident_type: str,
    agent_state: dict[str, Any],
) -> bool:
    """Save a completed AI analysis into BigQuery."""

    result = prepare_saved_result(
        incident_type=incident_type,
        agent_state=agent_state,
    )
    client = bigquery.Client(project=PROJECT)
    result["evidence_ids"] = _validated_evidence_ids(
        client,
        result["evidence_ids"],
    )

    query = f"""
    UPDATE {INCIDENTS_TABLE}
    SET
      updated_ts = CURRENT_TIMESTAMP(),
      severity = @severity,
      status = "AWAITING_HUMAN_APPROVAL",
      diagnosis = @diagnosis,
      root_cause = COALESCE(
        @root_cause,
        root_cause
      ),
      affected_resource = COALESCE(
        @affected_resource,
        affected_resource
      ),
      blocking_component = COALESCE(
        @blocking_component,
        blocking_component
      ),
      confidence = COALESCE(
        @confidence,
        confidence
      ),
      evidence_event_ids = ARRAY(
        SELECT evidence_id
        FROM UNNEST(
          ARRAY_CONCAT(
            IFNULL(evidence_event_ids, ARRAY<STRING>[]),
            @evidence_ids
          )
        ) AS evidence_id WITH OFFSET AS source_order
        QUALIFY ROW_NUMBER() OVER (
          PARTITION BY evidence_id
          ORDER BY source_order
        ) = 1
        ORDER BY source_order
      ),
      estimated_monthly_impact_usd = COALESCE(
        @estimated_monthly_impact_usd,
        estimated_monthly_impact_usd
      ),
      remediation_terraform = COALESCE(
        @remediation_terraform,
        remediation_terraform
      ),
      escalation_note = COALESCE(
        @escalation_note,
        escalation_note
      ),
      approval_status = "PENDING_REVIEW"
    WHERE incident_id = @incident_id
    """

    parameters = [
        bigquery.ScalarQueryParameter(
            "incident_id",
            "STRING",
            incident_id,
        ),
        bigquery.ScalarQueryParameter(
            "severity",
            "STRING",
            result["severity"],
        ),
        bigquery.ScalarQueryParameter(
            "diagnosis",
            "STRING",
            result["diagnosis"],
        ),
        bigquery.ScalarQueryParameter(
            "root_cause",
            "STRING",
            result["root_cause"],
        ),
        bigquery.ScalarQueryParameter(
            "affected_resource",
            "STRING",
            result["affected_resource"],
        ),
        bigquery.ScalarQueryParameter(
            "blocking_component",
            "STRING",
            result["blocking_component"],
        ),
        bigquery.ScalarQueryParameter(
            "confidence",
            "FLOAT64",
            result["confidence"],
        ),
        bigquery.ArrayQueryParameter(
            "evidence_ids",
            "STRING",
            result["evidence_ids"],
        ),
        bigquery.ScalarQueryParameter(
            "estimated_monthly_impact_usd",
            "FLOAT64",
            result["estimated_monthly_impact_usd"],
        ),
        bigquery.ScalarQueryParameter(
            "remediation_terraform",
            "STRING",
            result["remediation_terraform"],
        ),
        bigquery.ScalarQueryParameter(
            "escalation_note",
            "STRING",
            result["escalation_note"],
        ),
    ]

    job_config = bigquery.QueryJobConfig(
        query_parameters=parameters
    )

    query_job = client.query(
        query,
        job_config=job_config,
    )
    query_job.result()

    return (
        query_job.num_dml_affected_rows == 1
    )


def record_analysis_failure(
    incident_id: str,
    status: str,
) -> bool:
    """Persist a safe terminal state for an AI analysis failure."""

    normalized_status = status.strip().upper()
    notes = {
        "ANALYSIS_TIMEOUT": (
            "Automated analysis reached its time limit. Human review or a "
            "manual retry is required; no infrastructure change was made."
        ),
        "ANALYSIS_FAILED": (
            "Automated analysis failed safely. Human review or a manual "
            "retry is required; no infrastructure change was made."
        ),
    }

    if normalized_status not in notes:
        raise ValueError("Unsupported analysis failure status.")

    query = f"""
    UPDATE {INCIDENTS_TABLE}
    SET
      updated_ts = CURRENT_TIMESTAMP(),
      status = @status,
      escalation_note = @escalation_note,
      approval_status = "EVIDENCE_REQUESTED"
    WHERE incident_id = @incident_id
      AND status IN ("DETECTED", "PENDING_ANALYSIS")
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "incident_id", "STRING", incident_id
            ),
            bigquery.ScalarQueryParameter(
                "status", "STRING", normalized_status
            ),
            bigquery.ScalarQueryParameter(
                "escalation_note", "STRING", notes[normalized_status]
            ),
        ]
    )
    query_job = bigquery.Client(project=PROJECT).query(
        query,
        job_config=job_config,
    )
    query_job.result()
    return query_job.num_dml_affected_rows == 1
