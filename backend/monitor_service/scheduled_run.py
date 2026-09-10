import argparse
import asyncio
import json
import logging
from typing import Any

from monitor_service.agent_runner import run_monitor
from monitor_service.detector import run_detection
from monitor_service.heartbeat import (
    begin_monitor_run,
    finish_monitor_run,
)


LOGGER = logging.getLogger(__name__)


def _finish_heartbeat(run_id: str | None, **values: Any) -> None:
    """Never let telemetry writing hide or break the monitor result."""

    if not run_id:
        return

    try:
        finish_monitor_run(run_id=run_id, **values)
    except Exception:
        LOGGER.exception("Unable to finish the monitor heartbeat.")


def execute_scheduled_monitor(limit: int = 20) -> dict[str, Any]:
    """Run detection and analysis with one durable execution heartbeat."""

    run_id = None

    try:
        run_id = begin_monitor_run()
    except Exception:
        LOGGER.exception("Unable to start the monitor heartbeat.")

    try:
        detection_result = run_detection()
        analyzed_results = asyncio.run(
            run_monitor(limit=limit)
        )
    except Exception as error:
        _finish_heartbeat(
            run_id,
            status="FAILED",
            error_type=type(error).__name__,
        )
        raise

    successful_cases = sum(
        result.get("status") == "SUCCEEDED"
        for result in analyzed_results
    )
    failed_cases = len(analyzed_results) - successful_cases

    _finish_heartbeat(
        run_id,
        status="FAILED" if failed_cases else "SUCCEEDED",
        detected_cases=detection_result.get("total_cases"),
        analyzed_cases=successful_cases,
        error_type=(
            "CASE_ANALYSIS_FAILURE" if failed_cases else None
        ),
    )

    return {
        "status": "ok",
        "run_id": run_id,
        "detection": detection_result,
        "analyzed_cases": successful_cases,
        "failed_cases": failed_cases,
        "results": analyzed_results,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the complete scheduled Cloud Police monitor.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Maximum number of pending cases to analyze.",
    )
    args = parser.parse_args()
    result = execute_scheduled_monitor(limit=args.limit)
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
