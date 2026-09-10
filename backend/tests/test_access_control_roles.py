import unittest
from unittest.mock import patch

from flask import Flask, jsonify

from access_control import require_minimum_role


class RoleMatrixTests(unittest.TestCase):
    def setUp(self) -> None:
        app = Flask(__name__)

        @app.get("/operator")
        @require_minimum_role("OPERATOR")
        def operator_route():
            return jsonify(status="ok")

        @app.get("/approver")
        @require_minimum_role("APPROVER")
        def approver_route():
            return jsonify(status="ok")

        @app.get("/admin")
        @require_minimum_role("ADMIN")
        def admin_route():
            return jsonify(status="ok")

        self.client = app.test_client()

    def status_for(self, role: str, path: str) -> int:
        user = {
            "user_id": f"test-{role.lower()}",
            "email": f"{role.lower()}@example.com",
            "role": role,
        }
        with patch(
            "access_control.verify_access_token",
            return_value=user,
        ):
            response = self.client.get(
                path,
                headers={"Authorization": "Bearer test-token"},
            )
        return response.status_code

    def test_operator_is_read_only(self) -> None:
        self.assertEqual(self.status_for("OPERATOR", "/operator"), 200)
        self.assertEqual(self.status_for("OPERATOR", "/approver"), 403)
        self.assertEqual(self.status_for("OPERATOR", "/admin"), 403)

    def test_approver_cannot_administer(self) -> None:
        self.assertEqual(self.status_for("APPROVER", "/operator"), 200)
        self.assertEqual(self.status_for("APPROVER", "/approver"), 200)
        self.assertEqual(self.status_for("APPROVER", "/admin"), 403)

    def test_admin_can_use_all_protected_routes(self) -> None:
        self.assertEqual(self.status_for("ADMIN", "/operator"), 200)
        self.assertEqual(self.status_for("ADMIN", "/approver"), 200)
        self.assertEqual(self.status_for("ADMIN", "/admin"), 200)


if __name__ == "__main__":
    unittest.main()
