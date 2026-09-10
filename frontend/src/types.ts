export type Provider = 'Azure' | 'AWS' | 'GCP' | 'Multi-Cloud';

export type ThemeMode = 'light' | 'dark';

export type ApprovalStatus = 'PENDING' | 'EVIDENCE_REQUESTED' | 'APPROVED' | 'REJECTED' | 'MIXED' | 'UNKNOWN';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

export type ApprovalDecisionType =
  | 'PENDING'
  | 'APPROVED_FOR_PLANNING'
  | 'REJECTED'
  | 'MORE_EVIDENCE_REQUESTED';

export interface ApprovalItem {
  id: string;
  recommendationTitle: string;
  operationType: 'network' | 'cost' | 'change';
  recommendationType?: string;
  confidenceScore?: string;
  blastRadius?: string;
  evidenceQuery?: string;
  createdAt?: string;
  provider: Provider;
  riskLevel: RiskLevel;
  businessImpact: string;
  evidenceReviewed: string;
  proposedAction: string;
  validationSteps: string[];
  rollbackGuidance: string;
  status: ApprovalDecisionType;
  technicalEvidence?: {
    tableName: string;
    query: string;
    dataPoints?: string;
  };
  reviewer?: string;
  decisionTimestamp?: string;
  rejectionReason?: string;
  requestedEvidenceNote?: string;
}

export interface ApprovalHistoryRecord {
  id: string;
  approvalItemId: string;
  recommendationTitle: string;
  recommendationType?: string;
  provider: Provider;
  riskLevel: RiskLevel;
  decision: 'APPROVED' | 'REJECTED' | 'EVIDENCE_REQUESTED' | 'REOPENED';
  statusLabel: string;
  reviewer: string;
  timestamp: string;
  notes?: string;
  decisionReason?: string;
  evidenceReviewed?: string;
  finalStatus?: string;
  safetyNotice: string;
  operationType?: 'network' | 'cost' | 'change';
  technicalEvidence?: {
    tableName: string;
    query: string;
    dataPoints?: string;
  };
}

export interface NetworkIncidentData {
  operationalStatus?: string;
  id: string;
  provider: Provider;
  title: string;
  simpleSummary: string;
  severity: RiskLevel;
  status: ApprovalStatus;
  confidence: string;
  confidenceReason: string;
  sourceResource?: string;
  affectedResource?: string;
  affectedPort?: number;
  blockingComponent?: string;
  updatedAt?: string;
  plainLanguage: {
    whatHappened: string;
    whyItMatters: string;
    rootCause: string;
    evidenceReviewed: string;
    recommendedNextStep: string;
    humanApprovalStatus: string;
  };
  technicalDetails: {
    incidentId: string;
    evidenceIds: string[];
    rawTelemetry: Record<string, unknown>;
  };
}

export interface CostAnomalyData {
  operationalStatus?: string;
  id: string;
  provider: Provider;
  title: string;
  simpleSummary: string;
  severity: RiskLevel;
  status: ApprovalStatus;
  confidence: string;
  confidenceReason: string;
  resourceName?: string;
  service?: string;
  updatedAt?: string;
  metrics: {
    previousDailyCost: string;
    newDailyCost: string;
    percentageIncrease: string;
    monthlyExtraCost: string;
    cpuUtilization: string;
  };
  plainLanguage: {
    whatHappened: string;
    whyItMatters: string;
    rootCause?: string;
    evidenceReviewed: string;
    recommendedNextStep: string;
    humanApprovalStatus: string;
  };
  technicalDetails: {
    anomalyId: string;
    evidenceIds: string[];
    rawTelemetry: Record<string, unknown>;
  };
}

export interface ProposedChangeItem {
  id: string;
  cloud: 'Azure' | 'AWS' | 'GCP';
  resource: string;
  action: string;
  status: ApprovalStatus;
  riskLevel: RiskLevel;
  riskSummary: string;
  plainExplanation: string;
  diffSnippet: string;
  evidenceIds?: string[];
  updatedAt?: string;
}

export interface ChangeInspectorData {
  id: string;
  provider: 'Multi-Cloud';
  title: string;
  simpleSummary: string;
  severity: RiskLevel;
  status: ApprovalStatus;
  confidence: string;
  confidenceReason: string;
  changes: ProposedChangeItem[];
  plainLanguage: {
    whatHappened: string;
    whyItMatters: string;
    rootCause?: string;
    evidenceReviewed: string;
    recommendedNextStep: string;
    humanApprovalStatus: string;
  };
  technicalDetails: {
    planId: string;
    evidenceIds: string[];
    rawTelemetry: Record<string, unknown>;
  };
}

export type DemonstrationType = 'network' | 'cost' | 'change';
export type OperationType = DemonstrationType;

export type SearchCategoryFilter = 'ALL' | 'INCIDENT' | 'RESOURCE' | 'POLICY';

export type SidebarNavId =
  | 'home'
  | 'overview'
  | 'approvals'
  | 'history_evidence'
  | 'incidents'
  | 'cost'
  | 'changes'
  | 'evidence'
  | 'admin_users'
  | 'profile'
  | 'preferences'
  | 'security';
