import os
from datetime import datetime, timezone
from typing import Any

import firebase_admin
from firebase_admin import auth


PROJECT = os.environ.get("GCP_PROJECT", "cloudpolice-506015")
VALID_ROLES = {"OPERATOR", "APPROVER", "ADMIN"}


def _ensure_firebase_app() -> None:
    """Initialize Firebase Admin with Cloud Run credentials once."""

    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(options={"projectId": PROJECT})


def normalize_role(value: Any) -> str:
    role = str(value or "").strip().upper()
    if role not in VALID_ROLES:
        raise ValueError(
            "Role must be OPERATOR, APPROVER or ADMIN."
        )
    return role


def _timestamp(milliseconds: int | None) -> str | None:
    if not milliseconds:
        return None
    return datetime.fromtimestamp(
        milliseconds / 1000,
        tz=timezone.utc,
    ).isoformat()


def user_record(user: auth.UserRecord) -> dict[str, Any]:
    claims = user.custom_claims or {}
    role = str(claims.get("role") or "").strip().upper()

    return {
        "user_id": user.uid,
        "email": user.email,
        "display_name": user.display_name,
        "role": role if role in VALID_ROLES else None,
        "disabled": user.disabled,
        "email_verified": user.email_verified,
        "created_at": _timestamp(user.user_metadata.creation_timestamp),
        "last_sign_in_at": _timestamp(
            user.user_metadata.last_sign_in_timestamp
        ),
    }


def list_identity_users() -> list[dict[str, Any]]:
    _ensure_firebase_app()

    users = [
        user_record(user)
        for user in auth.list_users().iterate_all()
    ]
    return sorted(
        users,
        key=lambda user: str(user.get("email") or "").lower(),
    )


def count_active_admins() -> int:
    """Return the number of enabled Identity Platform Admin accounts."""

    _ensure_firebase_app()

    return sum(
        1
        for user in auth.list_users().iterate_all()
        if not user.disabled
        and str(
            (user.custom_claims or {}).get("role") or ""
        ).strip().upper()
        == "ADMIN"
    )


def get_identity_user(user_id: str) -> dict[str, Any]:
    _ensure_firebase_app()
    return user_record(auth.get_user(user_id))


def create_identity_user(
    *,
    email: str,
    temporary_password: str,
    role: str,
    display_name: str | None = None,
) -> dict[str, Any]:
    _ensure_firebase_app()

    normalized_email = email.strip().lower()
    normalized_role = normalize_role(role)

    if "@" not in normalized_email or len(normalized_email) > 254:
        raise ValueError("A valid email address is required.")
    if len(temporary_password) < 8:
        raise ValueError(
            "The temporary password must contain at least 8 characters."
        )

    created_user = auth.create_user(
        email=normalized_email,
        password=temporary_password,
        display_name=(display_name or "").strip() or None,
        disabled=False,
        email_verified=False,
    )

    try:
        auth.set_custom_user_claims(
            created_user.uid,
            {"role": normalized_role},
        )
    except Exception:
        # Avoid leaving an account without its required authorization role.
        auth.delete_user(created_user.uid)
        raise

    return get_identity_user(created_user.uid)


def update_identity_user(
    user_id: str,
    *,
    role: str | None = None,
    disabled: bool | None = None,
    display_name: str | None = None,
) -> dict[str, Any]:
    _ensure_firebase_app()

    existing = auth.get_user(user_id)
    normalized_role = normalize_role(role) if role is not None else None
    existing_role = str(
        (existing.custom_claims or {}).get("role") or ""
    ).strip().upper()
    role_changed = (
        normalized_role is not None
        and normalized_role != existing_role
    )
    disabled_changed = (
        disabled is not None
        and bool(disabled) != bool(existing.disabled)
    )

    update_values: dict[str, Any] = {}
    if disabled is not None:
        update_values["disabled"] = disabled
    if display_name is not None:
        update_values["display_name"] = display_name.strip() or None

    if update_values:
        auth.update_user(user_id, **update_values)

    if normalized_role is not None:
        claims = dict(existing.custom_claims or {})
        claims["role"] = normalized_role
        auth.set_custom_user_claims(user_id, claims)

    # A role or enabled-state change must take effect immediately. Revoking
    # refresh tokens prevents the previous session from obtaining another ID
    # token. Protected endpoints also check revocation on every request.
    if role_changed or disabled_changed:
        auth.revoke_refresh_tokens(user_id)

    return get_identity_user(user_id)
