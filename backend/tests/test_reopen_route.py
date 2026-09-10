import unittest

from approval_app import app


class ReopenRouteProtectionTests(unittest.TestCase):
    """The reopen endpoint must be locked down at least as tightly as
    the admin user-management routes: no signed-in user, no access."""

    def setUp(self) -> None:
        self.client = app.test_client()

    def test_reopen_requires_sign_in(self) -> None:
        response = self.client.post(
            "/api/cases/INC-does-not-matter/reopen",
            json={"reason": "Investigating a reporting error."},
        )
        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
