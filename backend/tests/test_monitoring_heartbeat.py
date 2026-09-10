import unittest
from datetime import datetime, timedelta, timezone

from monitor_service.status import monitoring_state


class MonitoringStateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.now = datetime(2026, 9, 4, 12, 0, tzinfo=timezone.utc)

    def test_recent_success_is_healthy(self) -> None:
        self.assertEqual(
            monitoring_state(
                "SUCCEEDED",
                self.now - timedelta(minutes=7),
                now=self.now,
                interval_minutes=5,
            ),
            "HEALTHY",
        )

    def test_late_success_is_delayed(self) -> None:
        self.assertEqual(
            monitoring_state(
                "SUCCEEDED",
                self.now - timedelta(minutes=14),
                now=self.now,
                interval_minutes=5,
            ),
            "DELAYED",
        )

    def test_stale_success_requires_attention(self) -> None:
        self.assertEqual(
            monitoring_state(
                "SUCCEEDED",
                self.now - timedelta(minutes=25),
                now=self.now,
                interval_minutes=5,
            ),
            "ATTENTION_REQUIRED",
        )

    def test_latest_failure_requires_attention(self) -> None:
        self.assertEqual(
            monitoring_state(
                "FAILED",
                self.now - timedelta(minutes=1),
                now=self.now,
                interval_minutes=5,
            ),
            "ATTENTION_REQUIRED",
        )

    def test_missing_success_is_unknown(self) -> None:
        self.assertEqual(
            monitoring_state(
                "RUNNING",
                None,
                now=self.now,
                interval_minutes=5,
            ),
            "UNKNOWN",
        )


if __name__ == "__main__":
    unittest.main()
