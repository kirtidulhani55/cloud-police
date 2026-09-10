import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from google.cloud import bigquery
from monitor_service.status import monitoring_state


PROJECT = os.environ.get("GCP_PROJECT", "cloudpolice-506015")
DATASET = os.environ.get("BQ_DATASET", "cloud_police")
MONITOR_RUNS_TABLE_NAME = os.environ.get(
    "BQ_MONITOR_RUNS_TABLE",
    "monitor_runs",
)

if not re.fullmatch(
    r"[A-Za-z_][A-Za-z0-9_]{0,1023}",
    MONITOR_RUNS_TABLE_NAME,
):
    raise ValueError("BQ_MONITOR_RUNS_TABLE must be a BigQuery table name.")

MONITOR_RUNS_TABLE_ID = (
    f"{PROJECT}.{DATASET}.{MONITOR_RUNS_TABLE_NAME}"
)
MONITOR_RUNS_TABLE = f"`{MONITOR_RUNS_TABLE_ID}`"

VALID_RUN_STATUSES = {"RUNNING", "SUCCEEDED", "FAILED"}


def schedule_minutes() -> int:
    """Return the configured monitor interval with safe limits."""

    try:
        value = int(os.environ.get("MONITOR_SCHEDULE_MINUTES", "5"))
    except ValueError:
        value = 5

    return min(max(value, 1), 1440)


def configured_clouds() -> list[str]:
    """Return the cloud providers checked by the scheduled monitor."""

    configured = os.environ.get(
        "MONITOR_CLOUDS",
        "AWS,AZURE,GCP",
    )
    clouds = []

    for value in configured.split(","):
        cloud = value.strip().upper()

        if cloud and cloud not in clouds:
            clouds.append(cloud)

    return clouds or ["AWS", "AZURE", "GCP"]


def monitor_job_name() -> str:
    """Prefer the Cloud Run execution metadata when it is available."""

    return (
        os.environ.get("CLOUD_RUN_JOB")
        or os.environ.get("MONITOR_JOB_NAME")
        or "cloud-police-monitor-job"
    )


def _client() -> bigquery.Client:
    return bigquery.Client(project=PROJECT)


def ensure_monitor_runs_table(
    client: bigquery.Client | None = None,
) -> None:
    """Create the small heartbeat table on the first monitor run."""

    active_client = client or _client()
    table = bigquery.Table(
        MONITOR_RUNS_TABLE_ID,
        schema=[
            bigquery.SchemaField("run_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("job_name", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("started_at", "TIMESTAMP", mode="REQUIRED"),
            bigquery.SchemaField("completed_at", "TIMESTAMP"),
            bigquery.SchemaField("status", "STRING", mode="REQUIRED"),
            bigquery.SchemaField(
                "clouds_checked",
                "STRING",
                mode="REPEATED",
            ),
            bigquery.SchemaField("detected_cases", "INTEGER"),
            bigquery.SchemaField("analyzed_cases", "INTEGER"),
            bigquery.SchemaField("error_type", "STRING"),
        ],
    )
    table.time_partitioning = bigquery.TimePartitioning(
        type_=bigquery.TimePartitioningType.DAY,
        field="started_at",
    )
    active_client.create_table(table, exists_ok=True)


def begin_monitor_run(
    client: bigquery.Client | None = None,
    started_at: datetime | None = None,
) -> str:
    """Record that a scheduled monitor execution started."""

    active_client = client or _client()
    ensure_monitor_runs_table(active_client)

    run_id = (
        os.environ.get("CLOUD_RUN_EXECUTION")
        or f"monitor-{uuid.uuid4().hex}"
    )
    task_index = os.environ.get("CLOUD_RUN_TASK_INDEX")
    task_attempt = os.environ.get("CLOUD_RUN_TASK_ATTEMPT")

    if task_index is not None:
        run_id = f"{run_id}-task-{task_index}"

    if task_attempt is not None:
        run_id = f"{run_id}-attempt-{task_attempt}"

    query = f"""
    INSERT INTO {MONITOR_RUNS_TABLE} (
      run_id,
      job_name,
      started_at,
      status,
      clouds_checked
    )
    VALUES (
      @run_id,
      @job_name,
      @started_at,
      "RUNNING",
      @clouds_checked
    )
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "run_id",
                "STRING",
                run_id,
            ),
            bigquery.ScalarQueryParameter(
                "job_name",
                "STRING",
                monitor_job_name(),
            ),
            bigquery.ScalarQueryParameter(
                "started_at",
                "TIMESTAMP",
                started_at or datetime.now(timezone.utc),
            ),
            bigquery.ArrayQueryParameter(
                "clouds_checked",
                "STRING",
                configured_clouds(),
            ),
        ]
    )
    active_client.query(query, job_config=job_config).result()
    return run_id


def finish_monitor_run(
    run_id: str,
    status: str,
    detected_cases: int | None = None,
    analyzed_cases: int | None = None,
    error_type: str | None = None,
    client: bigquery.Client | None = None,
    completed_at: datetime | None = None,
) -> None:
    """Finish an existing heartbeat without storing sensitive error text."""

    normalized_status = status.upper()

    if normalized_status not in VALID_RUN_STATUSES - {"RUNNING"}:
        raise ValueError("Monitor run must finish as SUCCEEDED or FAILED.")

    query = f"""
    UPDATE {MONITOR_RUNS_TABLE}
    SET
      completed_at = @completed_at,
      status = @status,
      detected_cases = @detected_cases,
      analyzed_cases = @analyzed_cases,
      error_type = @error_type
    WHERE run_id = @run_id
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "run_id",
                "STRING",
                run_id,
            ),
            bigquery.ScalarQueryParameter(
                "completed_at",
                "TIMESTAMP",
                completed_at or datetime.now(timezone.utc),
            ),
            bigquery.ScalarQueryParameter(
                "status",
                "STRING",
                normalized_status,
            ),
            bigquery.ScalarQueryParameter(
                "detected_cases",
                "INT64",
                detected_cases,
            ),
            bigquery.ScalarQueryParameter(
                "analyzed_cases",
                "INT64",
                analyzed_cases,
            ),
            bigquery.ScalarQueryParameter(
                "error_type",
                "STRING",
                error_type,
            ),
        ]
    )
    (client or _client()).query(
        query,
        job_config=job_config,
    ).result()


def unknown_monitoring_snapshot() -> dict[str, Any]:
    """Return a safe status before the first heartbeat is available."""

    return {
        "state": "UNKNOWN",
        "job_name": monitor_job_name(),
        "schedule_minutes": schedule_minutes(),
        "clouds_checked": configured_clouds(),
        "last_successful_scan": None,
        "successful_runs_24h": 0,
        "total_runs_24h": 0,
        "latest_execution": None,
    }


def load_monitoring_snapshot(
    client: bigquery.Client | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Load the newest execution plus the latest successful scan."""

    active_client = client or _client()
    query = f"""
    SELECT
      run_id,
      job_name,
      started_at,
      completed_at,
      status,
      clouds_checked,
      detected_cases,
      analyzed_cases,
      MAX(
        IF(status = "SUCCEEDED", completed_at, NULL)
      ) OVER () AS last_successful_scan
      ,COUNTIF(
        started_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
      ) OVER () AS total_runs_24h
      ,COUNTIF(
        status = "SUCCEEDED"
        AND completed_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
      ) OVER () AS successful_runs_24h
    FROM {MONITOR_RUNS_TABLE}
    QUALIFY ROW_NUMBER() OVER (
      ORDER BY started_at DESC, run_id DESC
    ) = 1
    """
    row = next(iter(active_client.query(query).result()), None)

    if row is None:
        return unknown_monitoring_snapshot()

    last_successful_scan = row["last_successful_scan"]
    interval = schedule_minutes()

    def iso(value: datetime | None) -> str | None:
        return value.isoformat() if value is not None else None

    return {
        "state": monitoring_state(
            latest_status=row["status"],
            last_successful_scan=last_successful_scan,
            now=now,
            interval_minutes=interval,
        ),
        "job_name": row["job_name"] or monitor_job_name(),
        "schedule_minutes": interval,
        "clouds_checked": list(row["clouds_checked"] or []),
        "last_successful_scan": iso(last_successful_scan),
        "successful_runs_24h": int(row["successful_runs_24h"] or 0),
        "total_runs_24h": int(row["total_runs_24h"] or 0),
        "latest_execution": {
            "run_id": row["run_id"],
            "status": row["status"],
            "started_at": iso(row["started_at"]),
            "completed_at": iso(row["completed_at"]),
            "detected_cases": row["detected_cases"],
            "analyzed_cases": row["analyzed_cases"],
        },
    }
