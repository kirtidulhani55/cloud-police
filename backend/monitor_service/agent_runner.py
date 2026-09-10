import argparse
import asyncio
import json
import logging
import os
import uuid
from typing import Any

from google.adk.runners import InMemoryRunner
from google.cloud import bigquery
from google.genai import types

from cloud_police_root.agent import root_agent
from monitor_service.result_store import (
    record_analysis_failure,
    save_agent_result,
)


PROJECT = os.environ.get("GCP_PROJECT", "cloudpolice-506015")
DATASET = os.environ.get("BQ_DATASET", "cloud_police")
INCIDENTS_TABLE = f"`{PROJECT}.{DATASET}.incidents`"

APP_NAME = "cloud_police_automatic_monitor"
USER_ID = "cloud-police-monitor"
LOGGER = logging.getLogger(__name__)


def _bounded_int_setting(
    name: str,
    default: int,
    minimum: int,
    maximum: int,
) -> int:
    try:
        value = int(os.environ.get(name, str(default)))
    except ValueError:
        value = default
    return max(minimum, min(value, maximum))


CASE_TIMEOUT_SECONDS = _bounded_int_setting(
    "MONITOR_CASE_TIMEOUT_SECONDS", 120, 15, 600
)
CASE_MAX_RETRIES = _bounded_int_setting(
    "MONITOR_CASE_MAX_RETRIES", 1, 0, 3
)
RETRY_BACKOFF_SECONDS = _bounded_int_setting(
    "MONITOR_RETRY_BACKOFF_SECONDS", 2, 1, 30
)


def load_pending_cases(limit: int = 1) -> list[dict[str, Any]]:
    """Read cases that still require AI analysis."""

    safe_limit = max(1, min(int(limit), 20))
    client = bigquery.Client(project=PROJECT)

    query = f"""
    SELECT
      incident_id,
      incident_type,
      cloud_provider,
      environment,
      severity,
      status,
      summary,
      affected_resource,
      blocking_component,
      evidence_event_ids,
      estimated_monthly_impact_usd
    FROM {INCIDENTS_TABLE}
    WHERE status IN ("DETECTED", "PENDING_ANALYSIS")
    ORDER BY
      CASE severity
        WHEN "CRITICAL" THEN 1
        WHEN "HIGH" THEN 2
        WHEN "MEDIUM" THEN 3
        ELSE 4
      END,
      created_ts DESC,
      incident_id
    LIMIT {safe_limit}
    """

    return [
        dict(row.items())
        for row in client.query(query).result()
    ]


def build_monitoring_prompt(case: dict[str, Any]) -> str:
    """Create the correct Root Agent request for one detected case."""

    incident_id = case["incident_id"]
    incident_type = case["incident_type"]
    provider = case["cloud_provider"]
    environment = case["environment"]
    resource = case.get("affected_resource") or "unknown resource"
    summary = case.get("summary") or "No summary available."
    evidence_ids = case.get("evidence_event_ids") or []

    evidence_text = ", ".join(
        str(evidence_id)
        for evidence_id in evidence_ids
    )

    safety_text = (
        "This is an automatic scheduled monitoring request. "
        "Use only available BigQuery evidence. "
        "Do not approve, apply or execute any infrastructure change."
    )

    if incident_type == "NETWORK_INCIDENT":
        return (
            f"{safety_text}\n\n"
            f"Investigate detected network case {incident_id} in the "
            f"{environment} {provider} environment. "
            f"Affected resource: {resource}. "
            f"Detection summary: {summary} "
            f"Detector evidence IDs: {evidence_text}. "
            "Diagnose the root cause and prepare a safe remediation "
            "proposal requiring human approval."
        )

    if incident_type == "COST_ANOMALY":
        return (
            f"{safety_text}\n\n"
            f"Investigate detected cost case {incident_id} in the "
            f"{environment} {provider} environment. "
            f"Affected resource: {resource}. "
            f"Detection summary: {summary} "
            f"Detector evidence IDs: {evidence_text}. "
            "Explain the cost anomaly and recommend the next safe action."
        )

    if incident_type == "CHANGE_RISK":
        change_id = (
            str(evidence_ids[0])
            if evidence_ids
            else incident_id.replace("AUTO-CHG-", "")
        )

        return (
            f"{safety_text}\n\n"
            f"Inspect proposed Terraform change {change_id} for the "
            f"{environment} {provider} environment. "
            f"Resource: {resource}. "
            f"Detection summary: {summary} "
            "Assess availability, security, cost, data and operational "
            "risks before deployment."
        )

    raise ValueError(
        f"Unsupported incident type: {incident_type}"
    )


def _extract_text(event: Any) -> str | None:
    """Extract readable text from an ADK event when available."""

    content = getattr(event, "content", None)

    if not content or not content.parts:
        return None

    text_parts = [
        part.text
        for part in content.parts
        if getattr(part, "text", None)
    ]

    if not text_parts:
        return None

    return "\n".join(text_parts)


async def analyze_case(
    runner: InMemoryRunner,
    case: dict[str, Any],
) -> dict[str, Any]:
    """Run one detected case through the Cloud Police Root Agent."""

    session_id = (
        "monitor-"
        + uuid.uuid4().hex
    )

    await runner.session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        session_id=session_id,
    )

    prompt = build_monitoring_prompt(case)
    message = types.Content(
        role="user",
        parts=[
            types.Part(text=prompt),
        ],
    )

    captured_state: dict[str, Any] = {}
    final_response = None

    async for event in runner.run_async(
        user_id=USER_ID,
        session_id=session_id,
        new_message=message,
    ):
        actions = getattr(event, "actions", None)
        state_delta = getattr(actions, "state_delta", None)

        if state_delta:
            captured_state.update(state_delta)

        if event.is_final_response():
            event_text = _extract_text(event)

            if event_text:
                final_response = event_text

    saved_to_bigquery = save_agent_result(
        incident_id=case["incident_id"],
        incident_type=case["incident_type"],
        agent_state=captured_state,
    )

    return {
        "incident_id": case["incident_id"],
        "incident_type": case["incident_type"],
        "cloud_provider": case["cloud_provider"],
        "saved_to_bigquery": saved_to_bigquery,
        "prompt": prompt,
        "agent_state": captured_state,
        "final_response": final_response,
    }


async def analyze_case_with_retries(
    runner: InMemoryRunner,
    case: dict[str, Any],
    timeout_seconds: int = CASE_TIMEOUT_SECONDS,
    max_retries: int = CASE_MAX_RETRIES,
    backoff_seconds: int = RETRY_BACKOFF_SECONDS,
) -> dict[str, Any]:
    """Analyze one case with a bounded timeout and limited retries."""

    attempts = max_retries + 1

    for attempt in range(1, attempts + 1):
        try:
            result = await asyncio.wait_for(
                analyze_case(runner=runner, case=case),
                timeout=timeout_seconds,
            )
            return {
                **result,
                "status": "SUCCEEDED",
                "attempts": attempt,
            }
        except Exception:
            if attempt >= attempts:
                raise
            await asyncio.sleep(backoff_seconds * (2 ** (attempt - 1)))

    raise RuntimeError("Case analysis retry loop ended unexpectedly.")


async def run_monitor(limit: int = 1) -> list[dict[str, Any]]:
    """Analyze pending cases sequentially without one failure stopping later cases."""

    cases = load_pending_cases(limit=limit)

    if not cases:
        return []

    runner = InMemoryRunner(
        agent=root_agent,
        app_name=APP_NAME,
    )

    results = []

    try:
        for case in cases:
            try:
                result = await analyze_case_with_retries(
                    runner=runner,
                    case=case,
                )
            except TimeoutError:
                LOGGER.warning(
                    "Case analysis timed out for %s.",
                    case["incident_id"],
                )
                try:
                    record_analysis_failure(
                        case["incident_id"],
                        "ANALYSIS_TIMEOUT",
                    )
                except Exception:
                    LOGGER.exception(
                        "Unable to record safe timeout status for %s.",
                        case["incident_id"],
                    )
                result = {
                    "incident_id": case["incident_id"],
                    "incident_type": case["incident_type"],
                    "cloud_provider": case["cloud_provider"],
                    "status": "ANALYSIS_TIMEOUT",
                    "attempts": CASE_MAX_RETRIES + 1,
                    "saved_to_bigquery": False,
                }
            except Exception as error:
                LOGGER.error(
                    "Case analysis failed safely for %s (%s).",
                    case["incident_id"],
                    type(error).__name__,
                )
                try:
                    record_analysis_failure(
                        case["incident_id"],
                        "ANALYSIS_FAILED",
                    )
                except Exception:
                    LOGGER.exception(
                        "Unable to record safe failure status for %s.",
                        case["incident_id"],
                    )
                result = {
                    "incident_id": case["incident_id"],
                    "incident_type": case["incident_type"],
                    "cloud_provider": case["cloud_provider"],
                    "status": "ANALYSIS_FAILED",
                    "attempts": CASE_MAX_RETRIES + 1,
                    "saved_to_bigquery": False,
                }
            results.append(result)
    finally:
        await runner.close()

    return results


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run automatic Cloud Police case analysis."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=1,
        help="Maximum number of pending cases to analyze.",
    )
    args = parser.parse_args()

    results = asyncio.run(
        run_monitor(limit=args.limit)
    )

    print(
        json.dumps(
            {
                "status": "ok",
                "analyzed_cases": len(results),
                "results": results,
            },
            indent=2,
            default=str,
        )
    )


if __name__ == "__main__":
    main()
