import unittest
from unittest.mock import MagicMock, patch

from admin_service.identity_users import update_identity_user


class SessionRevocationTests(unittest.TestCase):
    def _user(self, *, role="OPERATOR", disabled=False):
        user = MagicMock()
        user.custom_claims = {"role": role}
        user.disabled = disabled
        return user

    @patch("admin_service.identity_users.get_identity_user")
    @patch("admin_service.identity_users.auth")
    @patch("admin_service.identity_users._ensure_firebase_app")
    def test_role_change_revokes_sessions(self, _ensure, auth, get_user):
        auth.get_user.return_value = self._user(role="OPERATOR")
        get_user.return_value = {"user_id": "user-1", "role": "APPROVER"}

        update_identity_user("user-1", role="APPROVER")

        auth.set_custom_user_claims.assert_called_once_with(
            "user-1", {"role": "APPROVER"}
        )
        auth.revoke_refresh_tokens.assert_called_once_with("user-1")

    @patch("admin_service.identity_users.get_identity_user")
    @patch("admin_service.identity_users.auth")
    @patch("admin_service.identity_users._ensure_firebase_app")
    def test_disabling_user_revokes_sessions(self, _ensure, auth, get_user):
        auth.get_user.return_value = self._user(disabled=False)
        get_user.return_value = {"user_id": "user-1", "disabled": True}

        update_identity_user("user-1", disabled=True)

        auth.update_user.assert_called_once_with("user-1", disabled=True)
        auth.revoke_refresh_tokens.assert_called_once_with("user-1")

    @patch("admin_service.identity_users.get_identity_user")
    @patch("admin_service.identity_users.auth")
    @patch("admin_service.identity_users._ensure_firebase_app")
    def test_display_name_only_does_not_revoke(self, _ensure, auth, get_user):
        auth.get_user.return_value = self._user()
        get_user.return_value = {"user_id": "user-1"}

        update_identity_user("user-1", display_name="New Name")

        auth.revoke_refresh_tokens.assert_not_called()


if __name__ == "__main__":
    unittest.main()
