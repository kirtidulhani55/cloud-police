import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from monitor_service.agent_runner import (
    analyze_case_with_retries,
    run_monitor,
)


def _case(incident_id: str) -> dict:
    return {
        "incident_id": incident_id,
        "incident_type": "NETWORK_INCIDENT",
        "cloud_provider": "GCP",
        "environment": "test",
        "severity": "HIGH",
        "status": "PENDING_ANALYSIS",
        "summary": "Test case",
    }


class AgentRunnerResilienceTests(unittest.IsolatedAsyncioTestCase):
    async def test_retry_can_recover(self):
        runner = MagicMock()
        successful = {
            "incident_id": "INC-1",
            "incident_type": "NETWORK_INCIDENT",
            "cloud_provider": "GCP",
            "saved_to_bigquery": True,
        }

        with (
            patch(
                "monitor_service.agent_runner.analyze_case",
                new=AsyncMock(side_effect=[RuntimeError("temporary"), successful]),
            ),
            patch(
                "monitor_service.agent_runner.asyncio.sleep",
                new=AsyncMock(),
            ) as sleep,
        ):
            result = await analyze_case_with_retries(
                runner,
                _case("INC-1"),
                timeout_seconds=30,
                max_retries=1,
                backoff_seconds=2,
            )

        self.assertEqual(result["status"], "SUCCEEDED")
        self.assertEqual(result["attempts"], 2)
        sleep.assert_awaited_once_with(2)

    async def test_timeout_does_not_stop_later_case(self):
        runner = MagicMock()
        runner.close = AsyncMock()
        second_result = {
            "incident_id": "INC-2",
            "incident_type": "NETWORK_INCIDENT",
            "cloud_provider": "GCP",
            "status": "SUCCEEDED",
            "attempts": 1,
            "saved_to_bigquery": True,
        }

        with (
            patch(
                "monitor_service.agent_runner.load_pending_cases",
                return_value=[_case("INC-1"), _case("INC-2")],
            ),
            patch(
                "monitor_service.agent_runner.InMemoryRunner",
                return_value=runner,
            ),
            patch(
                "monitor_service.agent_runner.analyze_case_with_retries",
                new=AsyncMock(side_effect=[TimeoutError(), second_result]),
            ),
            patch(
                "monitor_service.agent_runner.record_analysis_failure",
                return_value=True,
            ) as record_failure,
        ):
            results = await run_monitor(limit=2)

        self.assertEqual(results[0]["status"], "ANALYSIS_TIMEOUT")
        self.assertEqual(results[1]["status"], "SUCCEEDED")
        record_failure.assert_called_once_with(
            "INC-1", "ANALYSIS_TIMEOUT"
        )
        runner.close.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
