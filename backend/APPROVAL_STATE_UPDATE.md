# Cloud Police approval state update

This update hardens the existing Approval API; it does not rebuild it.

## Enforced transitions

- Pending -> Request evidence, Approve, or Reject
- Evidence requested -> Approve or Reject
- A second Request evidence -> blocked with HTTP 409
- Approved or Rejected -> locked with HTTP 409
- Unknown approval states -> blocked

The BigQuery transaction also checks that the case state has not changed since
it was read, preventing two simultaneous requests from bypassing the rules.

## Files

- `approval_service/api.py`: API and atomic BigQuery enforcement
- `approval_service/transitions.py`: testable transition policy
- `tests/test_approval_transitions.py`: state-policy tests

## Test

From the project root:

```bash
python3 -m unittest discover -s tests -v
```

Expected result: five tests pass.
