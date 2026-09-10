from datetime import datetime, timezone


def monitoring_state(
    latest_status: str | None,
    last_successful_scan: datetime | None,
    now: datetime | None = None,
    interval_minutes: int = 5,
) -> str:
    """Classify monitor freshness for the dashboard."""

    if (latest_status or "").upper() == "FAILED":
        return "ATTENTION_REQUIRED"

    if last_successful_scan is None:
        return "UNKNOWN"

    current_time = now or datetime.now(timezone.utc)
    successful_time = last_successful_scan

    if successful_time.tzinfo is None:
        successful_time = successful_time.replace(tzinfo=timezone.utc)

    age_minutes = max(
        (current_time - successful_time).total_seconds() / 60,
        0,
    )

    if age_minutes <= interval_minutes * 2:
        return "HEALTHY"

    if age_minutes <= interval_minutes * 4:
        return "DELAYED"

    return "ATTENTION_REQUIRED"
