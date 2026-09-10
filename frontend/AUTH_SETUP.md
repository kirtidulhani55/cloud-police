# Cloud Police reviewer authentication

Cloud Police uses Google Cloud Identity Platform for protected console access:

- The marketing and legal pages are public.
- The console, evidence, admin tools, and reviewer workflows require sign-in.
- The backend verifies the Identity Platform token and enforces Operator, Approver, and Admin roles.
- Public registration is disabled; an administrator creates accounts.

## 1. Enable Google Cloud Identity Platform

In Google Cloud Console for project `cloudpolice-506015`:

1. Open **Identity Platform** and enable it for the project.
2. Open **Providers** and enable **Email / Password**.
3. Create reviewer accounts through Identity Platform or the protected Cloud Police Admin page.
4. Use the project's Web API key for the website build.

Do not add a sign-up page to this application. Account creation remains an administrator action.

## 2. Configure the frontend build

```bash
cd ~/cloudpolice-website
cp .env.example .env.local
```

Set these values in `.env.local`:

```dotenv
VITE_IDENTITY_PLATFORM_API_KEY="PASTE_RESTRICTED_WEB_API_KEY_HERE"
VITE_CLOUD_POLICE_API_URL="https://cloud-police-dashboard-api-794315906908.us-east1.run.app"
VITE_CLOUD_POLICE_APPROVAL_API_URL="https://cloud-police-approval-api-794315906908.us-east1.run.app"
```

Vite embeds `VITE_` values while building. Creating Cloud Run runtime variables after the frontend has already been built will not update the browser bundle. Rebuild after changing any value.

Restrict the Web API key to the Identity Toolkit API and the approved Cloud Run website URL and development origins. Do not commit `.env.local`.

## 3. Validate authentication

```bash
npm ci
npm run lint
npm run build
```

Before deployment, verify:

- An Operator can enter the console but cannot record reviewer decisions.
- An Approver can record approval, rejection, and evidence requests.
- An Admin can access user management and reopen eligible cases.
- Signing out removes the browser session.
- Password reset sends through Identity Platform.

## 4. Protected decision recording

Reviewer actions send a fresh Identity Platform token to the approval API. The API validates the user's role, records an append-only decision in BigQuery, and updates the case state. No approval action in the website directly applies infrastructure changes.

Before public deployment, configure backend CORS to allow only the final website origin.
