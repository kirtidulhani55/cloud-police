import sys
import types
import unittest


google_module = types.ModuleType("google")
cloud_module = types.ModuleType("google.cloud")
bigquery_module = types.ModuleType("google.cloud.bigquery")
bigquery_module.Client = object
bigquery_module.QueryJobConfig = lambda **kwargs: kwargs
bigquery_module.ArrayQueryParameter = lambda *args: args
cloud_module.bigquery = bigquery_module
google_module.cloud = cloud_module
sys.modules.setdefault("google", google_module)
sys.modules.setdefault("google.cloud", cloud_module)
sys.modules.setdefault("google.cloud.bigquery", bigquery_module)

safety_module = types.ModuleType("monitor_service.safety")
safety_module.sanitize_network_outputs = lambda diagnosis, remediation: (
    diagnosis,
    remediation,
)
sys.modules.setdefault("monitor_service.safety", safety_module)

from monitor_service.result_store import (  # noqa: E402
    _merge_evidence_ids,
    _validated_evidence_ids,
    prepare_saved_result,
)


class EvidenceSynchronizationTests(unittest.TestCase):
    def test_merge_keeps_order_and_removes_duplicates(self):
        self.assertEqual(
            _merge_evidence_ids(
                ["FW-1", "CONN-1"],
                ["CONN-1", "DIFF-1"],
            ),
            ["FW-1", "CONN-1", "DIFF-1"],
        )

    def test_network_result_combines_diagnosis_and_remediation_evidence(self):
        result = prepare_saved_result(
            "NETWORK_INCIDENT",
            {
                "diagnosis_result": {
                    "severity": "HIGH",
                    "evidence_event_ids": [
                        "FW-1",
                        "CONN-1",
                        "DIFF-1",
                    ],
                },
                "remediation_result": {
                    "evidence_ids": ["FW-1", "CONN-1"],
                },
            },
        )

        self.assertEqual(
            result["evidence_ids"],
            ["FW-1", "CONN-1", "DIFF-1"],
        )

    def test_validation_keeps_only_real_ids_in_candidate_order(self):
        class QueryJob:
            @staticmethod
            def result():
                return [
                    {"evidence_id": "DIFF-1"},
                    {"evidence_id": "FW-1"},
                ]

        class Client:
            @staticmethod
            def query(_query, job_config=None):
                self.assertIsNotNone(job_config)
                return QueryJob()

        self.assertEqual(
            _validated_evidence_ids(
                Client(),
                ["FW-1", "NOT-REAL", "DIFF-1"],
            ),
            ["FW-1", "DIFF-1"],
        )


if __name__ == "__main__":
    unittest.main()
