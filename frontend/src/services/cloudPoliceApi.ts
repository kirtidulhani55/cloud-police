import {
  ApprovalItem,
  ApprovalStatus,
  ChangeInspectorData,
  CostAnomalyData,
  NetworkIncidentData,
  Provider,
  RiskLevel,
} from '../types';
import { getReviewerIdToken } from './authService';
import { publicRuntimeConfig } from './runtimeConfig';
import {
  aggregateApprovalStatus,
  approvalStatusDescription,
  isApprovalOpen,
} from '../utils/approvalStatus';

const DEFAULT_API_URL =
  'https://cloud-police-dashboard-api-794315906908.us-east1.run.app';

const API_URL = publicRuntimeConfig(
  'VITE_CLOUD_POLICE_API_URL',
  DEFAULT_API_URL
).replace(/\/$/, '');

type JsonRecord = Record<string, unknown>;

interface ApiCaseSummary {
  affected_resource: string | null;
  approval_status: string;
  cloud_provider: string;
  confidence: number | null;
  created_ts?: string;
  environment: string;
  estimated_monthly_impact_usd: number | null;
  incident_id: string;
  incident_type: 'NETWORK_INCIDENT' | 'COST_ANOMALY' | 'CHANGE_RISK';
  severity: string;
  status: string;
  summary: string;
  updated_ts: string;
}

interface ApiCaseDetail extends ApiCaseSummary {
  approved_by: string | null;
  blocking_component: string | null;
  diagnosis: unknown;
  escalation_note: string | null;
  evidence_event_ids: string[];
  remediation_terraform: string | null;
  root_cause: string | null;
}

interface DashboardSummary {
  awaiting_human_approval: number;
  change_risks: number;
  cost_anomalies: number;
  estimated_monthly_cost_impact_usd: number;
  high_risk_cases: number;
  last_updated: string | null;
  network_incidents: number;
  total_cases: number;
}

export type MonitoringState =
  | 'HEALTHY'
  | 'DELAYED'
  | 'ATTENTION_REQUIRED'
  | 'UNKNOWN';

export interface MonitoringExecution {
  analyzed_cases: number | null;
  completed_at: string | null;
  detected_cases: number | null;
  run_id: string;
  started_at: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED';
}

export interface MonitoringStatus {
  clouds_checked: string[];
  job_name: string;
  last_successful_scan: string | null;
  latest_execution: MonitoringExecution | null;
  schedule_minutes: number;
  successful_runs_24h: number;
  total_runs_24h: number;
  state: MonitoringState;
}

interface DashboardResponse {
  status: string;
  safety_mode: string;
  summary: DashboardSummary;
  monitoring?: MonitoringStatus;
}

interface CasesResponse {
  status: string;
  count: number;
  cases: ApiCaseSummary[];
  details_included?: boolean;
}

interface CaseResponse {
  status: string;
  case: ApiCaseDetail;
}

export interface LiveDashboardData {
  summary: DashboardSummary;
  monitoring: MonitoringStatus | null;
  networkIncident: NetworkIncidentData;
  networkIncidents: NetworkIncidentData[];
  costAnomaly: CostAnomalyData;
  costAnomalies: CostAnomalyData[];
  changeInspector: ChangeInspectorData;
  approvalItems: ApprovalItem[];
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function providerName(value: string): Provider {
  switch (value.toUpperCase()) {
    case 'AWS':
      return 'AWS';
    case 'GCP':
      return 'GCP';
    case 'AZURE':
      return 'Azure';
    default:
      return 'Multi-Cloud';
  }
}

function riskLevel(value: string): RiskLevel {
  const normalized = value.toUpperCase();
  if (
    normalized === 'CRITICAL' ||
    normalized === 'HIGH' ||
    normalized === 'MEDIUM' ||
    normalized === 'LOW' ||
    normalized === 'SAFE'
  ) {
    return normalized;
  }
  return 'MEDIUM';
}

function approvalStatus(value: string): ApprovalItem['status'] {
  switch (value.toUpperCase()) {
    case 'APPROVED':
    case 'APPROVED_FOR_PLANNING':
      return 'APPROVED_FOR_PLANNING';
    case 'REJECTED':
      return 'REJECTED';
    case 'EVIDENCE_REQUESTED':
    case 'AWAITING_EVIDENCE':
    case 'MORE_EVIDENCE_REQUESTED':
      return 'MORE_EVIDENCE_REQUESTED';
    default:
      return 'PENDING';
  }
}

function caseApprovalStatus(value: string): ApprovalStatus {
  switch (value.toUpperCase()) {
    case 'APPROVED':
    case 'APPROVED_FOR_PLANNING':
      return 'APPROVED';
    case 'REJECTED':
      return 'REJECTED';
    case 'EVIDENCE_REQUESTED':
    case 'AWAITING_EVIDENCE':
    case 'MORE_EVIDENCE_REQUESTED':
      return 'EVIDENCE_REQUESTED';
    default:
      return 'PENDING';
  }
}

function confidenceLabel(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'Not reported';
  }
  return `${(value * 100).toFixed(value === 1 ? 0 : 1)}%`;
}

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

async function requestJson<T>(path: string): Promise<T> {
  const idToken = await getReviewerIdToken();

  const response = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Cloud Police API returned HTTP ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function loadCaseDetails(incidentId: string): Promise<ApiCaseDetail> {
  const response = await requestJson<CaseResponse>(
    `/api/cases/${encodeURIComponent(incidentId)}`
  );
  return response.case;
}

function mapNetworkCase(item: ApiCaseDetail): NetworkIncidentData {
  const status = caseApprovalStatus(item.approval_status);
  const stored = asRecord(item.diagnosis);
  const diagnosis = asRecord(stored.diagnosis);
  const remediation = asRecord(stored.remediation);
  const evidenceIds =
    asStringArray(remediation.evidence_ids).length > 0
      ? asStringArray(remediation.evidence_ids)
      : item.evidence_event_ids;

  return {
    id: item.incident_id,
    operationalStatus: item.status || 'UNKNOWN',
    provider: providerName(item.cloud_provider),
    title: `${providerName(item.cloud_provider)} Connectivity Incident`,
    simpleSummary: item.summary,
    severity: riskLevel(item.severity),
    status,
    confidence: confidenceLabel(item.confidence),
    confidenceReason:
      'Calculated by the Diagnosis Agent from matching BigQuery evidence.',
    sourceResource: asString(diagnosis.source_resource, 'Source workload'),
    affectedResource: item.affected_resource || 'Affected resource',
    affectedPort: asNumber(diagnosis.affected_port) || undefined,
    blockingComponent: item.blocking_component || 'Blocking component',
    updatedAt: item.updated_ts,
    plainLanguage: {
      whatHappened: item.summary,
      whyItMatters: asString(
        diagnosis.root_cause,
        asString(item.root_cause, item.summary)
      ),
      rootCause: asString(item.root_cause, 'Root cause requires human review.'),
      evidenceReviewed:
        evidenceIds.length > 0
          ? `BigQuery evidence IDs: ${evidenceIds.join(', ')}.`
          : 'No evidence identifiers were returned.',
      recommendedNextStep: asString(
        diagnosis.recommended_next_action,
        asString(
          remediation.proposed_fix,
          asString(item.escalation_note, 'Review the case with a cloud engineer.')
        )
      ),
      humanApprovalStatus: approvalStatusDescription(status),
    },
    technicalDetails: {
      incidentId: item.incident_id,
      evidenceIds,
      rawTelemetry: asRecord(item.diagnosis),
    },
  };
}

function mapCostCase(item: ApiCaseDetail): CostAnomalyData {
  const status = caseApprovalStatus(item.approval_status);
  const diagnosis = asRecord(item.diagnosis);
  const currentDaily = asNumber(diagnosis.daily_cost_usd);
  const baselineDaily = asNumber(diagnosis.baseline_daily_cost_usd);
  const increase = asNumber(diagnosis.increase_pct);
  const monthlyExtra = asNumber(
    diagnosis.estimated_monthly_extra_usd,
    item.estimated_monthly_impact_usd || 0
  );

  return {
    id: item.incident_id,
    operationalStatus: item.status || 'UNKNOWN',
    provider: providerName(item.cloud_provider),
    title: `${providerName(item.cloud_provider)} Cost Anomaly`,
    simpleSummary: item.summary,
    severity: riskLevel(item.severity),
    status,
    confidence: confidenceLabel(item.confidence),
    confidenceReason:
      'Calculated by the Cost Agent from BigQuery cost and baseline records.',
    resourceName:
      item.affected_resource ||
      asString(diagnosis.resource_name, 'Affected resource'),
    service:
      item.blocking_component ||
      asString(diagnosis.service, 'Cloud service'),
    updatedAt: item.updated_ts,
    metrics: {
      previousDailyCost: `${currency(baselineDaily)} / day`,
      newDailyCost: `${currency(currentDaily)} / day`,
      percentageIncrease: `${increase >= 0 ? '+' : ''}${increase.toFixed(1)}%`,
      monthlyExtraCost: `${currency(monthlyExtra)} / month`,
      cpuUtilization: 'Not provided by the current evidence',
    },
    plainLanguage: {
      whatHappened: item.summary,
      whyItMatters: `${currency(monthlyExtra)} in estimated additional monthly cost requires review.`,
      rootCause: asString(
        diagnosis.likely_cause,
        asString(item.root_cause, 'The exact cause requires human investigation.')
      ),
      evidenceReviewed:
        item.evidence_event_ids.length > 0
          ? `BigQuery cost evidence IDs: ${item.evidence_event_ids.join(', ')}.`
          : 'BigQuery cost and baseline records.',
      recommendedNextStep: asString(
        diagnosis.recommended_next_action,
        asString(item.escalation_note, 'Review recent resource and billing changes.')
      ),
      humanApprovalStatus: approvalStatusDescription(status),
    },
    technicalDetails: {
      anomalyId: item.incident_id,
      evidenceIds: item.evidence_event_ids,
      rawTelemetry: diagnosis,
    },
  };
}

function mapChangeCases(items: ApiCaseDetail[]): ChangeInspectorData {
  const severityOrder: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    SAFE: 0,
  };
  const highest = [...items].sort(
    (a, b) =>
      (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
  )[0];
  const evidenceIds = items.flatMap((item) => item.evidence_event_ids);
  const highRiskCount = items.filter(
    (item) => item.severity === 'CRITICAL' || item.severity === 'HIGH'
  ).length;
  const changes = items.map((item) => {
    const diagnosis = asRecord(item.diagnosis);
    return {
      id: item.incident_id,
      cloud: providerName(item.cloud_provider) as 'Azure' | 'AWS' | 'GCP',
      resource: item.affected_resource || 'Resource not specified',
      action: `${item.blocking_component || 'CHANGE'}: ${item.summary}`,
      status: caseApprovalStatus(item.approval_status),
      riskLevel: riskLevel(item.severity),
      riskSummary: `${item.severity} Risk`,
      plainExplanation: asString(
        diagnosis.predicted_impact,
        asString(item.root_cause, item.summary)
      ),
      diffSnippet: asString(
        diagnosis.plain_language_summary,
        'Review the exact Terraform plan before approval.'
      ),
      evidenceIds: item.evidence_event_ids,
      updatedAt: item.updated_ts,
    };
  });
  const aggregateStatus = aggregateApprovalStatus(changes.map((change) => change.status));
  const openChangeCount = changes.filter((change) => isApprovalOpen(change.status)).length;

  return {
    id: 'LIVE-CHANGE-REVIEW',
    provider: 'Multi-Cloud',
    title: 'Review Proposed Cloud Changes',
    simpleSummary:
      openChangeCount > 0
        ? `${openChangeCount} of ${items.length} proposed Terraform changes are awaiting human safety review.`
        : `${items.length} proposed Terraform changes have recorded review decisions.`,
    severity: riskLevel(highest?.severity || 'LOW'),
    status: aggregateStatus,
    confidence: confidenceLabel(highest?.confidence ?? null),
    confidenceReason:
      'Risk levels were produced by the Cloud Inspector from proposed-change records in BigQuery.',
    changes,
    plainLanguage: {
      whatHappened: `${items.length} proposed infrastructure changes were detected across AWS, Azure and GCP.`,
      whyItMatters: `${highRiskCount} change${highRiskCount === 1 ? '' : 's'} require additional investigation before deployment.`,
      rootCause:
        'These are proposed changes, not current incidents. Their effects must be validated before deployment.',
      evidenceReviewed:
        evidenceIds.length > 0
          ? `BigQuery change IDs: ${evidenceIds.join(', ')}.`
          : 'Proposed change records stored in BigQuery.',
      recommendedNextStep:
        'Review each Terraform plan, its dependencies, security impact and cost impact before making a decision.',
      humanApprovalStatus: approvalStatusDescription(aggregateStatus),
    },
    technicalDetails: {
      planId: 'LIVE-CHANGE-REVIEW',
      evidenceIds,
      rawTelemetry: { cases: items.map((item) => item.diagnosis) },
    },
  };
}

function mapApprovalItem(item: ApiCaseDetail): ApprovalItem {
  const stored = asRecord(item.diagnosis);
  const diagnosis =
    item.incident_type === 'NETWORK_INCIDENT'
      ? asRecord(stored.diagnosis)
      : stored;
  const remediation = asRecord(stored.remediation);
  const requiredChecks = asStringArray(diagnosis.required_human_checks);
  const validationSteps = asStringArray(remediation.validation_steps);
  const operationType =
    item.incident_type === 'NETWORK_INCIDENT'
      ? 'network'
      : item.incident_type === 'COST_ANOMALY'
        ? 'cost'
        : 'change';

  return {
    id: item.incident_id,
    recommendationTitle: item.summary,
    operationType,
    confidenceScore: confidenceLabel(item.confidence),
    blastRadius: asString(item.root_cause, item.summary),
    evidenceQuery: `SELECT
  incident_id,
  incident_type,
  cloud_provider,
  severity,
  status,
  summary,
  root_cause,
  confidence,
  evidence_event_ids,
  diagnosis,
  updated_ts
FROM \`cloudpolice-506015.cloud_police.incidents\`
WHERE incident_id = "${item.incident_id}"`,
    recommendationType:
      operationType === 'network'
        ? 'Incident Remediation'
        : operationType === 'cost'
          ? 'Cost Investigation'
          : 'Pre-Flight Change Review',
    createdAt: item.created_ts || item.updated_ts,
    provider: providerName(item.cloud_provider),
    riskLevel: riskLevel(item.severity),
    businessImpact: asString(item.root_cause, item.summary),
    evidenceReviewed:
      item.evidence_event_ids.length > 0
        ? `BigQuery evidence IDs: ${item.evidence_event_ids.join(', ')}.`
        : 'The AI result and source case stored in BigQuery.',
    proposedAction: asString(
      remediation.proposed_fix,
      asString(
        diagnosis.recommended_next_action,
        asString(
          diagnosis.recommendation,
          asString(item.escalation_note, 'Human investigation is required.')
        )
      )
    ),
    validationSteps:
      validationSteps.length > 0
        ? validationSteps
        : requiredChecks.length > 0
          ? requiredChecks
          : ['Review the complete evidence and verify the proposed action.'],
    rollbackGuidance: asString(
      remediation.rollback_plan,
      'No infrastructure change is applied by this read-only dashboard.'
    ),
    status: approvalStatus(item.approval_status),
    technicalEvidence: {
      tableName: 'BigQuery.cloud_police.incidents',
      query: `Read-only case: ${item.incident_id}`,
      dataPoints: `${item.evidence_event_ids.length} linked evidence identifier(s)`,
    },
  };
}

export async function loadLiveDashboardData(): Promise<LiveDashboardData> {
  const [dashboard, cases] = await Promise.all([
    requestJson<DashboardResponse>('/api/dashboard'),
    requestJson<CasesResponse>('/api/cases?limit=50&include=details'),
  ]);

  // Preserve compatibility while backend and frontend are deployed separately.
  const details = cases.details_included
    ? (cases.cases as ApiCaseDetail[])
    : await Promise.all(
        cases.cases.map((item) => loadCaseDetails(item.incident_id))
      );
  const networkCases = details.filter(
    (item) => item.incident_type === 'NETWORK_INCIDENT'
  );
  const costCases = details.filter(
    (item) => item.incident_type === 'COST_ANOMALY'
  );
  const changeCases = details.filter(
    (item) => item.incident_type === 'CHANGE_RISK'
  );

  if (!networkCases[0] || !costCases[0] || !changeCases[0]) {
    throw new Error('The API did not return all three Cloud Police case types.');
  }

  return {
    summary: dashboard.summary,
    monitoring: dashboard.monitoring || null,
    networkIncident: mapNetworkCase(networkCases[0]),
    networkIncidents: networkCases.map(mapNetworkCase),
    costAnomaly: mapCostCase(costCases[0]),
    costAnomalies: costCases.map(mapCostCase),
    changeInspector: mapChangeCases(changeCases),
    approvalItems: details.map(mapApprovalItem),
  };
}
