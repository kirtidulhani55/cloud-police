import { ApprovalItem } from '../types';

export const initialApprovalItems: ApprovalItem[] = [
  {
    id: 'APP-REC-AZ-01',
    recommendationTitle: 'Restore Azure SQL Database Ingress Rule (Port 1433)',
    operationType: 'network',
    recommendationType: 'Incident Remediation',
    createdAt: '2026-08-27 10:15 UTC',
    provider: 'Azure',
    riskLevel: 'CRITICAL',
    businessImpact:
      'The production application server is unable to query sqldb-prod-01 on port 1433. Dependent customer services and transactions will fail until database connectivity is re-established.',
    evidenceReviewed:
      'BigQuery firewall packet drop logs (1,420 drops/min), synthetic TCP connection probe failures on port 1433, and Terraform commit #881 audit log showing NSG rule deletion.',
    proposedAction:
      'Draft a pull request restoring the inbound firewall allow rule for port 1433 targeting the SQL database subnet to enable engineering review.',
    validationSteps: [
      'Run synthetic TCP connectivity probe from application server to sqldb-prod-01:1433.',
      'Verify zero packet drop entries in BigQuery firewall_logs over a 5-minute observation window.',
      'Execute application health check endpoint to confirm end-to-end database query response.',
    ],
    rollbackGuidance:
      'If security review requires restricting open port access, configure explicit application subnet CIDR restrictions rather than deleting the rule entirely.',
    status: 'PENDING',
    technicalEvidence: {
      tableName: 'BigQuery.cloud_governance.firewall_logs',
      query:
        'SELECT event_time, source_ip, dest_ip, port, action, reason FROM `cloud_governance.firewall_logs` WHERE port = 1433 AND action = "DENY"',
      dataPoints: '1,420 dropped packets / min across staging gateway',
    },
  },
  {
    id: 'APP-REC-AWS-02',
    recommendationTitle: 'Right-Size Underutilized AWS EC2 Worker Instance (i-09a482b1c)',
    operationType: 'cost',
    recommendationType: 'Cost Optimization',
    createdAt: '2026-08-27 09:32 UTC',
    provider: 'AWS',
    riskLevel: 'HIGH',
    businessImpact:
      'Worker compute instance spend escalated from $55/day to $125/day (+127% surge, creating +$2,100/mo in unbudgeted compute charges) while running at only 4.2% average CPU utilization.',
    evidenceReviewed:
      'BigQuery billing snapshots, AWS CloudWatch 7-day average CPU utilization telemetry (4.2%), and FinOps baseline rate card comparisons.',
    proposedAction:
      'Submit a right-sizing change ticket to revert instance i-09a482b1c from high-compute to standard compute tier for engineering and FinOps review.',
    validationSteps: [
      'Verify asynchronous background worker task queue latency under simulated peak load.',
      'Monitor worker CPU utilization to ensure peak consumption stays comfortably below 60%.',
      'Audit AWS billing dashboard to verify daily compute spend returns to the ~$55/day baseline.',
    ],
    rollbackGuidance:
      'If background batch processing exhibits queue backlog during month-end jobs, dynamically scale instances using an EC2 Auto Scaling policy rather than permanent over-provisioning.',
    status: 'PENDING',
    technicalEvidence: {
      tableName: 'BigQuery.cloud_governance.cost_records',
      query:
        'SELECT resource_id, instance_type, hourly_cost, daily_cost, avg_cpu_pct FROM `cloud_governance.cost_records` WHERE resource_id = "i-09a482b1c"',
      dataPoints: 'Hourly compute charges +127% surge ($125/day vs $55/day baseline)',
    },
  },
  {
    id: 'APP-REC-MC-03',
    recommendationTitle: 'Filter and Segment Multi-Cloud Terraform Change Set (CHG-PLAN-8821)',
    operationType: 'change',
    recommendationType: 'Pre-Flight Change',
    createdAt: '2026-08-27 08:48 UTC',
    provider: 'Multi-Cloud',
    riskLevel: 'HIGH',
    businessImpact:
      'The unsegmented Terraform plan contains 2 high-risk changes (Azure database firewall removal and AWS compute resize) alongside safe GCP metadata tag updates. Applying without separation would cause a production outage and cost surge.',
    evidenceReviewed:
      'Pre-flight IaC execution plan CHG-PLAN-8821, BigQuery blast-radius risk analysis, and multi-cloud resource dependency graph.',
    proposedAction:
      'Split change set CHG-PLAN-8821: Forward the safe GCP cluster metadata label updates for engineering review, and isolate/reject the disruptive Azure firewall deletion and AWS instance tier upgrade.',
    validationSteps: [
      'Re-run pre-flight validation isolated to the GCP workspace to confirm only metadata tags are altered.',
      'Verify production Kubernetes cluster nodes remain unaffected with zero downtime.',
      'Ensure blocked Azure and AWS modifications are isolated from the active deployment pipeline.',
    ],
    rollbackGuidance:
      'Revert the Git branch containing the composite plan and trigger individual micro-change pipelines.',
    status: 'PENDING',
    technicalEvidence: {
      tableName: 'BigQuery.cloud_governance.change_records',
      query:
        'SELECT plan_id, resource_name, change_action, blast_radius_score, safety_status FROM `cloud_governance.change_records` WHERE plan_id = "CHG-PLAN-8821"',
      dataPoints: 'Pre-flight change set: 2 high-risk blast radius operations flagged',
    },
  },
];
