from functools import wraps
from typing import Any, Callable, TypeVar, cast

from flask import g

from access_control import current_access_user, require_minimum_role


ViewFunction = TypeVar(
    "ViewFunction",
    bound=Callable[..., Any],
)


def _require_role(minimum_role: str):
    def decorator(view: ViewFunction) -> ViewFunction:
        @require_minimum_role(minimum_role)
        @wraps(view)
        def wrapped(*args: Any, **kwargs: Any):
            user = current_access_user()

            g.reviewer = {
                **user,
                "reviewer_id": user["user_id"],
                "reviewer_email": user["email"],
            }

            return view(*args, **kwargs)

        return cast(ViewFunction, wrapped)

    return decorator


def require_operator(view: ViewFunction) -> ViewFunction:
    """Allow Operator, Approver or Admin."""

    return _require_role("OPERATOR")(view)


def require_approver(view: ViewFunction) -> ViewFunction:
    """Allow only Approver or Admin."""

    return _require_role("APPROVER")(view)


def require_admin(view: ViewFunction) -> ViewFunction:
    """Allow only Admin."""

    return _require_role("ADMIN")(view)


# Temporary compatibility name for any older imports.
require_reviewer = require_approver
