import json
from copy import deepcopy
from typing import Optional

from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmResponse
from google.genai import types


def _format_risk_categories(categories: list[str]) -> str:
    """Turn risk categories into a simple readable sentence."""

    cleaned_categories = [
        str(category).strip().lower()
        for category in categories
        if str(category).strip()
    ]

    if not cleaned_categories:
        return "operational"

    if len(cleaned_categories) == 1:
        return cleaned_categories[0]

    if len(cleaned_categories) == 2:
        return " and ".join(cleaned_categories)

    return (
        ", ".join(cleaned_categories[:-1])
        + ", and "
        + cleaned_categories[-1]
    )


def validate_change_output(
    callback_context: CallbackContext,
    llm_response: LlmResponse,
) -> Optional[LlmResponse]:
    """Create a conservative final response from structured fields."""

    if not llm_response.content or not llm_response.content.parts:
        return None

    first_part = llm_response.content.parts[0]

    # Allow MCP tool requests to continue normally.
    if first_part.function_call or not first_part.text:
        return None

    try:
        data = json.loads(first_part.text)
    except (json.JSONDecodeError, TypeError):
        return None

    if not isinstance(data, dict):
        return None

    change_id = str(data.get("change_id", "UNKNOWN_CHANGE"))
    cloud_provider = str(data.get("cloud_provider", "UNKNOWN"))
    environment = str(data.get("environment", "unknown"))
    change_type = str(data.get("change_type", "CHANGE")).upper()
    resource_address = str(
        data.get("resource_address", "the selected resource")
    )

    valid_risk_levels = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    risk_level = str(data.get("risk_level", "MEDIUM")).upper()

    if risk_level not in valid_risk_levels:
        risk_level = "MEDIUM"

    risk_categories = data.get("risk_categories", ["Operational"])

    if not isinstance(risk_categories, list):
        risk_categories = ["Operational"]

    risk_text = _format_risk_categories(risk_categories)

    try:
        monthly_cost = float(
            data.get("estimated_monthly_cost_change_usd", 0.0)
        )
    except (TypeError, ValueError):
        monthly_cost = 0.0

    if abs(monthly_cost) < 0.01:
        cost_sentence = (
            "The proposal records no estimated monthly cost change."
        )
    else:
        cost_sentence = (
            "The proposal records an estimated monthly cost change "
            f"of ${monthly_cost:,.2f}."
        )

    # Always rebuild user-facing explanations from structured fields.
    data["plain_language_summary"] = (
        f"This proposed {change_type} affects {resource_address} "
        f"in the {environment} {cloud_provider} environment. "
        f"It is classified as {risk_level} risk. "
        f"{cost_sentence}"
    )

    data["predicted_impact"] = (
        f"This proposed change could introduce {risk_text} risks. "
        "The exact impact must be confirmed through Terraform plan "
        "review, safety review and appropriate testing."
    )

    # Until exact cross-tool evidence matching is added, retain only
    # the proposal's own trusted identifier.
    data["supporting_evidence_ids"] = [change_id]

    recommendation_by_risk = {
        "LOW": "PROCEED_TO_HUMAN_REVIEW",
        "MEDIUM": "REVISE_BEFORE_REVIEW",
        "HIGH": "BLOCK_PENDING_INVESTIGATION",
        "CRITICAL": "BLOCK_PENDING_INVESTIGATION",
    }

    data["recommendation"] = recommendation_by_risk[risk_level]

    data["required_human_checks"] = [
        "Review the exact Terraform plan and before-and-after values.",
        "Confirm the resource identity and its service dependencies.",
        "Complete the relevant security, cost and service-impact reviews.",
    ]

    try:
        original_confidence = float(data.get("confidence", 0.75))
    except (TypeError, ValueError):
        original_confidence = 0.75

    data["confidence"] = min(
        max(original_confidence, 0.0),
        0.85,
    )

    data["risk_level"] = risk_level
    data["estimated_monthly_cost_change_usd"] = monthly_cost
    data["action_status"] = "AWAITING_HUMAN_APPROVAL"
    data["requires_human_approval"] = True

    modified_parts = [
        deepcopy(part)
        for part in llm_response.content.parts
    ]

    modified_parts[0].text = json.dumps(
        data,
        ensure_ascii=False,
    )

    return LlmResponse(
        content=types.Content(
            role="model",
            parts=modified_parts,
        ),
        grounding_metadata=llm_response.grounding_metadata,
    )
