# Cloud Police reliability patch

This update preserves the existing theme, layout, navigation, authentication flow, approval workflow, and backend behavior.

## Changes

- Treats zero incidents, zero cost anomalies, or zero proposed changes as valid empty states.
- Prevents sample incident and cost records from appearing when a live category is empty.
- Moves the theme bootstrap into a same-origin file allowed by the production Content Security Policy.
- Allows the existing Google Fonts resources in the Content Security Policy.
- Adds `.env.example` with the required build-time settings and no credentials.
- Corrects the authentication, API, and local setup documentation.

## Validation completed

- `npm ci`
- `npm run lint`
- `npm run build`
- Production server `/healthz`, `/`, and `/theme-init.js` smoke checks
- Browser security-header inspection
- Python syntax compilation for the unchanged backend
- Final changed-file review against the uploaded baseline

The existing JavaScript bundle-size warning remains unchanged in scope and can be handled separately through code splitting.
