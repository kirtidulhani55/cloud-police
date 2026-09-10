from copy import deepcopy
from typing import Any


VALID_RISK_LEVELS = {
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
}

SAFE_VALIDATION_STEPS = [
    "Run terraform fmt.",
    "Run terraform validate.",
    "Review the Terraform plan without applying it.",
    "Complete security and service-impact reviews.",
    "Perform a connectivity test only after a separately authorized deployment.",
]

SAFE_ROLLBACK_PLAN = (
    "Locate the previously approved known-good configuration through "
    "version-control history. An engineer must review the recovery plan "
    "before any separately authorized change. BigQuery evidence IDs must "
    "not be treated as version-control commit identifiers."
)

SAFE_ESCALATION_NOTE = (
    "The appropriate network, platform and security reviewers must inspect "
    "the evidence and Terraform plan. Cloud Police does not execute or "
    "approve infrastructure changes."
)


def _text(value: Any) -> str:
    """Return a clean string."""

    if value is None:
        return ""

    return str(value).strip()


def _string_list(value: Any) -> list[str]:
    """Return a clean list of identifiers."""

    if not isinstance(value, list):
        return []

    return [
        str(item).strip()
        for item in value
        if str(item).strip()
    ]


def sanitize_network_outputs(
    diagnosis: dict[str, Any],
    remediation: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Return conservative network outputs safe for storage."""

    safe_diagnosis = deepcopy(diagnosis)
    safe_remediation = deepcopy(remediation)

    affected_resource = (
        _text(safe_diagnosis.get("affected_resource"))
        or "the affected resource"
    )
    affected_port = safe_diagnosis.get("affected_port")
    port_text = (
        str(affected_port)
        if affected_port is not None
        else "RETRIEVE_FROM_VERSION_CONTROL"
    )

    safe_diagnosis["requires_human_approval"] = True
    safe_diagnosis["recommended_next_action"] = (
        "Review the evidence and prepare a non-executable restoration "
        f"proposal for {affected_resource} on port {port_text}. "
        "Any infrastructure change requires separate engineer approval."
    )

    safe_remediation["action_status"] = (
        "AWAITING_HUMAN_APPROVAL"
    )
    safe_remediation["requires_human_approval"] = True
    safe_remediation["validation_steps"] = (
        SAFE_VALIDATION_STEPS.copy()
    )
    safe_remediation["rollback_plan"] = SAFE_ROLLBACK_PLAN
    safe_remediation["escalation_note"] = SAFE_ESCALATION_NOTE

    diagnosis_incident_id = _text(
        safe_diagnosis.get("incident_id")
    )
    if diagnosis_incident_id:
        safe_remediation["incident_id"] = (
            diagnosis_incident_id
        )

    diagnosis_evidence_ids = _string_list(
        safe_diagnosis.get("evidence_event_ids")
    )
    if diagnosis_evidence_ids:
        safe_remediation["evidence_ids"] = (
            diagnosis_evidence_ids
        )

    risk_level = _text(
        safe_remediation.get("risk_level")
    ).upper()

    if risk_level not in VALID_RISK_LEVELS:
        safe_remediation["risk_level"] = "MEDIUM"

    safe_remediation["proposed_fix"] = (
        "Prepare a non-executable restoration proposal for "
        f"{affected_resource} on port {port_text} using the previously "
        "approved configuration from version control. An engineer must "
        "review the Terraform plan, security impact and validation "
        "results before any separately authorized change."
    )

    safe_remediation["terraform_change_draft"] = (
        "1. Evidence-supported incident facts:\n"
        f"- Affected resource: {affected_resource}\n"
        f"- Affected port: {port_text}\n\n"
        "2. Values required from version control:\n"
        "- Full previously approved Terraform configuration: "
        "RETRIEVE_FROM_VERSION_CONTROL\n\n"
        "3. Human validation required:\n"
        "- Review the exact Terraform plan and security impact.\n"
        "- Confirm every missing value through version control.\n"
        "- Do not run terraform apply through Cloud Police."
    )

    return safe_diagnosis, safe_remediation
