import unittest
from unittest.mock import patch

from dashboard_app import app


class _QueryResult:
    def __init__(self, rows):
        self._rows = rows

    def result(self):
        return self._rows


class _Client:
    def __init__(self, rows):
        self.rows = rows
        self.queries = []

    def query(self, query, job_config=None):
        self.queries.append((query, job_config))
        return _QueryResult(self.rows)


class DashboardCaseBatchTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.user = {
            "user_id": "operator-1",
            "email": "operator@example.com",
            "role": "OPERATOR",
        }

    def test_details_are_returned_in_one_cases_query(self):
        database = _Client([
            {
                "incident_id": "INC-1",
                "diagnosis": '{"root_cause":"Firewall rule"}',
                "incident_type": "NETWORK_INCIDENT",
            }
        ])

        with (
            patch("access_control.verify_access_token", return_value=self.user),
            patch("dashboard_service.api._client", return_value=database),
        ):
            response = self.client.get(
                "/api/cases?limit=50&include=details",
                headers={"Authorization": "Bearer test-token"},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload["details_included"])
        self.assertEqual(
            payload["cases"][0]["diagnosis"]["root_cause"],
            "Firewall rule",
        )
        self.assertEqual(len(database.queries), 1)
        self.assertIn("remediation_terraform", database.queries[0][0])

    def test_summary_contract_remains_available(self):
        database = _Client([])

        with (
            patch("access_control.verify_access_token", return_value=self.user),
            patch("dashboard_service.api._client", return_value=database),
        ):
            response = self.client.get(
                "/api/cases?limit=50",
                headers={"Authorization": "Bearer test-token"},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertFalse(payload["details_included"])
        self.assertNotIn("remediation_terraform", database.queries[0][0])


if __name__ == "__main__":
    unittest.main()
