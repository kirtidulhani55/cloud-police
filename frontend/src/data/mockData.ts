import {
  NetworkIncidentData,
  CostAnomalyData,
  ChangeInspectorData,
} from '../types';

export const initialNetworkIncident: NetworkIncidentData = {
  id: 'INC-AZ-9402',
  provider: 'Azure',
  title: 'Azure Application Cannot Reach Database',
  simpleSummary:
    'A firewall rule was removed, blocking the application from reaching its database on port 1433.',
  severity: 'CRITICAL',
  status: 'PENDING',
  confidence: '99.4%',
  confidenceReason: 'Matched firewall log drops and Terraform change records in BigQuery.',
  plainLanguage: {
    whatHappened:
      'The production application server lost network connectivity to its SQL database on port 1433.',
    whyItMatters:
      'The production application cannot connect to its SQL database on port 1433. This may interrupt services that depend on the database.',
    rootCause:
      'A recent Terraform change removed the firewall allow rule. The connection is now blocked by the default deny rule.',
    evidenceReviewed:
      'Firewall logs, connectivity test results and Terraform change records stored in BigQuery.',
    recommendedNextStep:
      'Recover the previously approved firewall-rule configuration from version control. An engineer must review the Terraform plan and security impact before any change is applied.',
    humanApprovalStatus:
      'Awaiting engineer review. Cloud Police will not apply any infrastructure changes without human review.',
  },
  technicalDetails: {
    incidentId: 'INC-AZ-9402',
    evidenceIds: [
      'BQ_FIREWALL_LOG_EVENT_9402',
      'BQ_CONNECTIVITY_TEST_PROBE_1433',
      'BQ_TERRAFORM_CHANGE_RECORD_881',
    ],
    rawTelemetry: {
      incident_id: 'INC-AZ-9402',
      telemetry_source: 'BigQuery.cloud_governance_telemetry',
      event_type: 'CONNECTIVITY_BLOCKED',
      port: 1433,
      root_cause: 'FIREWALL_ALLOW_RULE_REMOVED',
      effective_rule: 'DEFAULT_DENY_RULE',
      evidence_references: [
        'BQ_FIREWALL_LOG_EVENT_9402',
        'BQ_CONNECTIVITY_TEST_PROBE_1433',
        'BQ_TERRAFORM_CHANGE_RECORD_881',
      ],
      ai_confidence_score: 0.994,
    },
  },
};

export const initialCostAnomaly: CostAnomalyData = {
  id: 'COST-AWS-3180',
  provider: 'AWS',
  title: 'AWS EC2 Cost Increased',
  simpleSummary:
    'Daily cost increased from $55 to $125, creating an estimated extra monthly cost of $2,100.',
  severity: 'HIGH',
  status: 'PENDING',
  confidence: '100%',
  confidenceReason: 'Calculated directly from cost records and billing changes stored in BigQuery.',
  metrics: {
    previousDailyCost: '$55 / day',
    newDailyCost: '$125 / day',
    percentageIncrease: '+127.3%',
    monthlyExtraCost: '$2,100 / month',
    cpuUtilization: '4.2% average (underutilized)',
  },
  plainLanguage: {
    whatHappened:
      'An EC2 worker instance daily cost increased from $55 to $125 after an instance modification.',
    whyItMatters:
      'The compute instance is generating an estimated extra monthly cost of $2,100 while running underutilized.',
    rootCause:
      'The instance tier was increased without workload demand or scheduled shutdown.',
    evidenceReviewed:
      'Cost records and instance utilization telemetry stored in BigQuery.',
    recommendedNextStep:
      'Submit right-sizing remediation proposal for engineer and FinOps review before scheduling an instance change.',
    humanApprovalStatus:
      'Awaiting engineer review. Cloud Police will not resize instances without human review.',
  },
  technicalDetails: {
    anomalyId: 'COST-AWS-3180',
    evidenceIds: [
      'BQ_BILLING_RECORD_AWS_3180',
      'BQ_INSTANCE_UTILIZATION_METRIC_3180',
    ],
    rawTelemetry: {
      anomaly_id: 'COST-AWS-3180',
      telemetry_source: 'BigQuery.cloud_governance_telemetry',
      previous_daily_cost: 55.0,
      current_daily_cost: 125.0,
      forecast_monthly_extra_cost: 2100.0,
      evidence_references: [
        'BQ_BILLING_RECORD_AWS_3180',
        'BQ_INSTANCE_UTILIZATION_METRIC_3180',
      ],
      ai_confidence_score: 1.0,
    },
  },
};

export const initialChangeInspector: ChangeInspectorData = {
  id: 'CHG-PLAN-8821',
  provider: 'Multi-Cloud',
  title: 'Review Proposed Cloud Change',
  simpleSummary:
    'Cloud Police checks a proposed change for availability, security and cost risks before deployment.',
  severity: 'HIGH',
  status: 'PENDING',
  confidence: '98.7%',
  confidenceReason: 'Pre-flight infrastructure analysis across proposed cloud change records in BigQuery.',
  changes: [
    {
      id: 'CHG-01',
      cloud: 'Azure',
      resource: 'firewall-allow-rule',
      action: 'Delete firewall allow rule (Port 1433)',
      status: 'PENDING',
      riskLevel: 'CRITICAL',
      riskSummary: 'High Availability Risk',
      plainExplanation:
        'Deletes the port 1433 database access rule, which will immediately block connectivity for the application.',
      diffSnippet: `- resource "firewall_rule" "allow_sql" {
-   port = "1433"
-   access = "Allow"
- }`,
    },
    {
      id: 'CHG-02',
      cloud: 'AWS',
      resource: 'worker-instance',
      action: 'Resize instance to high-tier compute',
      status: 'PENDING',
      riskLevel: 'HIGH',
      riskSummary: 'High Cost Surge Risk',
      plainExplanation:
        'Increases daily compute cost by +127% (+$2,100/mo) for a background task.',
      diffSnippet: `- instance_tier = "standard"
+ instance_tier = "high-compute"`,
    },
    {
      id: 'CHG-03',
      cloud: 'GCP',
      resource: 'cluster-metadata',
      action: 'Update metadata tags',
      status: 'PENDING',
      riskLevel: 'SAFE',
      riskSummary: 'Safe Metadata Update',
      plainExplanation:
        'Updates team ownership and cost center tags with zero operational risk.',
      diffSnippet: `  labels = {
+   "owner" = "engineering-ops"
  }`,
    },
  ],
  plainLanguage: {
    whatHappened:
      'A multi-cloud Terraform change proposal contains 3 modifications across Azure, AWS, and GCP.',
    whyItMatters:
      'Applying without inspection would cause an application outage on Azure and an unbudgeted cost increase on AWS.',
    rootCause:
      'Proposed change set includes a firewall deletion and an unbudgeted instance resize alongside safe metadata updates.',
    evidenceReviewed:
      'Change records and configuration plans stored in BigQuery.',
    recommendedNextStep:
      'Submit change findings for engineer review to selectively reject high-risk changes and approve safe metadata changes.',
    humanApprovalStatus:
      'Awaiting engineer review. Cloud Changes will remain blocked until authorized.',
  },
  technicalDetails: {
    planId: 'CHG-PLAN-8821',
    evidenceIds: [
      'BQ_TERRAFORM_PLAN_8821',
      'BQ_MULTI_CLOUD_CHANGE_SET_8821',
    ],
    rawTelemetry: {
      plan_id: 'CHG-PLAN-8821',
      telemetry_source: 'BigQuery.cloud_governance_telemetry',
      scanned_changes_count: 3,
      critical_risks: 1,
      cost_warnings: 1,
      safe_changes: 1,
      evidence_references: [
        'BQ_TERRAFORM_PLAN_8821',
        'BQ_MULTI_CLOUD_CHANGE_SET_8821',
      ],
      ai_confidence_score: 0.987,
    },
  },
};
