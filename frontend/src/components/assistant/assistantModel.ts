import {
  ChangeInspectorData,
  CostAnomalyData,
  NetworkIncidentData,
  RiskLevel,
} from '../../types';
import {
  approvalStatusDescription,
  approvalStatusLabel,
} from '../../utils/approvalStatus';

export type AssistantCategory = 'incident' | 'cost' | 'change';
export type AssistantDestination =
  | 'incidents'
  | 'cost'
  | 'changes'
  | 'approvals'
  | 'evidence';

export interface AssistantCase {
  id: string;
  category: AssistantCategory;
  provider: string;
  resource: string;
  title: string;
  question: string;
  risk: RiskLevel;
  confidence: string;
  confidenceReason: string;
  status: string;
  lastChecked?: string;
  summary: string;
  cause: string;
  impact: string;
  nextStep: string;
  reviewerStatus: string;
  evidenceSummary: string;
  evidenceIds: string[];
  rawTelemetry: Record<string, unknown>;
  specialist: string;
  destination: AssistantDestination;
  details?: {
    previousDailyCost?: string;
    newDailyCost?: string;
    monthlyExtraCost?: string;
    utilization?: string;
    changeDiff?: string;
  };
}

export interface FollowUpOption {
  id: string;
  label: string;
}

export interface FollowUpAnswer {
  title: string;
  body: string;
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[_/\\-]+/g, ' ')
    .replace(/[^a-z0-9.$%\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const reviewerLanguage = (value: string) =>
  value
    .replace(/human approval/gi, 'reviewer approval')
    .replace(/human review/gi, 'reviewer review')
    .replace(/human authorization/gi, 'reviewer authorization');

export const buildAssistantCases = (
  networkIncidents: NetworkIncidentData[],
  costAnomalies: CostAnomalyData[],
  changeInspector: ChangeInspectorData
): AssistantCase[] => {
  const incidents: AssistantCase[] = networkIncidents.map((incident) => ({
    id: incident.id,
    category: 'incident',
    provider: incident.provider,
    resource: incident.affectedResource || incident.title,
    title: incident.title,
    question: incident.affectedResource
      ? `Why is ${incident.affectedResource} unreachable?`
      : `Investigate ${incident.id}`,
    risk: incident.severity,
    confidence: incident.confidence,
    confidenceReason: incident.confidenceReason,
    status: approvalStatusLabel(incident.status),
    lastChecked: incident.updatedAt,
    summary: incident.plainLanguage.whatHappened || incident.simpleSummary,
    cause: incident.plainLanguage.rootCause,
    impact: incident.plainLanguage.whyItMatters,
    nextStep: incident.plainLanguage.recommendedNextStep,
    reviewerStatus: reviewerLanguage(approvalStatusDescription(incident.status)),
    evidenceSummary: incident.plainLanguage.evidenceReviewed,
    evidenceIds: incident.technicalDetails.evidenceIds,
    rawTelemetry: incident.technicalDetails.rawTelemetry,
    specialist: 'Diagnosis Agent',
    destination: 'incidents',
  }));

  const costs: AssistantCase[] = costAnomalies.map((anomaly) => ({
    id: anomaly.id,
    category: 'cost',
    provider: anomaly.provider,
    resource: anomaly.resourceName || anomaly.title,
    title: anomaly.title,
    question: `Why did ${anomaly.provider} costs increase?`,
    risk: anomaly.severity,
    confidence: anomaly.confidence,
    confidenceReason: anomaly.confidenceReason,
    status: approvalStatusLabel(anomaly.status),
    lastChecked: anomaly.updatedAt,
    summary: anomaly.plainLanguage.whatHappened || anomaly.simpleSummary,
    cause:
      anomaly.plainLanguage.rootCause ||
      'The exact cause is not yet supported by enough evidence.',
    impact: anomaly.plainLanguage.whyItMatters,
    nextStep: anomaly.plainLanguage.recommendedNextStep,
    reviewerStatus: reviewerLanguage(approvalStatusDescription(anomaly.status)),
    evidenceSummary: anomaly.plainLanguage.evidenceReviewed,
    evidenceIds: anomaly.technicalDetails.evidenceIds,
    rawTelemetry: anomaly.technicalDetails.rawTelemetry,
    specialist: 'Cost Agent',
    destination: 'cost',
    details: {
      previousDailyCost: anomaly.metrics.previousDailyCost,
      newDailyCost: anomaly.metrics.newDailyCost,
      monthlyExtraCost: anomaly.metrics.monthlyExtraCost,
      utilization: anomaly.metrics.cpuUtilization,
    },
  }));

  const aggregateLastChecked = changeInspector.changes
    .map((change) => change.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  const aggregateChange: AssistantCase = {
    id: changeInspector.id,
    category: 'change',
    provider: changeInspector.provider,
    resource: changeInspector.technicalDetails.planId,
    title: changeInspector.title,
    question: 'Review all proposed infrastructure changes',
    risk: changeInspector.severity,
    confidence: changeInspector.confidence,
    confidenceReason: changeInspector.confidenceReason,
    status: approvalStatusLabel(changeInspector.status),
    lastChecked: aggregateLastChecked,
    summary:
      changeInspector.plainLanguage.whatHappened || changeInspector.simpleSummary,
    cause:
      changeInspector.plainLanguage.rootCause ||
      'The Terraform plan was inspected before deployment.',
    impact: changeInspector.plainLanguage.whyItMatters,
    nextStep: changeInspector.plainLanguage.recommendedNextStep,
    reviewerStatus: reviewerLanguage(approvalStatusDescription(changeInspector.status)),
    evidenceSummary: changeInspector.plainLanguage.evidenceReviewed,
    evidenceIds: changeInspector.technicalDetails.evidenceIds,
    rawTelemetry: changeInspector.technicalDetails.rawTelemetry,
    specialist: 'Remediation Agent',
    destination: 'changes',
  };

  const changes: AssistantCase[] = changeInspector.changes.map((change) => ({
    id: change.id,
    category: 'change',
    provider: change.cloud,
    resource: change.resource,
    title: `${change.cloud}: ${change.action}`,
    question: `Is ${change.id} safe to approve?`,
    risk: change.riskLevel,
    confidence: changeInspector.confidence,
    confidenceReason: changeInspector.confidenceReason,
    status: approvalStatusLabel(change.status),
    lastChecked: change.updatedAt || aggregateLastChecked,
    summary: change.action,
    cause: change.plainExplanation,
    impact: change.riskSummary,
    nextStep:
      change.riskLevel === 'SAFE' || change.riskLevel === 'LOW'
        ? 'Review the evidence and validation plan before authorizing this change.'
        : 'Do not approve this change until its blast radius, validation steps and rollback plan have been reviewed.',
    reviewerStatus: reviewerLanguage(approvalStatusDescription(change.status)),
    evidenceSummary: changeInspector.plainLanguage.evidenceReviewed,
    evidenceIds:
      change.evidenceIds?.length
        ? change.evidenceIds
        : changeInspector.technicalDetails.evidenceIds,
    rawTelemetry: {
      change_id: change.id,
      provider: change.cloud,
      resource: change.resource,
      action: change.action,
      risk_level: change.riskLevel,
      terraform_diff: change.diffSnippet,
    },
    specialist: 'Remediation Agent',
    destination: 'changes',
    details: { changeDiff: change.diffSnippet },
  }));

  return [...incidents, ...costs, aggregateChange, ...changes];
};

export const findAssistantCase = (
  cases: AssistantCase[],
  question: string
): AssistantCase | null => {
  const query = normalize(question);
  if (!query) return null;

  const referenced = cases.find((item) =>
    [item.id, item.resource]
      .map(normalize)
      .filter((value) => value.length >= 4)
      .some((value) => query.includes(value))
  );
  if (referenced) return referenced;

  const provider = query.includes('azure')
    ? 'Azure'
    : query.includes('aws')
      ? 'AWS'
      : query.includes('gcp') || query.includes('google')
        ? 'GCP'
        : null;

  const category: AssistantCategory | null = [
    'cost',
    'billing',
    'spend',
    'expensive',
    'budget',
  ].some((word) => query.includes(word))
    ? 'cost'
    : ['change', 'terraform', 'approve', 'blast radius', 'rollback'].some(
          (word) => query.includes(word)
        )
      ? 'change'
      : [
            'incident',
            'database',
            'network',
            'firewall',
            'unreachable',
            'connectivity',
            'blocked',
            'port',
            'outage',
          ].some((word) => query.includes(word))
        ? 'incident'
        : null;

  if (!category) return null;

  return (
    cases.find(
      (item) =>
        item.category === category && (!provider || item.provider === provider)
    ) || cases.find((item) => item.category === category) || null
  );
};

const UNIVERSAL_FOLLOW_UPS: FollowUpOption[] = [
  { id: 'evidence', label: 'Show supporting evidence' },
  { id: 'simple', label: 'Explain this simply' },
  { id: 'reviewer', label: 'What should the reviewer verify?' },
];

export const getFollowUps = (category: AssistantCategory): FollowUpOption[] => {
  if (category === 'incident') {
    return [
      UNIVERSAL_FOLLOW_UPS[0],
      { id: 'timeline', label: 'What changed before the failure?' },
      { id: 'affected', label: 'Which services are affected?' },
      UNIVERSAL_FOLLOW_UPS[2],
      UNIVERSAL_FOLLOW_UPS[1],
    ];
  }

  if (category === 'cost') {
    return [
      { id: 'breakdown', label: 'Show the cost breakdown' },
      { id: 'baseline', label: 'Compare baseline with current cost' },
      { id: 'cause', label: 'What caused the increase?' },
      { id: 'reduce', label: 'What could reduce the cost?' },
      UNIVERSAL_FOLLOW_UPS[2],
      UNIVERSAL_FOLLOW_UPS[0],
    ];
  }

  return [
    { id: 'blast', label: 'Show the blast radius' },
    { id: 'policy', label: 'Which policy was triggered?' },
    { id: 'outcome', label: 'What happens if this is approved?' },
    { id: 'validation', label: 'Show validation steps' },
    { id: 'rollback', label: 'Show the rollback plan' },
    UNIVERSAL_FOLLOW_UPS[0],
  ];
};

export const matchFollowUp = (
  assistantCase: AssistantCase,
  question: string
): FollowUpOption | null => {
  const query = normalize(question);
  const matches: Record<string, string[]> = {
    evidence: ['evidence', 'source', 'proof', 'telemetry'],
    simple: ['simple', 'plain', 'easy words'],
    reviewer: ['reviewer', 'verify', 'check before'],
    timeline: ['changed before', 'before failure', 'timeline'],
    affected: ['affected', 'services', 'impact scope'],
    breakdown: ['breakdown', 'monthly impact'],
    baseline: ['baseline', 'compare'],
    cause: ['cause', 'why increase'],
    reduce: ['reduce', 'save', 'right size'],
    blast: ['blast radius', 'scope'],
    policy: ['policy', 'guardrail'],
    outcome: ['what happens', 'if approved', 'outcome'],
    validation: ['validation', 'test'],
    rollback: ['rollback', 'reverse'],
  };

  return (
    getFollowUps(assistantCase.category).find((option) =>
      matches[option.id]?.some((term) => query.includes(term))
    ) || null
  );
};

export const answerFollowUp = (
  assistantCase: AssistantCase,
  followUpId: string
): FollowUpAnswer => {
  const evidenceReferences = assistantCase.evidenceIds.length
    ? assistantCase.evidenceIds.join(', ')
    : 'No evidence references were returned.';

  switch (followUpId) {
    case 'evidence':
      return {
        title: 'Supporting evidence',
        body: `${assistantCase.evidenceSummary} Evidence references: ${evidenceReferences}.`,
      };
    case 'simple':
      return { title: 'Simple explanation', body: assistantCase.summary };
    case 'reviewer':
      return {
        title: 'Reviewer checklist',
        body: `Confirm the evidence is current, validate the affected resource and blast radius, review the proposed action, and verify that a tested rollback path exists. Recommended next step: ${assistantCase.nextStep}`,
      };
    case 'timeline':
      return {
        title: 'Change before the failure',
        body: `${assistantCase.cause} The latest saved evidence was checked ${formatCheckedTime(assistantCase.lastChecked).toLowerCase()}.`,
      };
    case 'affected':
      return { title: 'Affected services', body: assistantCase.impact };
    case 'breakdown':
      return {
        title: 'Cost breakdown',
        body: `Previous daily cost: ${assistantCase.details?.previousDailyCost || 'not available'}. Current daily cost: ${assistantCase.details?.newDailyCost || 'not available'}. Estimated monthly increase: ${assistantCase.details?.monthlyExtraCost || 'not available'}.`,
      };
    case 'baseline':
      return {
        title: 'Baseline comparison',
        body: `The daily baseline was ${assistantCase.details?.previousDailyCost || 'not available'}, compared with ${assistantCase.details?.newDailyCost || 'not available'} now. Recorded utilization is ${assistantCase.details?.utilization || 'not available'}.`,
      };
    case 'cause':
      return { title: 'Likely cost driver', body: assistantCase.cause };
    case 'reduce':
      return { title: 'Cost reduction option', body: assistantCase.nextStep };
    case 'blast':
      return { title: 'Blast radius', body: assistantCase.impact };
    case 'policy':
      return {
        title: 'Triggered governance policy',
        body: `The ${assistantCase.risk} risk classification requires reviewer approval before any infrastructure action. The evidence must be verified before a decision is recorded.`,
      };
    case 'outcome':
      return {
        title: 'Expected outcome',
        body: `${assistantCase.impact} Approval records a planning decision only; Cloud Police does not apply the infrastructure change.`,
      };
    case 'validation':
      return {
        title: 'Validation steps',
        body: `Review the exact Terraform diff, validate dependencies in a non-production environment, confirm monitoring signals, and document the expected result before approval. ${assistantCase.nextStep}`,
      };
    case 'rollback':
      return {
        title: 'Rollback plan',
        body: 'Preserve the currently approved configuration, prepare a reviewed Terraform reversal, define success and failure signals, and assign an authorized operator before the change window.',
      };
    default:
      return { title: 'Investigation detail', body: assistantCase.summary };
  }
};

export const formatCheckedTime = (value?: string) => {
  if (!value) return 'Time not provided';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const elapsedMinutes = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 60_000)
  );
  if (elapsedMinutes < 1) return 'Checked just now';
  if (elapsedMinutes < 60) return `Checked ${elapsedMinutes} min ago`;

  return `Checked ${date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })}`;
};
