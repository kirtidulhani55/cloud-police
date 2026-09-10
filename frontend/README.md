# Cloud Police website

React and TypeScript frontend for Cloud Police multi-cloud monitoring, incident review, cost intelligence, change inspection, evidence review, and recorded reviewer approvals.

## Requirements

- Node.js 22
- A Google Cloud Identity Platform Web API key restricted to approved website origins and the Identity Toolkit API
- Reachable Cloud Police dashboard and approval APIs

## Local setup

```bash
cp .env.example .env.local
npm ci
npm run lint
npm run build
npm run dev -- --host 0.0.0.0 --port 3000
```

Set the real restricted Web API key in `.env.local` before building. Vite reads all `VITE_` settings at build time.

## Production start

The Docker image builds the Vite application and serves `dist` through the included Express server:

```bash
npm start
```

The server exposes `/healthz`, adds browser security headers, and supports the public, authentication, console, and legal routes used by the application.

## Safety model

- The console requires a verified Identity Platform session.
- Dashboard reads and reviewer decisions use a fresh identity token.
- Approval, rejection, evidence-request, and reopen actions are recorded by the backend.
- The website does not apply Terraform or directly modify cloud resources.
- When live APIs are unavailable, sample cases are not presented as live data.

See `AUTH_SETUP.md` and `API_CONNECTION_NOTES.md` for configuration details.
