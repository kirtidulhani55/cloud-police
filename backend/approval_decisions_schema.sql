CREATE TABLE IF NOT EXISTS
  `cloudpolice-506015.cloud_police.approval_decisions`
(
  decision_id STRING NOT NULL,
  incident_id STRING NOT NULL,
  action STRING NOT NULL,
  reason STRING,
  previous_approval_status STRING,
  resulting_approval_status STRING NOT NULL,
  resulting_case_status STRING NOT NULL,
  reviewer_user_id STRING NOT NULL,
  reviewer_email STRING NOT NULL,
  reviewer_name STRING,
  decided_ts TIMESTAMP NOT NULL,
  identity_issuer STRING,
  identity_provider STRING,
  idempotency_key_hash STRING NOT NULL,
  safety_notice STRING NOT NULL
)
PARTITION BY DATE(decided_ts)
CLUSTER BY incident_id, action, reviewer_email
OPTIONS (
  description = "Immutable human-review audit records for Cloud Police cases"
);
