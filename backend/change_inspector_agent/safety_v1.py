import json
import re
from copy import deepcopy
from typing import Optional

from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmResponse
from google.genai import types


UNSAFE_PATTERNS = (
    r"\bwill\b",
    r"\bimmediately\b",
    r"\bguaranteed\b",
    r"\bpermanent(?:ly)?\b",
    r"\bcertain(?:ly)?\b",
    r"\blikely\b",
    r"\bprobably\b",
    r"\btypically\b",
    r"\bassum(?:e|ed|ing|ption|ptions)\b",
    r"\bpotentially\b",
    r"\bimprobable\b",
    r"\bmomentary\b",
    r"\brecreation\b",
    r"\bno functional or availability impact\b",
)


def _contains_unsupported_claim(data: dict) -> bool:
    """Check user-facing fields for uncertain claims presented as facts."""

    text_to_check = " ".join(
        [
            str(data.get("plain_language_summary", "")),
            str(data.get("predicted_impact", "")),
        ]
    ).lower()

    return any(
        re.search(pattern, text_to_check)
        for pattern in UNSAFE_PATTERNS
    )


def validate_change_output(
    callback_context: CallbackContext,
    llm_response: LlmResponse,
) -> Optional[LlmResponse]:
    """Inspect and correct the Change Inspector's final JSON response."""

    if not llm_response.content or not llm_response.content.parts:
        return None

    first_part = llm_response.content.parts[0]

    # Do not interfere when Gemini is requesting an MCP tool.
    if first_part.function_call or not first_part.text:
        return None

    try:
        data = json.loads(first_part.text)
    except (json.JSONDecodeError, TypeError):
        return None

    if not isinstance(data, dict):
        return None

    modified = False

    # These two safety values can never be changed by Gemini.
    if data.get("requires_human_approval") is not True:
        data["requires_human_approval"] = True
        modified = True

    if data.get("action_status") != "AWAITING_HUMAN_APPROVAL":
        data["action_status"] = "AWAITING_HUMAN_APPROVAL"
        modified = True

    # A future prediction must never claim 100% certainty.
    confidence = data.get("confidence")

    if isinstance(confidence, (int, float)) and confidence > 0.95:
        data["confidence"] = 0.95
        modified = True

    # Replace unsupported claims with conservative language.
    if _contains_unsupported_claim(data):
        risk_text = ", ".join(
            str(category).lower()
            for category in data.get("risk_categories", ["operational"])
        )


        change_id = str(data.get("change_id", "UNKNOWN_CHANGE"))
        change_type = str(data.get("change_type", "CHANGE"))
        resource_address = str(
            data.get("resource_address", "the selected resource")
        )
        environment = str(data.get("environment", "the selected environment"))

        data["plain_language_summary"] = (
            f"The proposed {change_type} affects {resource_address} "
            f"in the {environment} environment."
        )

        data["predicted_impact"] = (
            f"This proposed change could introduce these risks: {risk_text}. "
            "The exact impact must be confirmed through Terraform "
            "plan review and testing."
        )        








        data["confidence"] = min(
            float(data.get("confidence", 0.75)),
            0.75,
        )

        data["supporting_evidence_ids"] = [change_id]

        data["recommendation"] = "BLOCK_PENDING_INVESTIGATION"

        data["required_human_checks"] = [
            "Review the exact Terraform plan and before-and-after values.",
            "Confirm the resource identity and its service dependencies.",
            "Complete security, cost and service-impact reviews.",
        ]

        modified = True

    if not modified:
        return None

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
