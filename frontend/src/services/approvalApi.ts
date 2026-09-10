import { ApprovalHistoryRecord, ApprovalItem } from '../types';
import { getReviewerIdToken } from './authService';
import { publicRuntimeConfig } from './runtimeConfig';

const DEFAULT_APPROVAL_API_URL =
  'https://cloud-police-approval-api-794315906908.us-east1.run.app';

const APPROVAL_API_URL = publicRuntimeConfig(
  'VITE_CLOUD_POLICE_APPROVAL_API_URL',
  DEFAULT_APPROVAL_API_URL
).replace(/\/$/, '');

export type ApprovalAction = 'APPROVE' | 'REJECT' | 'REQUEST_EVIDENCE' | 'REOPEN';

export interface RecordedApprovalDecision {
  decision_id: string;
  incident_id: string;
  action: ApprovalAction;
  reason: string | null;
  resulting_approval_status: string;
  resulting_case_status: string;
  reviewer_user_id: string;
  reviewer_email: string | null;
  reviewer_name: string | null;
  decided_ts: string;
}

interface DecisionResponse {
  status: string;
  decision: RecordedApprovalDecision;
}

interface DecisionHistoryRow {
  decision_id: string;
  incident_id: string;
  action: ApprovalAction;
  reason: string | null;
  resulting_approval_status: string;
  reviewer_email: string | null;
  reviewer_name: string | null;
  decided_ts: string;
}

interface DecisionHistoryResponse {
  status: string;
  decisions: DecisionHistoryRow[];
}

interface ApiErrorBody {
  message?: string;
}

export class ApprovalApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApprovalApiError';
    this.status = status;
  }
}

function requestId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `approval-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorBody;
    return payload.message || `Approval API returned HTTP ${response.status}.`;
  } catch {
    return `Approval API returned HTTP ${response.status}.`;
  }
}

export async function recordApprovalDecision(
  incidentId: string,
  payload: {
    action: ApprovalAction;
    reason?: string;
    evidence_request?: string;
  }
): Promise<RecordedApprovalDecision> {
  const token = await getReviewerIdToken();
  const response = await fetch(
    `${APPROVAL_API_URL}/api/cases/${encodeURIComponent(incidentId)}/decisions`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': requestId(),
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new ApprovalApiError(await readError(response), response.status);
  }

  const result = (await response.json()) as DecisionResponse;
  return result.decision;
}

export async function reopenCase(
  incidentId: string,
  reason: string
): Promise<RecordedApprovalDecision> {
  const token = await getReviewerIdToken();
  const response = await fetch(
    `${APPROVAL_API_URL}/api/cases/${encodeURIComponent(incidentId)}/reopen`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': requestId(),
      },
      body: JSON.stringify({ reason }),
    }
  );

  if (!response.ok) {
    throw new ApprovalApiError(await readError(response), response.status);
  }

  const result = (await response.json()) as DecisionResponse;
  return result.decision;
}

function historyRecord(
  row: DecisionHistoryRow,
  item: ApprovalItem
): ApprovalHistoryRecord {
  const approved = row.action === 'APPROVE';
  const rejected = row.action === 'REJECT';
  const reopened = row.action === 'REOPEN';
  const reviewer =
    row.reviewer_name || row.reviewer_email || 'Verified reviewer';
  const notes = row.reason || undefined;

  return {
    id: row.decision_id,
    approvalItemId: row.incident_id,
    recommendationTitle: item.recommendationTitle,
    recommendationType: item.recommendationType,
    provider: item.provider,
    riskLevel: item.riskLevel,
    decision: approved
      ? 'APPROVED'
      : rejected
        ? 'REJECTED'
        : reopened
          ? 'REOPENED'
          : 'EVIDENCE_REQUESTED',
    statusLabel: approved
      ? 'Approved for Change Planning'
      : rejected
        ? 'Rejected'
        : reopened
          ? 'Reopened for Re-review'
          : 'More Evidence Requested',
    finalStatus: row.resulting_approval_status,
    reviewer,
    timestamp: new Date(row.decided_ts).toLocaleString(),
    notes,
    decisionReason: notes,
    evidenceReviewed: item.evidenceReviewed,
    safetyNotice: approved
      ? 'Approval recorded. No infrastructure change has been applied.'
      : rejected
        ? 'Proposal rejected. Infrastructure remains unmodified.'
        : reopened
          ? 'Case reopened by an administrator. No infrastructure change has been applied.'
          : 'Item kept in queue while additional evidence is collected.',
    operationType: item.operationType,
    technicalEvidence: item.technicalEvidence,
  };
}

export async function loadApprovalDecisionHistory(
  items: ApprovalItem[]
): Promise<ApprovalHistoryRecord[]> {
  if (items.length === 0) return [];

  const token = await getReviewerIdToken();
  const response = await fetch(
    `${APPROVAL_API_URL}/api/approval-decisions?limit=250`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new ApprovalApiError(await readError(response), response.status);
  }

  const payload = (await response.json()) as DecisionHistoryResponse;
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return payload.decisions
    .map((row) => ({ row, item: itemsById.get(row.incident_id) }))
    .filter(
      (entry): entry is { row: DecisionHistoryRow; item: ApprovalItem } =>
        Boolean(entry.item)
    )
    .sort(
      (a, b) =>
        new Date(b.row.decided_ts).getTime() -
        new Date(a.row.decided_ts).getTime()
    )
    .map(({ row, item }) => historyRecord(row, item));
}
