import unittest
from unittest.mock import patch

from approval_app import app


class AdminRouteProtectionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = app.test_client()

    def test_admin_routes_require_sign_in(self) -> None:
        routes = [
            ("GET", "/api/admin/users"),
            ("POST", "/api/admin/users"),
            ("PATCH", "/api/admin/users/test-user"),
        ]

        for method, path in routes:
            with self.subTest(method=method, path=path):
                response = self.client.open(
                    path,
                    method=method,
                    json={},
                )
                self.assertEqual(response.status_code, 401)

    @patch("admin_service.api.update_identity_user")
    @patch("admin_service.api.count_active_admins", return_value=1)
    @patch(
        "admin_service.api.get_identity_user",
        return_value={
            "user_id": "last-admin",
            "email": "admin@example.com",
            "role": "ADMIN",
            "disabled": False,
        },
    )
    @patch(
        "access_control.verify_access_token",
        return_value={
            "user_id": "different-admin",
            "email": "other-admin@example.com",
            "role": "ADMIN",
        },
    )
    def test_last_active_admin_cannot_be_demoted(
        self,
        _verify_token,
        _get_user,
        _count_admins,
        update_user,
    ) -> None:
        response = self.client.patch(
            "/api/admin/users/last-admin",
            headers={"Authorization": "Bearer test-token"},
            json={
                "role": "APPROVER",
                "reason": "Testing last Admin protection.",
            },
        )

        self.assertEqual(response.status_code, 409)
        self.assertIn(
            "At least one active Admin account must remain.",
            response.get_json()["message"],
        )
        update_user.assert_not_called()


if __name__ == "__main__":
    unittest.main()
