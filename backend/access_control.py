import os
from functools import wraps
from typing import Any, Callable, TypeVar, cast

import firebase_admin
from firebase_admin import auth as firebase_auth
from flask import g, jsonify, request
from google.auth import exceptions as google_auth_exceptions
from google.auth.transport import requests as google_auth_requests
from google.oauth2 import id_token as google_id_token


PROJECT = os.environ.get("GCP_PROJECT", "cloudpolice-506015")
IDENTITY_PLATFORM_PROJECT = os.environ.get(
    "IDENTITY_PLATFORM_PROJECT",
    PROJECT,
)

SECURE_TOKEN_CERTS_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)

ROLE_LEVELS = {
    "OPERATOR": 1,
    "APPROVER": 2,
    "ADMIN": 3,
}

ViewFunction = TypeVar(
    "ViewFunction",
    bound=Callable[..., Any],
)


class AccessControlError(Exception):
    def __init__(self, message: str, status_code: int = 401) -> None:
        super().__init__(message)
        self.status_code = status_code


def _email_list(environment_name: str) -> set[str]:
    configured = os.environ.get(environment_name, "")

    return {
        email.strip().lower()
        for email in configured.split(",")
        if email.strip()
    }


def resolve_role(
    email: str,
    claimed_role: Any = None,
) -> str | None:
    normalized_claimed_role = str(
        claimed_role or ""
    ).strip().upper()

    # Identity Platform custom claims are signed and trusted.
    if normalized_claimed_role in ROLE_LEVELS:
        return normalized_claimed_role

    normalized_email = email.strip().lower()

    # Environment email lists provide bootstrap access.
    if normalized_email in _email_list("ADMIN_EMAILS"):
        return "ADMIN"

    if normalized_email in _email_list("APPROVER_EMAILS"):
        return "APPROVER"

    if normalized_email in _email_list("OPERATOR_EMAILS"):
        return "OPERATOR"

    return None


def _bearer_token() -> str:
    authorization = request.headers.get("Authorization", "")
    scheme, separator, token = authorization.partition(" ")

    if (
        not separator
        or scheme.lower() != "bearer"
        or not token.strip()
    ):
        raise AccessControlError(
            "A signed-in Cloud Police account is required.",
            status_code=401,
        )

    return token.strip()


def _ensure_firebase_app() -> None:
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(
            options={"projectId": IDENTITY_PLATFORM_PROJECT}
        )


def verify_access_token(token: str) -> dict[str, Any]:
    try:
        _ensure_firebase_app()
        claims = firebase_auth.verify_id_token(
            token,
            check_revoked=True,
        )
    except firebase_auth.UserDisabledError as error:
        raise AccessControlError(
            "This Cloud Police account has been disabled.",
            status_code=401,
        ) from error
    except firebase_auth.RevokedIdTokenError as error:
        raise AccessControlError(
            "Your permissions changed. Please sign in again.",
            status_code=401,
        ) from error
    except Exception as error:
        raise AccessControlError(
            "The Identity Platform session is invalid or expired.",
            status_code=401,
        ) from error

    expected_issuer = (
        f"https://securetoken.google.com/"
        f"{IDENTITY_PLATFORM_PROJECT}"
    )

    if claims.get("iss") != expected_issuer:
        raise AccessControlError(
            "The token belongs to a different Google Cloud project.",
            status_code=401,
        )

    user_id = str(
        claims.get("user_id")
        or claims.get("sub")
        or ""
    ).strip()

    email = str(claims.get("email") or "").strip().lower()

    if not user_id or not email:
        raise AccessControlError(
            "The account is missing a user ID or email.",
            status_code=401,
        )

    role = resolve_role(
        email,
        claims.get("role"),
    )

    if role is None:
        raise AccessControlError(
            "This account is authenticated but is not authorized "
            "to access Cloud Police.",
            status_code=403,
        )

    return {
        **claims,
        "user_id": user_id,
        "email": email,
        "role": role,
    }


SCHEDULER_INVOKER_EMAIL = os.environ.get(
    "MONITOR_SCHEDULER_SERVICE_ACCOUNT", ""
).strip().lower()

SCHEDULER_AUDIENCE = os.environ.get(
    "MONITOR_INVOKER_AUDIENCE", ""
).strip()


def verify_scheduler_token() -> dict[str, Any]:
    """Verify the OIDC token Cloud Scheduler attaches to its 5-minute call.

    This checks a Google-issued OIDC token (not an Identity Platform user
    token), so it uses google's general oauth2 cert endpoint and validates
    the token's audience against this service's own URL plus the caller's
    service-account email against an explicit allowlist of one.
    """

    if not SCHEDULER_INVOKER_EMAIL or not SCHEDULER_AUDIENCE:
        raise AccessControlError(
            "The monitor trigger is not configured with an expected "
            "scheduler identity. Set MONITOR_SCHEDULER_SERVICE_ACCOUNT "
            "and MONITOR_INVOKER_AUDIENCE.",
            status_code=500,
        )

    try:
        claims = google_id_token.verify_oauth2_token(
            _bearer_token(),
            google_auth_requests.Request(),
            audience=SCHEDULER_AUDIENCE,
        )
    except (
        ValueError,
        TypeError,
        google_auth_exceptions.GoogleAuthError,
    ) as error:
        raise AccessControlError(
            "The monitor trigger token is invalid or expired.",
            status_code=401,
        ) from error

    caller_email = str(claims.get("email") or "").strip().lower()
    email_verified = bool(claims.get("email_verified"))

    if not email_verified or caller_email != SCHEDULER_INVOKER_EMAIL:
        raise AccessControlError(
            "The monitor trigger may only be called by the configured "
            "Cloud Scheduler service account.",
            status_code=403,
        )

    return claims


def require_scheduler_identity(view: ViewFunction) -> ViewFunction:
    """Restrict a route to calls carrying a valid Cloud Scheduler OIDC token."""

    @wraps(view)
    def wrapped(*args: Any, **kwargs: Any):
        try:
            verify_scheduler_token()
        except AccessControlError as error:
            return jsonify(
                status="error",
                message=str(error),
            ), error.status_code

        return view(*args, **kwargs)

    return cast(ViewFunction, wrapped)


def require_minimum_role(
    minimum_role: str,
) -> Callable[[ViewFunction], ViewFunction]:
    normalized_minimum = minimum_role.strip().upper()

    if normalized_minimum not in ROLE_LEVELS:
        raise ValueError(
            f"Unknown minimum role: {minimum_role}"
        )

    def decorator(view: ViewFunction) -> ViewFunction:
        @wraps(view)
        def wrapped(*args: Any, **kwargs: Any):
            try:
                access_user = verify_access_token(
                    _bearer_token()
                )

                user_role = str(
                    access_user["role"]
                ).upper()

                if (
                    ROLE_LEVELS[user_role]
                    < ROLE_LEVELS[normalized_minimum]
                ):
                    raise AccessControlError(
                        f"{normalized_minimum.title()} "
                        "permission is required.",
                        status_code=403,
                    )

                g.access_user = access_user

            except AccessControlError as error:
                return jsonify(
                    status="error",
                    message=str(error),
                ), error.status_code

            return view(*args, **kwargs)

        return cast(ViewFunction, wrapped)

    return decorator


def current_access_user() -> dict[str, Any]:
    access_user = getattr(g, "access_user", None)

    if not access_user:
        raise AccessControlError(
            "No verified access session is available.",
            status_code=401,
        )

    return cast(dict[str, Any], access_user)
