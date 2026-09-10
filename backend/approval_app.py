import os

from flask import Flask, jsonify, request

from admin_service.api import admin_api
from approval_service.api import approval_api


app = Flask(__name__)
app.register_blueprint(approval_api)
app.register_blueprint(admin_api)


def _allowed_origins() -> set[str]:
    configured = os.environ.get(
        "ALLOWED_ORIGINS",
        "",
    )

    return {
        origin.strip().rstrip("/")
        for origin in configured.split(",")
        if origin.strip()
    }


@app.after_request
def add_approval_security_headers(response):
    """Add restricted browser access and basic API security headers."""

    if not request.path.startswith("/api/"):
        return response

    allowed = _allowed_origins()
    request_origin = (request.headers.get("Origin") or "").rstrip("/")

    if request_origin and request_origin in allowed:
        response.headers[
            "Access-Control-Allow-Origin"
        ] = request_origin
        response.headers["Vary"] = "Origin"

    response.headers[
        "Access-Control-Allow-Methods"
    ] = "GET, POST, PATCH, OPTIONS"
    response.headers[
        "Access-Control-Allow-Headers"
    ] = (
        "Authorization, Content-Type, Idempotency-Key"
    )
    response.headers[
        "Access-Control-Max-Age"
    ] = "3600"
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"

    return response


@app.get("/")
def service_info():
    return jsonify(
        service="Cloud Police Approval API",
        status="ready",
        access="identity_platform_token_required",
        safety_mode="human_approval_required",
    )


@app.get("/healthz")
def health():
    return jsonify(status="ok")


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8080")),
    )
