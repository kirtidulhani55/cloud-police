# Cloud Police approval backend

The approval service is separate from the public read-only dashboard API. It
verifies a Google Identity Platform ID token before accepting any decision,
updates the current case state in BigQuery, and appends an audit record that
identifies the reviewer and decision time.

An approval only authorizes engineering planning. This service never executes
Terraform and never changes cloud infrastructure.

## Required environment variables

- `GCP_PROJECT`: project containing the BigQuery dataset.
- `BQ_DATASET`: dataset name; defaults to `cloud_police`.
- `IDENTITY_PLATFORM_PROJECT`: Identity Platform project; defaults to
  `GCP_PROJECT`.
- `APPROVER_EMAILS`: comma-separated reviewer allowlist. Keep this configured
  in production even though public registration is disabled.
- `ALLOWED_ORIGINS`: comma-separated exact frontend origins. `*` is useful only
  for temporary Cloud Shell preview testing.

The Cloud Run runtime service account needs permission to run BigQuery jobs,
read the incidents table, update incident rows, and append audit rows.

## Provision the audit table

Run this once before deploying the service:

```bash
bq query --use_legacy_sql=false < approval_decisions_schema.sql
```

## API

All routes below require an Identity Platform token:

```text
Authorization: Bearer <ID_TOKEN>
```

- `POST /api/cases/{incident_id}/decisions`
- `GET /api/cases/{incident_id}/decisions`
- `GET /api/approval-decisions?limit=100`

The POST request also requires a unique `Idempotency-Key` header. Valid bodies
are:

```json
{"action":"APPROVE","reason":"Reviewed the evidence and plan."}
```

```json
{"action":"REJECT","reason":"The proposed scope is too broad."}
```

```json
{
  "action":"REQUEST_EVIDENCE",
  "reason":"Provide the last known-good Terraform plan."
}
```

Public registration remains disabled. Reviewer accounts are created by the
Cloud Police administrator in Identity Platform and must also appear in the
`APPROVER_EMAILS` allowlist.
