# Cloud Police API connection

The React console reads current Cloud Police data from the dashboard API and records authorized reviewer actions through the approval API.

## Dashboard API

Configured with `VITE_CLOUD_POLICE_API_URL`:

- `GET /api/dashboard`
- `GET /api/cases?limit=50`
- `GET /api/cases/<incident_id>`

The frontend sends the signed-in user's Identity Platform token. A successful response may contain zero records for one or more case types; the console treats that as a valid healthy empty state.

## Approval API

Configured with `VITE_CLOUD_POLICE_APPROVAL_API_URL`:

- Reads recorded case decision history
- Records approval, rejection, and evidence requests
- Allows Admin users to reopen eligible cases
- Provides protected user-management operations

Every protected request includes a fresh Identity Platform token. Authorization and case-transition validation remain server-side.

## Safety behavior

- The website cannot call `/monitor/run`.
- The website does not apply Terraform or modify cloud resources.
- Reviewer decisions are saved through the authenticated backend, not browser-local storage.
- If a live refresh fails after data was loaded, the last successful result remains visible with a warning.
- If the initial live connection fails, the console does not display sample cases as live information.

## Verification

```bash
npm ci
npm run lint
npm run build
```
