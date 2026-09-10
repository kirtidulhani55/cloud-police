import os

from flask import Flask, jsonify, request
from dashboard_service.api import dashboard_api

from access_control import require_scheduler_identity
from monitor_service.scheduled_run import execute_scheduled_monitor

app = Flask(__name__)
app.register_blueprint(dashboard_api)

DEFAULT_CASE_LIMIT = int(
    os.environ.get("MONITOR_CASE_LIMIT", "20")
)
MAX_CASE_LIMIT = 50


def _requested_limit() -> int:
    """Return a safe monitoring batch limit."""

    requested = request.args.get(
        "limit",
        str(DEFAULT_CASE_LIMIT),
    )

    try:
        limit = int(requested)
    except ValueError:
        limit = DEFAULT_CASE_LIMIT

    return min(max(limit, 1), MAX_CASE_LIMIT)


@app.get("/")
def service_info():
    return jsonify(
        service="Cloud Police Automatic Monitor",
        status="ready",
        safety_mode="human_approval_required",
    )


@app.get("/healthz")
def health():
    return jsonify(status="ok")


@app.post("/monitor/run")
@require_scheduler_identity
def run_scheduled_monitor():
    """Detect cases, analyze them and save safe results."""

    try:
        return jsonify(
            execute_scheduled_monitor(
                limit=_requested_limit(),
            )
        )

    except Exception as error:
        app.logger.exception(
            "Cloud Police monitoring run failed."
        )

        return jsonify(
            status="error",
            error_type=type(error).__name__,
            message=str(error),
        ), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8080")),
    )
