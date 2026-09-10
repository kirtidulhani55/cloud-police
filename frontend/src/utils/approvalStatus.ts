import { ApprovalDecisionType, ApprovalStatus } from '../types';

export type ApprovalStatusValue = ApprovalStatus | ApprovalDecisionType | string | null | undefined;

export const normalizeApprovalStatus = (value: ApprovalStatusValue): ApprovalStatus => {
  switch (String(value || '').trim().toUpperCase()) {
    case 'APPROVED':
    case 'APPROVED_FOR_PLANNING':
      return 'APPROVED';
    case 'REJECTED':
      return 'REJECTED';
    case 'EVIDENCE_REQUESTED':
    case 'AWAITING_EVIDENCE':
    case 'MORE_EVIDENCE_REQUESTED':
      return 'EVIDENCE_REQUESTED';
    case 'PENDING':
    case 'AWAITING_REVIEW':
    case 'PENDING_REVIEW':
    case 'AWAITING_HUMAN_APPROVAL':
    case 'REOPENED':
      return 'PENDING';
    case 'MIXED':
      return 'MIXED';
    default:
      return 'UNKNOWN';
  }
};

export const isApprovalOpen = (value: ApprovalStatusValue): boolean => {
  const status = normalizeApprovalStatus(value);
  return status === 'PENDING' || status === 'EVIDENCE_REQUESTED';
};

export const aggregateApprovalStatus = (
  values: ApprovalStatusValue[]
): ApprovalStatus => {
  const statuses = values.map(normalizeApprovalStatus);
  if (statuses.length === 0) return 'UNKNOWN';
  return statuses.every((status) => status === statuses[0]) ? statuses[0] : 'MIXED';
};

export const approvalStatusLabel = (value: ApprovalStatusValue): string => {
  switch (normalizeApprovalStatus(value)) {
    case 'MIXED': return 'Mixed review statuses';
    case 'UNKNOWN': return 'Status unavailable';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    case 'EVIDENCE_REQUESTED':
      return 'Evidence Requested';
    default:
      return 'Awaiting Review';
  }
};

export const approvalStatusDescription = (value: ApprovalStatusValue): string => {
  switch (normalizeApprovalStatus(value)) {
    case 'MIXED': return 'Individual changes have different review statuses. Inspect each change for its recorded decision.';
    case 'UNKNOWN': return 'No recognized review status was returned. Refresh the live data before making a decision.';
    case 'APPROVED':
      return 'Approved for engineering planning. No infrastructure change has been applied.';
    case 'REJECTED':
      return 'Rejected by a human reviewer. Infrastructure remains unchanged.';
    case 'EVIDENCE_REQUESTED':
      return 'Additional evidence was requested before a final decision.';
    default:
      return 'Awaiting human review. Cloud Police has not approved or applied an infrastructure change.';
  }
};

export const approvalStatusPresentation = (value: ApprovalStatusValue) => {
  const status = normalizeApprovalStatus(value);

  if (status === 'MIXED' || status === 'UNKNOWN') {
    return { label: approvalStatusLabel(status), pillClass: 'border-[#7B7468]/35 bg-[#7B7468]/10 text-[#7B7468] dark:text-[#A9A39A]', dotClass: 'bg-[#7B7468]' };
  }

  if (status === 'APPROVED') {
    return {
      label: 'Approved',
      pillClass:
        'border-[#2E8B75]/35 bg-[#2E8B75]/10 text-[#2E8B75] dark:text-[#48B896]',
      dotClass: 'bg-[#2E8B75] dark:bg-[#48B896]',
    };
  }

  if (status === 'REJECTED') {
    return {
      label: 'Rejected',
      pillClass:
        'border-[#C8545E]/35 bg-[#C8545E]/10 text-[#C8545E] dark:text-[#DD6B73]',
      dotClass: 'bg-[#C8545E] dark:bg-[#DD6B73]',
    };
  }

  if (status === 'EVIDENCE_REQUESTED') {
    return {
      label: 'Evidence Requested',
      pillClass:
        'border-[#AD702F]/35 bg-[#AD702F]/10 text-[#AD702F] dark:text-[#D5A45A]',
      dotClass: 'bg-[#AD702F] dark:bg-[#D5A45A]',
    };
  }

  return {
    label: 'Awaiting Review',
    pillClass:
      'border-[#AD702F]/35 bg-[#AD702F]/10 text-[#AD702F] dark:text-[#D5A45A]',
    dotClass: 'bg-[#AD702F] dark:bg-[#D5A45A]',
  };
};
