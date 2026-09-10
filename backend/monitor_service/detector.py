import json
import os

from google.cloud import bigquery


PROJECT = os.environ.get("GCP_PROJECT", "cloudpolice-506015")
DATASET = os.environ.get("BQ_DATASET", "cloud_police")

INCIDENTS_TABLE = f"`{PROJECT}.{DATASET}.incidents`"
FIREWALL_TABLE = f"`{PROJECT}.{DATASET}.firewall_logs`"
CONNECTIVITY_TABLE = f"`{PROJECT}.{DATASET}.connectivity_tests`"
COST_TABLE = f"`{PROJECT}.{DATASET}.cost_events`"
PROPOSED_CHANGES_TABLE = f"`{PROJECT}.{DATASET}.proposed_changes`"


NETWORK_DETECTION_SQL = f"""
MERGE {INCIDENTS_TABLE} AS target
USING (
  WITH correlated AS (
    SELECT
      f.event_id AS firewall_evidence_id,
      c.test_id AS connectivity_evidence_id,
      GREATEST(f.event_ts, c.test_ts) AS detected_ts,
      UPPER(f.cloud_provider) AS cloud_provider,
      f.environment,
      f.source_resource,
      f.destination_resource,
      f.dest_port,
      f.rule_name,
      CASE
        WHEN UPPER(COALESCE(f.severity, "HIGH")) = "CRITICAL"
          THEN "CRITICAL"
        ELSE "HIGH"
      END AS severity
    FROM {FIREWALL_TABLE} AS f
    JOIN {CONNECTIVITY_TABLE} AS c
      ON UPPER(f.cloud_provider) = UPPER(c.cloud_provider)
      AND f.environment = c.environment
      AND f.source_resource = c.source_resource
      AND f.destination_resource = c.target_resource
      AND f.dest_port = c.target_port
    WHERE UPPER(f.action) = "DENY"
      AND UPPER(c.result) = "BLOCKED"
      AND ABS(
        TIMESTAMP_DIFF(f.event_ts, c.test_ts, MINUTE)
      ) <= 15
      AND f.event_ts >= TIMESTAMP_SUB(
        CURRENT_TIMESTAMP(),
        INTERVAL 30 DAY
      )
    QUALIFY ROW_NUMBER() OVER (
      PARTITION BY
        UPPER(f.cloud_provider),
        f.environment,
        f.source_resource,
        f.destination_resource,
        f.dest_port
      ORDER BY
        f.event_ts DESC,
        c.test_ts DESC,
        f.event_id DESC,
        c.test_id DESC
    ) = 1
  )
  SELECT
    CONCAT(
      "AUTO-NET-",
      cloud_provider,
      "-",
      SUBSTR(
        TO_HEX(
          MD5(
            CONCAT(
              cloud_provider,
              "|",
              COALESCE(environment, ""),
              "|",
              COALESCE(source_resource, ""),
              "|",
              COALESCE(destination_resource, ""),
              "|",
              CAST(dest_port AS STRING)
            )
          )
        ),
        1,
        12
      )
    ) AS incident_id,
    detected_ts,
    "NETWORK_INCIDENT" AS incident_type,
    cloud_provider,
    environment,
    severity,
    FORMAT(
      "Blocked connectivity detected from %s to %s on port %d.",
      source_resource,
      destination_resource,
      dest_port
    ) AS summary,
    destination_resource AS affected_resource,
    rule_name AS blocking_component,
    0.95 AS confidence,
    [
      firewall_evidence_id,
      connectivity_evidence_id
    ] AS evidence_event_ids,
    0.0 AS estimated_monthly_impact_usd
  FROM correlated
) AS source
ON target.incident_id = source.incident_id

WHEN MATCHED THEN
  UPDATE SET
    updated_ts = source.detected_ts,
    severity = IF(
      target.status IN ("DETECTED", "PENDING_ANALYSIS"),
      source.severity,
      target.severity
    ),
    summary = source.summary,
    affected_resource = source.affected_resource,
    blocking_component = source.blocking_component,
    confidence = source.confidence,
    evidence_event_ids = source.evidence_event_ids

WHEN NOT MATCHED THEN
  INSERT (
    incident_id,
    created_ts,
    updated_ts,
    incident_type,
    cloud_provider,
    environment,
    severity,
    status,
    summary,
    affected_resource,
    blocking_component,
    confidence,
    evidence_event_ids,
    estimated_monthly_impact_usd,
    approval_status
  )
  VALUES (
    source.incident_id,
    source.detected_ts,
    source.detected_ts,
    source.incident_type,
    source.cloud_provider,
    source.environment,
    source.severity,
    "DETECTED",
    source.summary,
    source.affected_resource,
    source.blocking_component,
    source.confidence,
    source.evidence_event_ids,
    source.estimated_monthly_impact_usd,
    "NOT_REQUESTED"
  )
"""


COST_DETECTION_SQL = f"""
MERGE {INCIDENTS_TABLE} AS target
USING (
  WITH anomalies AS (
    SELECT
      cost_id,
      TIMESTAMP(usage_date) AS detected_ts,
      UPPER(cloud_provider) AS cloud_provider,
      environment,
      resource_name,
      service,
      daily_cost_usd,
      baseline_daily_cost_usd,
      ROUND(
        (daily_cost_usd - baseline_daily_cost_usd) * 30,
        2
      ) AS estimated_monthly_extra_usd
    FROM {COST_TABLE}
    WHERE baseline_daily_cost_usd > 0
      AND daily_cost_usd >= baseline_daily_cost_usd * 1.5
      AND (
        daily_cost_usd - baseline_daily_cost_usd
      ) * 30 >= 250
      AND usage_date >= DATE_SUB(
        CURRENT_DATE(),
        INTERVAL 30 DAY
      )
    QUALIFY ROW_NUMBER() OVER (
      PARTITION BY
        UPPER(cloud_provider),
        resource_name
      ORDER BY usage_date DESC, cost_id DESC
    ) = 1
  )
  SELECT
    CONCAT(
      "AUTO-COST-",
      cloud_provider,
      "-",
      SUBSTR(
        TO_HEX(
          MD5(
            CONCAT(
              cloud_provider,
              "|",
              COALESCE(environment, ""),
              "|",
              COALESCE(resource_name, "")
            )
          )
        ),
        1,
        12
      )
    ) AS incident_id,
    detected_ts,
    "COST_ANOMALY" AS incident_type,
    cloud_provider,
    environment,
    CASE
      WHEN estimated_monthly_extra_usd >= 5000
        THEN "CRITICAL"
      WHEN estimated_monthly_extra_usd >= 1000
        THEN "HIGH"
      ELSE "MEDIUM"
    END AS severity,
    FORMAT(
      "%s cost anomaly for %s: daily cost increased from $%.2f to $%.2f, approximately $%.2f extra per month.",
      cloud_provider,
      resource_name,
      baseline_daily_cost_usd,
      daily_cost_usd,
      estimated_monthly_extra_usd
    ) AS summary,
    resource_name AS affected_resource,
    service AS blocking_component,
    1.0 AS confidence,
    [cost_id] AS evidence_event_ids,
    estimated_monthly_extra_usd
  FROM anomalies
) AS source
ON target.incident_id = source.incident_id

WHEN MATCHED THEN
  UPDATE SET
    updated_ts = source.detected_ts,
    severity = IF(
      target.status IN ("DETECTED", "PENDING_ANALYSIS"),
      source.severity,
      target.severity
    ),
    summary = source.summary,
    affected_resource = source.affected_resource,
    blocking_component = source.blocking_component,
    confidence = source.confidence,
    evidence_event_ids = source.evidence_event_ids,
    estimated_monthly_impact_usd =
      source.estimated_monthly_extra_usd

WHEN NOT MATCHED THEN
  INSERT (
    incident_id,
    created_ts,
    updated_ts,
    incident_type,
    cloud_provider,
    environment,
    severity,
    status,
    summary,
    affected_resource,
    blocking_component,
    confidence,
    evidence_event_ids,
    estimated_monthly_impact_usd,
    approval_status
  )
  VALUES (
    source.incident_id,
    source.detected_ts,
    source.detected_ts,
    source.incident_type,
    source.cloud_provider,
    source.environment,
    source.severity,
    "DETECTED",
    source.summary,
    source.affected_resource,
    source.blocking_component,
    source.confidence,
    source.evidence_event_ids,
    source.estimated_monthly_extra_usd,
    "NOT_REQUESTED"
  )
"""


CHANGE_DETECTION_SQL = f"""
MERGE {INCIDENTS_TABLE} AS target
USING (
  SELECT
    CONCAT("AUTO-CHG-", change_id) AS incident_id,
    proposed_ts AS detected_ts,
    "CHANGE_RISK" AS incident_type,
    UPPER(cloud_provider) AS cloud_provider,
    environment,
    CASE
      WHEN UPPER(change_type) = "DELETE"
        THEN "HIGH"
      WHEN estimated_monthly_cost_change_usd >= 1000
        THEN "HIGH"
      WHEN estimated_monthly_cost_change_usd >= 250
        THEN "MEDIUM"
      ELSE "LOW"
    END AS severity,
    COALESCE(
      change_summary,
      FORMAT(
        "Pending %s proposal for %s.",
        change_type,
        resource_address
      )
    ) AS summary,
    resource_address AS affected_resource,
    change_type AS blocking_component,
    0.70 AS confidence,
    [change_id] AS evidence_event_ids,
    COALESCE(
      estimated_monthly_cost_change_usd,
      0.0
    ) AS estimated_monthly_extra_usd
  FROM {PROPOSED_CHANGES_TABLE}
  WHERE approval_status = "PENDING_REVIEW"
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY change_id
    ORDER BY proposed_ts DESC
  ) = 1
) AS source
ON target.incident_id = source.incident_id

WHEN MATCHED THEN
  UPDATE SET
    updated_ts = source.detected_ts,
    severity = IF(
      target.status IN ("DETECTED", "PENDING_ANALYSIS"),
      source.severity,
      target.severity
    ),
    summary = source.summary,
    affected_resource = source.affected_resource,
    blocking_component = source.blocking_component,
    evidence_event_ids = source.evidence_event_ids,
    estimated_monthly_impact_usd =
      source.estimated_monthly_extra_usd

WHEN NOT MATCHED THEN
  INSERT (
    incident_id,
    created_ts,
    updated_ts,
    incident_type,
    cloud_provider,
    environment,
    severity,
    status,
    summary,
    affected_resource,
    blocking_component,
    confidence,
    evidence_event_ids,
    estimated_monthly_impact_usd,
    approval_status
  )
  VALUES (
    source.incident_id,
    source.detected_ts,
    source.detected_ts,
    source.incident_type,
    source.cloud_provider,
    source.environment,
    source.severity,
    "PENDING_ANALYSIS",
    source.summary,
    source.affected_resource,
    source.blocking_component,
    source.confidence,
    source.evidence_event_ids,
    source.estimated_monthly_extra_usd,
    "PENDING_REVIEW"
  )
"""


def _execute(client: bigquery.Client, statement: str) -> None:
    """Execute one deterministic detection statement."""

    query_job = client.query(statement)
    query_job.result()


def run_detection() -> dict:
    """Detect and save network, cost and proposed-change cases."""

    client = bigquery.Client(project=PROJECT)

    _execute(client, NETWORK_DETECTION_SQL)
    _execute(client, COST_DETECTION_SQL)
    _execute(client, CHANGE_DETECTION_SQL)

    summary_query = f"""
    SELECT
      incident_type,
      COUNT(*) AS case_count
    FROM {INCIDENTS_TABLE}
    GROUP BY incident_type
    ORDER BY incident_type
    """

    cases_by_type = {
        row["incident_type"]: row["case_count"]
        for row in client.query(summary_query).result()
    }

    return {
        "status": "ok",
        "project": PROJECT,
        "dataset": DATASET,
        "cases_by_type": cases_by_type,
        "total_cases": sum(cases_by_type.values()),
    }


if __name__ == "__main__":
    print(
        json.dumps(
            run_detection(),
            indent=2,
            default=str,
        )
    )
