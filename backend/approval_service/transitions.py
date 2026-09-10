FINAL_APPROVAL_STATUSES = {"APPROVED", "REJECTED"}
PENDING_APPROVAL_STATUSES = {
    "",
    "PENDING",
    "PENDING_REVIEW",
    "AWAITING_APPROVAL",
}
EVIDENCE_APPROVAL_STATUS = "EVIDENCE_REQUESTED"


def transition_error(
    previous_approval_status: str,
    action: str,
) -> str | None:
    """Return a user-safe error when an approval transition is invalid."""

    if previous_approval_status in FINAL_APPROVAL_STATUSES:
        return "This case already has a final human decision."

    if action == "REQUEST_EVIDENCE":
        if previous_approval_status == EVIDENCE_APPROVAL_STATUS:
            return "Additional evidence has already been requested for this case."
        if previous_approval_status not in PENDING_APPROVAL_STATUSES:
            return "Evidence cannot be requested from the case's current state."
        return None

    if action in {"APPROVE", "REJECT"} and previous_approval_status not in (
        PENDING_APPROVAL_STATUSES | {EVIDENCE_APPROVAL_STATUS}
    ):
        return "This decision is not allowed from the case's current state."

    return None


def reopen_error(previous_approval_status: str) -> str | None:
    """Return a user-safe error when reopening a case is not allowed.

    Only a case that already has a final human decision (APPROVED or
    REJECTED) can be reopened. Anything still pending or awaiting
    evidence isn't "closed" yet, so reopening it has no meaning.
    """

    if previous_approval_status not in FINAL_APPROVAL_STATUSES:
        return "Only a finalized (approved or rejected) case can be reopened."

    return None
