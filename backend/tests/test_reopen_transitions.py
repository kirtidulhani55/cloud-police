import unittest

from approval_service.transitions import reopen_error


class ReopenTransitionTests(unittest.TestCase):
    def test_approved_case_can_be_reopened(self):
        self.assertIsNone(reopen_error("APPROVED"))

    def test_rejected_case_can_be_reopened(self):
        self.assertIsNone(reopen_error("REJECTED"))

    def test_pending_case_cannot_be_reopened(self):
        for status in ("", "PENDING", "PENDING_REVIEW", "AWAITING_APPROVAL"):
            with self.subTest(status=status):
                self.assertEqual(
                    reopen_error(status),
                    "Only a finalized (approved or rejected) case can be reopened.",
                )

    def test_evidence_requested_case_cannot_be_reopened(self):
        self.assertEqual(
            reopen_error("EVIDENCE_REQUESTED"),
            "Only a finalized (approved or rejected) case can be reopened.",
        )

    def test_unknown_state_cannot_be_reopened(self):
        self.assertIsNotNone(reopen_error("UNRECOGNIZED"))


if __name__ == "__main__":
    unittest.main()
