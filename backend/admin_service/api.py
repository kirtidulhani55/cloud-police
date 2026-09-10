from typing import Any

from flask import Blueprint, jsonify, request

from access_control import current_access_user, require_minimum_role
from admin_service.audit import record_admin_action
from admin_service.identity_users import (
    count_active_admins,
    create_identity_user,
    get_identity_user,
    list_identity_users,
    normalize_role,
    update_identity_user,
)


admin_api = Blueprint(
    "admin_api",
    __name__,
    url_prefix="/api/admin",
)

MAX_REASON_LENGTH = 1000


def _error(message: str, status_code: int):
    return jsonify(status="error", message=message), status_code


def _json_body() -> dict[str, Any]:
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ValueError("A JSON request body is required.")
    return body


def _reason(body: dict[str, Any], *, required: bool) -> str:
    reason = str(body.get("reason") or "").strip()

    if required and not reason:
        raise ValueError("A reason is required for this change.")
    if len(reason) > MAX_REASON_LENGTH:
        raise ValueError("The reason must be 1000 characters or fewer.")

    return reason


def _identity_error(error: Exception):
    error_name = type(error).__name__

    if error_name == "UserNotFoundError":
        return _error("The selected user was not found.", 404)
    if error_name == "EmailAlreadyExistsError":
        return _error("An account with this email already exists.", 409)

    return _error("Identity Platform could not complete the request.", 500)


@admin_api.get("/users")
@require_minimum_role("ADMIN")
def list_users():
    try:
        users = list_identity_users()
    except Exception as error:
        return _identity_error(error)

    return jsonify(status="ok", users=users)


@admin_api.post("/users")
@require_minimum_role("ADMIN")
def create_user():
    try:
        body = _json_body()
        email = str(body.get("email") or "").strip().lower()
        temporary_password = str(body.get("temporary_password") or "")
        display_name = str(body.get("display_name") or "").strip() or None
        role = normalize_role(body.get("role"))
        reason = _reason(body, required=False) or "User account created."

        created_user = create_identity_user(
            email=email,
            temporary_password=temporary_password,
            role=role,
            display_name=display_name,
        )

        audit_id = record_admin_action(
            action="CREATE_USER",
            actor=current_access_user(),
            target_user=created_user,
            reason=reason,
        )
    except ValueError as error:
        return _error(str(error), 400)
    except Exception as error:
        return _identity_error(error)

    return jsonify(
        status="ok",
        user=created_user,
        audit_id=audit_id,
    ), 201


@admin_api.patch("/users/<user_id>")
@require_minimum_role("ADMIN")
def update_user(user_id: str):
    try:
        body = _json_body()
        actor = current_access_user()
        existing_user = get_identity_user(user_id)
        reason = _reason(body, required=True)

        requested_role = body.get("role")
        role = (
            normalize_role(requested_role)
            if requested_role is not None
            else None
        )

        disabled = body.get("disabled")
        if disabled is not None and not isinstance(disabled, bool):
            raise ValueError("Disabled must be true or false.")

        display_name: str | None = None
        if "display_name" in body:
            display_name = str(body.get("display_name") or "").strip()

        if role is None and disabled is None and "display_name" not in body:
            raise ValueError("No user changes were provided.")

        is_current_admin = str(actor.get("user_id") or "") == user_id
        if is_current_admin and role is not None and role != "ADMIN":
            return _error("You cannot remove your own Admin role.", 409)
        if is_current_admin and disabled is True:
            return _error("You cannot disable your own Admin account.", 409)

        removes_active_admin = (
            existing_user.get("role") == "ADMIN"
            and not existing_user.get("disabled")
            and (
                disabled is True
                or (role is not None and role != "ADMIN")
            )
        )
        if removes_active_admin and count_active_admins() <= 1:
            return _error(
                "At least one active Admin account must remain.",
                409,
            )

        updated_user = update_identity_user(
            user_id,
            role=role,
            disabled=disabled,
            display_name=display_name,
        )

        role_changed = existing_user.get("role") != updated_user.get("role")
        disabled_changed = (
            existing_user.get("disabled") != updated_user.get("disabled")
        )

        if role_changed and not disabled_changed:
            action = "CHANGE_ROLE"
        elif disabled_changed and not role_changed:
            action = "DISABLE_USER" if updated_user["disabled"] else "ENABLE_USER"
        else:
            action = "UPDATE_USER"

        audit_id = record_admin_action(
            action=action,
            actor=actor,
            target_user=updated_user,
            previous_role=existing_user.get("role"),
            previous_disabled=existing_user.get("disabled"),
            reason=reason,
        )
    except ValueError as error:
        return _error(str(error), 400)
    except Exception as error:
        return _identity_error(error)

    return jsonify(
        status="ok",
        user=updated_user,
        audit_id=audit_id,
    )
