/**
 * Cloud Police - AI-Powered Multi-Cloud Governance Copilot
 * Local Mock Data Repository
 * 
 * Note for Flask Integration:
 * When connecting to your Python Flask backend, these data structures map directly
 * to JSON responses returned by your Flask API endpoints (e.g. GET /api/v1/overview,
 * GET /api/v1/incidents, GET /api/v1/changes, POST /api/v1/approvals).
 */

const CLOUD_POLICE_DATA = {
  overview: {
    activeIncidentsCount: 4,
    highRiskChangesCount: 2,
    monthlyCostAtRisk: 2100, // Monthly cost surge in USD
    totalMonthlyCostAtRisk: 4320,
    awaitingHumanApprovalCount: 3,
    coverage: [
      {
        provider: "Azure",
        code: "azure",
        resourcesMonitored: 188,
        regions: ["eastus", "eastus2", "westeurope"],
        status: "Active Monitoring",
        health: "Incident Detected",
        healthClass: "danger"
      },
      {
        provider: "AWS",
        code: "aws",
        resourcesMonitored: 312,
        regions: ["us-east-1", "us-west-2", "eu-central-1"],
        status: "Active Monitoring",
        health: "Cost Anomaly",
        healthClass: "warning"
      },
      {
        provider: "GCP",
        code: "gcp",
        resourcesMonitored: 146,
        regions: ["us-central1", "europe-west1", "asia-east1"],
        status: "Active Monitoring",
        health: "Healthy / Low Risk Changes",
        healthClass: "healthy"
      }
    ]
  },

  demonstrations: {
    networkIncident: {
      id: "INC-AZ-9402",
      provider: "Azure",
      providerCode: "azure",
      title: "Azure App Server Cannot Reach SQL Database (Port 1433)",
      severity: "CRITICAL",
      affectedResource: "vm-app-prod-eastus2 (10.0.4.15)",
      targetResource: "sql-prod-db01.database.windows.net (10.0.5.10:1433)",
      status: "Awaiting Human Approval",
      approvalStatus: "PENDING", // PENDING, APPROVED, REJECTED
      plainLanguage: {
        whatHappened: "The production Azure application server suddenly lost connectivity to its backend Azure SQL database over port 1433 (TDS protocol).",
        whyItMatters: "The customer checkout API is currently throwing 502 Bad Gateway errors. Over 1,200 active checkout sessions are stalled, with immediate revenue loss risk.",
        rootCause: "A Network Security Group (NSG) update removed the inbound allow rule for port 1433. The default DenyAllInbound rule subsequently blocked all traffic from the application subnet (10.0.4.0/24).",
        evidenceReviewed: "Azure Network Watcher NSG Flow Logs (flow-log-eastus2-01), effective security rules query, and 48 consecutive TCP SYN timeout connection attempts.",
        recommendedSafeNextStep: "Deploy a targeted NSG rule with Priority 110: 'Allow-AppSubnet-SQL-1433' strictly permitting source 10.0.4.0/24 to target 10.0.5.10 on TCP port 1433.",
        humanApprovalRequired: "Security Lead confirmation required prior to committing the Azure Network Security Group configuration patch."
      },
      technicalDetails: {
        incidentId: "INC-AZ-9402",
        nsgId: "/subscriptions/0a81-98ff/resourceGroups/rg-prod-core/providers/Microsoft.Network/networkSecurityGroups/nsg-prod-db-eastus2",
        failingPort: 1433,
        protocol: "TCP",
        failedRuleRemoved: "Rule-Allow-TDS-AppSubnet (Priority 110)",
        effectiveRuleBlocking: "DenyAllInbound (Priority 65500)",
        rawTelemetry: {
          timestamp: "2026-08-25T08:14:22Z",
          event: "SYN_SENT_TIMEOUT",
          source_ip: "10.0.4.15",
          source_vm: "vm-app-prod-eastus2",
          dest_ip: "10.0.5.10",
          dest_fqdn: "sql-prod-db01.database.windows.net",
          dest_port: 1433,
          packets_dropped: 48,
          azure_flow_log_rule: "DefaultRule_DenyAllInbound",
          diagnosis_confidence: 0.994
        }
      }
    },

    costAnomaly: {
      id: "COST-AWS-3180",
      provider: "AWS",
      providerCode: "aws",
      title: "AWS EC2 Daily Cost Surge: $55 → $125 (+127.3%)",
      severity: "HIGH COST SURGE",
      affectedResource: "i-09f83a84bce (prod-analytics-worker-01)",
      region: "us-east-1 (N. Virginia)",
      status: "Awaiting Human Approval",
      approvalStatus: "PENDING",
      plainLanguage: {
        whatHappened: "AWS EC2 daily spending jumped from the historical baseline of $55/day to $125/day (+127.3% daily increase).",
        whyItMatters: "If left running for the billing cycle, this unplanned instance change will create an extra $2,100 in unexpected monthly infrastructure charges.",
        rootCause: "A developer upgraded the worker node from a budget-friendly t3.medium instance ($0.0416/hr) to an unbudgeted c5.9xlarge compute instance ($1.53/hr) without an automated shutdown or reservation.",
        evidenceReviewed: "AWS Cost Explorer telemetry, CloudTrail instance modify event 'ModifyInstanceAttribute' by user 'dev-ops-svc', and CloudWatch CPU utilization averaging only 4.2%.",
        recommendedSafeNextStep: "Downsize the instance back to a right-sized c5.large or t3.xlarge during the next scheduled maintenance window.",
        humanApprovalRequired: "FinOps / Infrastructure Owner approval required to trigger the automated instance resize playbook."
      },
      metrics: {
        previousDailyCost: "$55.00",
        newDailyCost: "$125.00",
        percentageIncrease: "+127.3%",
        monthlyExtraCost: "$2,100.00",
        avgCpuUtilization: "4.2% (Severely Underutilized)"
      },
      technicalDetails: {
        anomalyId: "COST-AWS-3180",
        instanceId: "i-09f83a84bce",
        accountId: "184920491823",
        region: "us-east-1",
        previousInstanceType: "t3.medium (2 vCPU, 4GB RAM)",
        currentInstanceType: "c5.9xlarge (36 vCPU, 72GB RAM)",
        rawTelemetry: {
          timestamp: "2026-08-25T03:00:12Z",
          cloudtrail_event: "ModifyInstanceAttribute",
          actor_arn: "arn:aws:iam::184920491823:user/dev-ops-svc",
          cost_differential_hourly: 1.4884,
          estimated_30day_impact_usd: 2100.00,
          current_cpu_utilization_avg: 4.2,
          cost_agent_recommendation: "DOWNSIZE_TO_T3_XLARGE"
        }
      }
    },

    changeInspector: {
      id: "CHG-PLAN-8821",
      title: "Multi-Cloud Infrastructure Change Assessment",
      totalChanges: 3,
      status: "Awaiting Human Review",
      items: [
        {
          id: "CHG-01",
          cloud: "Azure",
          cloudCode: "azure",
          resource: "nsg-prod-db-eastus2",
          resourceType: "Network Security Group",
          action: "DELETE RULE (Rule-Allow-TDS-AppSubnet)",
          riskLevel: "HIGH",
          riskReason: "Severely breaks database network connectivity for production app services.",
          blastRadius: "High (Affects 4 App Services, 1200+ active connections)",
          approvalStatus: "PENDING",
          technicalDiff: "--- nsg_rules.tf\n+++ nsg_rules.tf\n- resource \"azurerm_network_security_rule\" \"allow_sql\" {\n-   priority = 110\n-   destination_port_range = \"1433\"\n-   access = \"Allow\"\n- }"
        },
        {
          id: "CHG-02",
          cloud: "AWS",
          cloudCode: "aws",
          resource: "i-09f83a84bce (prod-analytics-worker)",
          resourceType: "EC2 Instance",
          action: "RESIZE (t3.medium → c5.9xlarge)",
          riskLevel: "HIGH",
          riskReason: "Causes +127.3% cost surge (+$2,100/mo) with only 4% CPU workload demand.",
          blastRadius: "Medium (Financial overspend & temporary instance reboot)",
          approvalStatus: "PENDING",
          technicalDiff: "--- instances.tf\n+++ instances.tf\n- instance_type = \"t3.medium\"\n+ instance_type = \"c5.9xlarge\" # Unapproved 9x compute tier"
        },
        {
          id: "CHG-03",
          cloud: "GCP",
          cloudCode: "gcp",
          resource: "gke-prod-cluster-1",
          resourceType: "GKE Cluster Metadata",
          action: "UPDATE LABELS (owner: team-alpha, cost-center: ops)",
          riskLevel: "LOW",
          riskReason: "Metadata-only tag enrichment. Zero workload downtime or security disruption.",
          blastRadius: "None (Cluster state and pods remain unaffected)",
          approvalStatus: "PENDING",
          technicalDiff: "--- gke.tf\n+++ gke.tf\n  resource_labels = {\n+   \"cost-center\" = \"engineering-ops\"\n+   \"owner\"       = \"team-alpha\"\n  }"
        }
      ]
    }
  },

  agentWorkflow: {
    rootAgent: {
      name: "Cloud Police Root Agent",
      role: "Central Orchestrator & Multi-Cloud Event Dispatcher",
      status: "Active",
      statusType: "active"
    },
    subAgents: [
      {
        id: "diag-agent",
        name: "Diagnosis Agent",
        role: "Network Flow & Log Diagnostic Engine",
        status: "Completed Analysis",
        statusType: "active",
        avatarClass: "diag-icon",
        lastAction: "Identified NSG port 1433 blockage on Azure VM 10.0.4.15",
        confidence: "99.4%"
      },
      {
        id: "cost-agent",
        name: "Cost Agent",
        role: "FinOps Telemetry & Anomaly Estimator",
        status: "Surge Detected",
        statusType: "active",
        avatarClass: "cost-icon",
        lastAction: "Flagged $55 → $125 daily jump; calculated $2,100/mo surge",
        confidence: "100%"
      },
      {
        id: "change-agent",
        name: "Change Inspector Agent",
        role: "IaC / Terraform Blast Radius Calculator",
        status: "Review Complete",
        statusType: "active",
        avatarClass: "change-icon",
        lastAction: "Evaluated 3 proposed changes (2 High Risk, 1 Low Risk)",
        confidence: "98.7%"
      },
      {
        id: "rem-agent",
        name: "Remediation Agent",
        role: "Dry-Run Safety Planner & Rollback Generator",
        status: "Plan Ready",
        statusType: "active",
        avatarClass: "rem-icon",
        lastAction: "Generated Terraform patch script with strict rollback safety guardrails",
        confidence: "99.0%"
      },
      {
        id: "human-agent",
        name: "Human Approval Gate",
        role: "Mandatory Manual Verification (Safety Principle)",
        status: "Awaiting Operator Decision",
        statusType: "waiting",
        avatarClass: "human-icon",
        lastAction: "3 items awaiting human approval before any cloud execution",
        confidence: "N/A (Human in the loop)"
      }
    ],
    timeline: [
      {
        agent: "Cloud Police Root Agent",
        agentType: "root",
        time: "12 mins ago",
        title: "Ingested Azure Alert & AWS Billing Spike",
        detail: "Dispatched telemetry to <strong>Diagnosis Agent</strong> and <strong>Cost Agent</strong> concurrently."
      },
      {
        agent: "Diagnosis Agent",
        agentType: "diag",
        time: "10 mins ago",
        title: "Azure Port 1433 Root Cause Isolated",
        detail: "Determined that <code>nsg-prod-db-eastus2</code> rule deletion dropped TCP SYN packets from <code>10.0.4.15</code>."
      },
      {
        agent: "Cost Agent",
        agentType: "cost",
        time: "8 mins ago",
        title: "AWS EC2 127.3% Anomaly Verified",
        detail: "Confirmed compute resize on <code>i-09f83a84bce</code> without workload justification. Forecast: <strong>+$2,100/month</strong>."
      },
      {
        agent: "Change Inspector Agent",
        agentType: "change",
        time: "6 mins ago",
        title: "Categorized 3 IaC Changes",
        detail: "Marked Azure NSG and AWS EC2 resize as <strong>HIGH RISK</strong>; marked GCP label update as <strong>LOW RISK</strong>."
      },
      {
        agent: "Remediation Agent",
        agentType: "rem",
        time: "4 mins ago",
        title: "Synthesized Safe Remediation Scripts",
        detail: "Created dry-run rollback plans. Forwarded all proposals to <strong>Human Approval Gate</strong>."
      },
      {
        agent: "Human Approval Gate",
        agentType: "human",
        time: "Just now",
        title: "Standing by for Human Authorization",
        detail: "System strictly locked: Zero cloud infrastructure modifications will occur until verified by an authorized operator."
      }
    ]
  },

  evidenceList: [
    {
      id: "EVID-9402-A",
      type: "Azure NSG Flow Log",
      cloud: "Azure",
      cloudCode: "azure",
      timestamp: "2026-08-25 08:14:22 UTC",
      resource: "vm-app-prod-eastus2",
      summary: "TCP 1433 connection drop by DenyAllInbound rule.",
      details: "Packet trace shows 48 retransmissions from 10.0.4.15:49122 to 10.0.5.10:1433 with immediate RST/DROP response."
    },
    {
      id: "EVID-3180-B",
      type: "AWS CloudTrail Event",
      cloud: "AWS",
      cloudCode: "aws",
      timestamp: "2026-08-25 03:00:12 UTC",
      resource: "i-09f83a84bce",
      summary: "ModifyInstanceAttribute event initiated by dev-ops-svc.",
      details: "Instance configuration attribute modified: instanceType changed from t3.medium to c5.9xlarge."
    },
    {
      id: "EVID-3180-C",
      type: "AWS CloudWatch Metrics",
      cloud: "AWS",
      cloudCode: "aws",
      timestamp: "2026-08-25 08:00:00 UTC",
      resource: "i-09f83a84bce",
      summary: "CPU utilization flatline at 4.2%.",
      details: "36 vCPUs allocated but peak utilization across 6-hour window did not exceed 6.1%."
    },
    {
      id: "EVID-8821-D",
      type: "GCP Audit Log",
      cloud: "GCP",
      cloudCode: "gcp",
      timestamp: "2026-08-25 07:45:10 UTC",
      resource: "gke-prod-cluster-1",
      summary: "SetLabels request from terraform-ci-pipeline.",
      details: "Added metadata labels cost-center=engineering-ops and owner=team-alpha. Safe metadata operation."
    }
  ]
};

// Expose to window for vanilla JS access
window.CLOUD_POLICE_DATA = CLOUD_POLICE_DATA;
