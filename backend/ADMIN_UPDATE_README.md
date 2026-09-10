# Cloud Police Admin Backend Update

This patch adds the backend portion of the Cloud Police user-management system.

## Included

- Identity Platform user listing, creation and updates.
- Operator, Approver and Admin custom roles.
- Admin-only API routes.
- Account enable and disable support.
- Protection against self-demotion and self-disable.
- Append-only BigQuery administration audit events.
- Restricted CORS support through `ALLOWED_ORIGINS`.
- Missing-token protection tests for all Admin routes.

## Not included

- Passwords, API keys, email addresses or other secrets.
- The BigQuery table itself; it was created separately.
- Cloud Run environment values.
- The frontend Admin Users page.
- Deployment, because the two Cloud Run entry points must be confirmed first.

## Apply in Cloud Shell

Back up the existing project before extracting:

```bash
cd "$HOME/cloudpolice"
cp access_control.py access_control.py.before_admin_zip
cp approval_app.py approval_app.py.before_admin_zip
cp requirements.txt requirements.txt.before_admin_zip
```

Extract the ZIP into the existing project, then verify:

```bash
python3 -m py_compile \
  access_control.py \
  admin_service/identity_users.py \
  admin_service/audit.py \
  admin_service/api.py \
  approval_app.py

python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Do not deploy until `ALLOWED_ORIGINS` is set to the real frontend domain and the
approval/dashboard service entry points have been confirmed.
