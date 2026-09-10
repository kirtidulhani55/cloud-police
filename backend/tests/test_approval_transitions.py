import unittest

from approval_service.transitions import transition_error


class ApprovalTransitionTests(unittest.TestCase):
    def test_pending_case_can_request_evidence(self):
        self.assertIsNone(
            transition_error("PENDING_REVIEW", "REQUEST_EVIDENCE")
        )

    def test_duplicate_evidence_request_is_blocked(self):
        self.assertEqual(
            transition_error("EVIDENCE_REQUESTED", "REQUEST_EVIDENCE"),
            "Additional evidence has already been requested for this case.",
        )

    def test_evidence_requested_case_can_be_approved_or_rejected(self):
        self.assertIsNone(
            transition_error("EVIDENCE_REQUESTED", "APPROVE")
        )
        self.assertIsNone(
            transition_error("EVIDENCE_REQUESTED", "REJECT")
        )

    def test_final_cases_are_locked(self):
        for status in ("APPROVED", "REJECTED"):
            for action in ("APPROVE", "REJECT", "REQUEST_EVIDENCE"):
                with self.subTest(status=status, action=action):
                    self.assertEqual(
                        transition_error(status, action),
                        "This case already has a final human decision.",
                    )

    def test_unknown_state_is_rejected(self):
        self.assertIsNotNone(
            transition_error("UNRECOGNIZED", "APPROVE")
        )
        self.assertIsNotNone(
            transition_error("UNRECOGNIZED", "REQUEST_EVIDENCE")
        )


if __name__ == "__main__":
    unittest.main()
