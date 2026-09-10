/**
 * Cloud Police - AI-Powered Multi-Cloud Governance Copilot
 * Frontend Dashboard Application Logic (Vanilla JavaScript)
 * 
 * Ready for direct inclusion in Python Flask projects:
 * Rendered via templates/index.html with static assets in /static/js and /static/css.
 */

// Application State Management
const AppState = {
  activeTab: 'overview',
  cloudFilter: 'all', // 'all', 'azure', 'aws', 'gcp'
  searchQuery: '',
  presentationMode: false,
  approvals: {
    'INC-AZ-9402': 'PENDING', // PENDING, APPROVED, REJECTED
    'COST-AWS-3180': 'PENDING',
    'CHG-01': 'PENDING',
    'CHG-02': 'PENDING',
    'CHG-03': 'PENDING'
  },
  auditLogs: [
    {
      id: "LOG-01",
      timestamp: new Date().toLocaleTimeString(),
      action: "System Initialized",
      details: "Loaded multi-cloud telemetry for GCP, AWS, and Azure. 3 items queued for human review.",
      status: "INFO"
    }
  ]
};

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  renderMultiCloudCoverage();
  renderMetrics();
  renderDemonstrationCards();
  renderWorkflowTimeline();
  initModals();
  initPresentationMode();
  updateApprovalCounts();
});

/* ==========================================================================
   Navigation & Tab Routing
   ========================================================================== */
function initNavigation() {
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTab = btn.getAttribute('data-tab');
      if (targetTab) {
        switchTab(targetTab);
      }
    });
  });
}

function switchTab(tabId) {
  AppState.activeTab = tabId;
  
  // Update nav buttons
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Render view content based on tab
  const mainContent = document.getElementById('main-tab-content');
  if (!mainContent) return;

  switch (tabId) {
    case 'overview':
      renderOverviewView();
      break;
    case 'network-incidents':
      renderNetworkIncidentsView();
      break;
    case 'cost-anomalies':
      renderCostAnomaliesView();
      break;
    case 'change-inspector':
      renderChangeInspectorView();
      break;
    case 'human-approvals':
      renderHumanApprovalsView();
      break;
    case 'evidence':
      renderEvidenceView();
      break;
    default:
      renderOverviewView();
  }

  // Scroll to top of main view smoothly
  window.scrollTo({ top: 180, behavior: 'smooth' });
}

/* ==========================================================================
   Metrics & Overview Renderers
   ========================================================================== */
function renderMultiCloudCoverage() {
  const container = document.getElementById('cloud-coverage-strip');
  if (!container) return;

  const { coverage } = window.CLOUD_POLICE_DATA.overview;
  container.innerHTML = coverage.map(c => `
    <div class="cloud-chip" id="cloud-chip-${c.code}">
      <div class="cloud-chip-left">
        <div class="cloud-icon-box cloud-icon-${c.code}">
          ${c.provider.toUpperCase().slice(0, 3)}
        </div>
        <div class="cloud-chip-info">
          <h4>${c.provider}</h4>
          <p>${c.resourcesMonitored} Resources • ${c.regions.length} Regions</p>
        </div>
      </div>
      <span class="cloud-chip-status active">
        <span class="pulse-dot"></span> ${c.status}
      </span>
    </div>
  `).join('');
}

function renderMetrics() {
  const container = document.getElementById('metrics-grid');
  if (!container) return;

  const data = window.CLOUD_POLICE_DATA.overview;
  const pendingCount = getPendingApprovalsCount();

  container.innerHTML = `
    <!-- Metric 1: Active Incidents -->
    <div class="metric-card red" id="metric-active-incidents" onclick="switchTab('network-incidents')" style="cursor: pointer;">
      <div class="metric-header">
        <span class="metric-title">Total Active Incidents</span>
        <div class="metric-icon">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
      </div>
      <div class="metric-value">${data.activeIncidentsCount}</div>
      <div class="metric-subtitle">
        <span class="highlight-red">1 Critical</span> • Azure Database Unreachable
      </div>
    </div>

    <!-- Metric 2: High Risk Changes -->
    <div class="metric-card amber" id="metric-high-risk" onclick="switchTab('change-inspector')" style="cursor: pointer;">
      <div class="metric-header">
        <span class="metric-title">High-Risk Changes</span>
        <div class="metric-icon">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
      </div>
      <div class="metric-value">${data.highRiskChangesCount}</div>
      <div class="metric-subtitle">
        <span class="highlight-amber">2 High</span> • 1 Low (GCP metadata)
      </div>
    </div>

    <!-- Metric 3: Monthly Cost at Risk -->
    <div class="metric-card blue" id="metric-cost-risk" onclick="switchTab('cost-anomalies')" style="cursor: pointer;">
      <div class="metric-header">
        <span class="metric-title">Monthly Cost at Risk</span>
        <div class="metric-icon">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
      </div>
      <div class="metric-value">$${data.monthlyCostAtRisk.toLocaleString()}</div>
      <div class="metric-subtitle">
        <span class="highlight-amber">+127.3% daily surge</span> on AWS EC2
      </div>
    </div>

    <!-- Metric 4: Human Approvals Required -->
    <div class="metric-card green" id="metric-human-approvals" onclick="switchTab('human-approvals')" style="cursor: pointer;">
      <div class="metric-header">
        <span class="metric-title">Awaiting Human Approval</span>
        <div class="metric-icon">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
        </div>
      </div>
      <div class="metric-value" id="metrics-pending-count">${pendingCount}</div>
      <div class="metric-subtitle">
        <span class="highlight-green">Mandatory safety gate</span> Active
      </div>
    </div>
  `;
}

function getPendingApprovalsCount() {
  return Object.values(AppState.approvals).filter(status => status === 'PENDING').length;
}

function updateApprovalCounts() {
  const count = getPendingApprovalsCount();
  const badges = document.querySelectorAll('.human-approval-count-badge');
  badges.forEach(b => {
    b.textContent = `${count} Pending`;
    if (count === 0) {
      b.className = 'nav-badge blue human-approval-count-badge';
      b.textContent = 'All Reviewed';
    }
  });

  const metricValue = document.getElementById('metrics-pending-count');
  if (metricValue) {
    metricValue.textContent = count;
  }
}

/* ==========================================================================
   Demonstration Cards Renderer (Overview View)
   ========================================================================== */
function renderDemonstrationCards() {
  renderOverviewView();
}

function renderOverviewView() {
  const container = document.getElementById('main-tab-content');
  if (!container) return;

  const { networkIncident, costAnomaly, changeInspector } = window.CLOUD_POLICE_DATA.demonstrations;

  container.innerHTML = `
    <!-- Top Presentation Helper Banner -->
    <div class="presentation-callout">
      <div class="presentation-callout-text">
        <strong>Demo Command Center Active:</strong> 3 primary demonstration scenarios loaded. Plain language explanations are shown first, with raw JSON safely stored inside collapsed Technical Details.
      </div>
      <button class="btn btn-outline" onclick="triggerLiveWorkflowSimulation()" style="font-size: 0.78rem; padding: 4px 10px;">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Simulate Agent Run
      </button>
    </div>

    <div class="cards-showcase">
      <!-- CARD 1: Network Incident -->
      ${renderNetworkCardHTML(networkIncident)}

      <!-- CARD 2: Cost Anomaly -->
      ${renderCostCardHTML(costAnomaly)}

      <!-- CARD 3: Change Inspector -->
      ${renderChangeCardHTML(changeInspector)}
    </div>

    <!-- Agent Workflow Section -->
    ${renderAgentWorkflowSectionHTML()}

    <!-- Flask Server Integration Helper Note -->
    <div class="flask-banner" id="flask-integration-banner">
      <div class="flask-info">
        <h4>
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Python Flask Architecture Ready
        </h4>
        <p>This frontend is 100% modular HTML/CSS/JS. To serve inside your existing Flask server, render <code>templates/index.html</code> and route mock actions to your Flask API routes.</p>
      </div>
      <button class="btn btn-outline" onclick="openFlaskCodeModal()" style="font-size: 0.8rem;">
        View Flask Integration Snippet
      </button>
    </div>
  `;
}

/* Card 1 HTML Builder */
function renderNetworkCardHTML(incident) {
  const currentStatus = AppState.approvals[incident.id] || 'PENDING';
  let badgeStatusClass = 'critical';
  let badgeText = 'CRITICAL • Awaiting Human Approval';

  if (currentStatus === 'APPROVED') {
    badgeStatusClass = 'success';
    badgeText = 'APPROVED BY HUMAN (Remediation Ready)';
  } else if (currentStatus === 'REJECTED') {
    badgeStatusClass = 'warning';
    badgeText = 'REJECTED (Remediation Blocked)';
  }

  return `
    <div class="showcase-card" id="card-network-incident">
      <div class="card-top-bar">
        <div class="card-identity">
          <div class="card-num-badge">01</div>
          <div class="card-title-group">
            <h3>
              <span>Network Incident:</span> ${incident.title}
              <span class="cloud-provider-tag ${incident.providerCode}">${incident.provider}</span>
            </h3>
          </div>
        </div>
        <span class="status-badge ${badgeStatusClass}" id="badge-${incident.id}">
          ${badgeText}
        </span>
      </div>

      <div class="card-content">
        <!-- Plain Language Facts Grid -->
        <div class="plain-facts-grid">
          <div class="fact-box danger-highlight">
            <div class="fact-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              What Happened
            </div>
            <div class="fact-body">
              ${incident.plainLanguage.whatHappened}
            </div>
          </div>

          <div class="fact-box danger-highlight">
            <div class="fact-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              Why It Matters
            </div>
            <div class="fact-body">
              ${incident.plainLanguage.whyItMatters}
            </div>
          </div>

          <div class="fact-box highlight">
            <div class="fact-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Root Cause
            </div>
            <div class="fact-body">
              ${incident.plainLanguage.rootCause}
            </div>
          </div>

          <div class="fact-box highlight">
            <div class="fact-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
              Evidence Reviewed
            </div>
            <div class="fact-body">
              ${incident.plainLanguage.evidenceReviewed}
            </div>
          </div>

          <div class="fact-box success-highlight">
            <div class="fact-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              Recommended Safe Next Step
            </div>
            <div class="fact-body">
              ${incident.plainLanguage.recommendedSafeNextStep}
            </div>
          </div>

          <div class="fact-box warning-highlight">
            <div class="fact-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Human Approval Required
            </div>
            <div class="fact-body">
              ${incident.plainLanguage.humanApprovalRequired}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="card-actions-bar">
          <div class="action-btn-group">
            <button class="btn btn-investigate" id="btn-investigate-network" onclick="openNetworkInvestigateModal('${incident.id}')">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Investigate Network Incident
            </button>
            <button class="btn btn-outline" id="btn-review-remediation-network" onclick="openRemediationModal('${incident.id}')">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Review Remediation
            </button>
          </div>

          <div class="action-btn-group" id="actions-${incident.id}">
            ${currentStatus === 'PENDING' ? `
              <button class="btn btn-approve" id="btn-approve-${incident.id}" onclick="handleApprovalAction('${incident.id}', 'APPROVE')">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                Approve
              </button>
              <button class="btn btn-reject" id="btn-reject-${incident.id}" onclick="handleApprovalAction('${incident.id}', 'REJECT')">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Reject
              </button>
            ` : `
              <button class="btn btn-outline" onclick="handleApprovalAction('${incident.id}', 'RESET')" style="font-size: 0.78rem;">
                Reset Decision
              </button>
            `}
          </div>
        </div>

        <!-- Collapsible Technical Details -->
        <div class="tech-details-collapse">
          <div class="tech-details-summary" onclick="toggleTechDetails('tech-net-details')">
            <div class="tech-summary-left">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              <span>Technical Details & Evidence IDs</span>
            </div>
            <span>ID: ${incident.technicalDetails.incidentId} (Click to Expand)</span>
          </div>
          <div class="tech-details-content" id="tech-net-details" style="display: none;">
            <div class="tech-meta-grid">
              <div class="tech-meta-item">
                <div class="key">Target Port & Protocol</div>
                <div class="val">${incident.technicalDetails.protocol} / Port ${incident.technicalDetails.failingPort}</div>
              </div>
              <div class="tech-meta-item">
                <div class="key">Effective Blocking Rule</div>
                <div class="val">${incident.technicalDetails.effectiveRuleBlocking}</div>
              </div>
              <div class="tech-meta-item">
                <div class="key">NSG Resource Identifier</div>
                <div class="val">${incident.technicalDetails.nsgId}</div>
              </div>
            </div>

            <div class="json-box-wrapper">
              <div class="json-box-header">
                <span>Raw Azure Flow Log Telemetry (JSON)</span>
                <button class="copy-json-btn" onclick="copyRawJSON('${incident.id}')">Copy JSON</button>
              </div>
              <pre class="json-code-view" id="json-${incident.id}">${JSON.stringify(incident.technicalDetails.rawTelemetry, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* Card 2 HTML Builder */
function renderCostCardHTML(cost) {
  const currentStatus = AppState.approvals[cost.id] || 'PENDING';
  let badgeStatusClass = 'warning';
  let badgeText = 'ANOMALY • Awaiting FinOps Review';

  if (currentStatus === 'APPROVED') {
    badgeStatusClass = 'success';
    badgeText = 'APPROVED (Downsize Scheduled)';
  } else if (currentStatus === 'REJECTED') {
    badgeStatusClass = 'warning';
    badgeText = 'REJECTED (Instance Kept As-Is)';
  }

  return `
    <div class="showcase-card" id="card-cost-anomaly">
      <div class="card-top-bar">
        <div class="card-identity">
          <div class="card-num-badge">02</div>
          <div class="card-title-group">
            <h3>
              <span>Cost Anomaly:</span> ${cost.title}
              <span class="cloud-provider-tag ${cost.providerCode}">${cost.provider}</span>
            </h3>
          </div>
        </div>
        <span class="status-badge ${badgeStatusClass}" id="badge-${cost.id}">
          ${badgeText}
        </span>
      </div>

      <div class="card-content">
        <!-- Cost Surge Banner with exact numbers requested -->
        <div class="cost-impact-banner">
          <div class="cost-figures">
            <div class="cost-item">
              <span class="label">Previous Daily Cost</span>
              <span class="value">${cost.metrics.previousDailyCost}</span>
            </div>
            <div class="cost-item">
              <span class="label">Current Daily Cost</span>
              <span class="value surge">${cost.metrics.newDailyCost}</span>
            </div>
            <div class="cost-item">
              <span class="label">Rate of Increase</span>
              <span class="value jump">${cost.metrics.percentageIncrease}</span>
            </div>
            <div class="cost-item">
              <span class="label">Estimated Monthly Extra</span>
              <span class="value surge">${cost.metrics.monthlyExtraCost}</span>
            </div>
          </div>
          <div class="cost-badge-large">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
            +127.3% Surge (+$2,100/mo Extra)
          </div>
        </div>

        <!-- Plain Facts Grid -->
        <div class="plain-facts-grid">
          <div class="fact-box warning-highlight">
            <div class="fact-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              What Happened
            </div>
            <div class="fact-body">
              ${cost.plainLanguage.whatHappened}
            </div>
          </div>

          <div class="fact-box danger-highlight">
            <div class="fact-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              Why It Matters
            </div>
            <div class="fact-body">
              ${cost.plainLanguage.whyItMatters}
            </div>
          </div>

          <div class="fact-box highlight">
            <div class="fact-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Root Cause
            </div>
            <div class="fact-body">
              ${cost.plainLanguage.rootCause}
            </div>
          </div>

          <div class="fact-box highlight">
            <div class="fact-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
              Evidence Reviewed
            </div>
            <div class="fact-body">
              ${cost.plainLanguage.evidenceReviewed}
            </div>
          </div>

          <div class="fact-box success-highlight">
            <div class="fact-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              Recommended Safe Next Step
            </div>
            <div class="fact-body">
              ${cost.plainLanguage.recommendedSafeNextStep}
            </div>
          </div>

          <div class="fact-box warning-highlight">
            <div class="fact-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Human Approval Required
            </div>
            <div class="fact-body">
              ${cost.plainLanguage.humanApprovalRequired}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="card-actions-bar">
          <div class="action-btn-group">
            <button class="btn btn-cost" id="btn-analyze-cost" onclick="openCostAnalysisModal('${cost.id}')">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              Analyze Cost Anomaly
            </button>
            <button class="btn btn-outline" onclick="openRemediationModal('${cost.id}')">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Review Remediation
            </button>
          </div>

          <div class="action-btn-group" id="actions-${cost.id}">
            ${currentStatus === 'PENDING' ? `
              <button class="btn btn-approve" id="btn-approve-${cost.id}" onclick="handleApprovalAction('${cost.id}', 'APPROVE')">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                Approve
              </button>
              <button class="btn btn-reject" id="btn-reject-${cost.id}" onclick="handleApprovalAction('${cost.id}', 'REJECT')">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Reject
              </button>
            ` : `
              <button class="btn btn-outline" onclick="handleApprovalAction('${cost.id}', 'RESET')" style="font-size: 0.78rem;">
                Reset Decision
              </button>
            `}
          </div>
        </div>

        <!-- Collapsible Technical Details -->
        <div class="tech-details-collapse">
          <div class="tech-details-summary" onclick="toggleTechDetails('tech-cost-details')">
            <div class="tech-summary-left">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              <span>Technical Details & AWS CloudTrail Payload</span>
            </div>
            <span>ID: ${cost.technicalDetails.anomalyId} (Click to Expand)</span>
          </div>
          <div class="tech-details-content" id="tech-cost-details" style="display: none;">
            <div class="tech-meta-grid">
              <div class="tech-meta-item">
                <div class="key">AWS Account & Region</div>
                <div class="val">${cost.technicalDetails.accountId} / ${cost.technicalDetails.region}</div>
              </div>
              <div class="tech-meta-item">
                <div class="key">Instance Mutation Tier</div>
                <div class="val">${cost.technicalDetails.previousInstanceType} → ${cost.technicalDetails.currentInstanceType}</div>
              </div>
            </div>

            <div class="json-box-wrapper">
              <div class="json-box-header">
                <span>AWS Cost Explorer & CloudTrail Telemetry (JSON)</span>
                <button class="copy-json-btn" onclick="copyRawJSON('${cost.id}')">Copy JSON</button>
              </div>
              <pre class="json-code-view" id="json-${cost.id}">${JSON.stringify(cost.technicalDetails.rawTelemetry, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* Card 3 HTML Builder */
function renderChangeCardHTML(changeInspector) {
  return `
    <div class="showcase-card" id="card-change-inspector">
      <div class="card-top-bar">
        <div class="card-identity">
          <div class="card-num-badge">03</div>
          <div class="card-title-group">
            <h3>
              <span>Change Inspector:</span> ${changeInspector.title}
              <span class="brand-badge">${changeInspector.totalChanges} Proposed Actions</span>
            </h3>
          </div>
        </div>
        <span class="status-badge info">
          Automated Pre-Flight IaC Audit
        </span>
      </div>

      <div class="card-content">
        <!-- Changes Table -->
        <table class="changes-table">
          <thead>
            <tr>
              <th>Cloud Provider</th>
              <th>Target Resource</th>
              <th>Proposed Infrastructure Change</th>
              <th>Risk Evaluation</th>
              <th>Blast Radius</th>
              <th>Decision Gate</th>
            </tr>
          </thead>
          <tbody>
            ${changeInspector.items.map(item => {
              const status = AppState.approvals[item.id] || 'PENDING';
              return `
                <tr id="row-${item.id}">
                  <td>
                    <span class="cloud-provider-tag ${item.cloudCode}">${item.cloud}</span>
                  </td>
                  <td>
                    <span class="resource-code">${item.resource}</span>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${item.resourceType}</div>
                  </td>
                  <td>
                    <strong>${item.action}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${item.riskReason}</div>
                  </td>
                  <td>
                    <span class="risk-tag ${item.riskLevel.toLowerCase()}">
                      ${item.riskLevel === 'HIGH' ? '⚠ HIGH RISK' : '✓ LOW RISK'}
                    </span>
                  </td>
                  <td style="font-size: 0.8rem; color: var(--text-secondary);">
                    ${item.blastRadius}
                  </td>
                  <td>
                    <div class="action-btn-group" id="actions-${item.id}">
                      ${status === 'PENDING' ? `
                        <button class="btn btn-approve" onclick="handleApprovalAction('${item.id}', 'APPROVE')" style="padding: 4px 10px; font-size: 0.75rem;">
                          Approve
                        </button>
                        <button class="btn btn-reject" onclick="handleApprovalAction('${item.id}', 'REJECT')" style="padding: 4px 10px; font-size: 0.75rem;">
                          Reject
                        </button>
                      ` : `
                        <span class="status-badge ${status === 'APPROVED' ? 'success' : 'warning'}" style="font-size: 0.72rem;">
                          ${status}
                        </span>
                      `}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Action Buttons -->
        <div class="card-actions-bar">
          <div class="action-btn-group">
            <button class="btn btn-inspect" id="btn-inspect-proposed-change" onclick="openChangeInspectorModal()">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Inspect Proposed Change
            </button>
            <button class="btn btn-outline" onclick="openRemediationModal('ALL-CHANGES')">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Review Remediation
            </button>
          </div>

          <div class="action-btn-group">
            <span style="font-size: 0.78rem; color: var(--text-muted);">
              All changes strictly paused until human confirmation
            </span>
          </div>
        </div>

        <!-- Collapsible Technical Details -->
        <div class="tech-details-collapse">
          <div class="tech-details-summary" onclick="toggleTechDetails('tech-chg-details')">
            <div class="tech-summary-left">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              <span>Technical Details & Terraform Plan Diffs</span>
            </div>
            <span>3 Infrastructure Plan Diffs (Click to Expand)</span>
          </div>
          <div class="tech-details-content" id="tech-chg-details" style="display: none;">
            ${changeInspector.items.map(i => `
              <div style="margin-bottom: 12px;">
                <div style="font-size: 0.75rem; font-weight: 700; color: #7dd3fc; margin-bottom: 4px;">
                  [${i.cloud}] ${i.resource} — ${i.action} (${i.riskLevel} RISK)
                </div>
                <pre class="json-code-view" style="max-height: 120px;">${i.technicalDiff}</pre>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* Agent Workflow Section HTML */
function renderAgentWorkflowSectionHTML() {
  const { rootAgent, subAgents, timeline } = window.CLOUD_POLICE_DATA.agentWorkflow;

  return `
    <div class="workflow-section" id="agent-workflow-section">
      <div class="workflow-header">
        <div class="section-title-wrap">
          <h2 class="section-title">Cloud Police Agent Workflow</h2>
          <span class="brand-badge">Autonomous Multi-Agent Mesh</span>
        </div>
        <span style="font-size: 0.8rem; color: var(--text-secondary);">
          Central Orchestrator dispatches specialized sub-agents with <strong>Mandatory Human-in-the-Loop Gate</strong>
        </span>
      </div>

      <!-- Agent Hierarchy Nodes Grid -->
      <div class="workflow-agents-bar">
        <!-- Root Agent -->
        <div class="agent-node root" id="agent-node-root">
          <div class="agent-avatar root-icon">CP</div>
          <div class="agent-name">Root Agent</div>
          <div class="agent-role">Central Orchestrator</div>
          <span class="agent-status-tag active">Active Dispatcher</span>
        </div>

        <!-- Diagnosis Agent -->
        <div class="agent-node" id="agent-node-diag">
          <div class="agent-avatar diag-icon">DA</div>
          <div class="agent-name">Diagnosis Agent</div>
          <div class="agent-role">Network Flow Analysis</div>
          <span class="agent-status-tag active">Isolated Azure Port 1433</span>
        </div>

        <!-- Cost Agent -->
        <div class="agent-node" id="agent-node-cost">
          <div class="agent-avatar cost-icon">CA</div>
          <div class="agent-name">Cost Agent</div>
          <div class="agent-role">FinOps Telemetry</div>
          <span class="agent-status-tag active">+127.3% Surge Verified</span>
        </div>

        <!-- Change Inspector Agent -->
        <div class="agent-node" id="agent-node-change">
          <div class="agent-avatar change-icon">CI</div>
          <div class="agent-name">Change Inspector</div>
          <div class="agent-role">IaC Risk Analysis</div>
          <span class="agent-status-tag active">3 Plans Evaluated</span>
        </div>

        <!-- Remediation Agent -->
        <div class="agent-node" id="agent-node-rem">
          <div class="agent-avatar rem-icon">RA</div>
          <div class="agent-name">Remediation Agent</div>
          <div class="agent-role">Safe Guardrails</div>
          <span class="agent-status-tag active">Rollback Plan Ready</span>
        </div>

        <!-- Human Approval Gate -->
        <div class="agent-node" id="agent-node-human" style="border-color: rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.05);">
          <div class="agent-avatar human-icon">HA</div>
          <div class="agent-name">Human Approval</div>
          <div class="agent-role">Mandatory Gate</div>
          <span class="agent-status-tag waiting">Awaiting Operator</span>
        </div>
      </div>

      <!-- Agent Activity Timeline -->
      <div class="timeline-card">
        <div class="timeline-title">
          <span>Agent Activity Timeline</span>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">Chronological Audit Stream</span>
        </div>
        <div class="timeline-list" id="agent-timeline-list">
          ${timeline.map(item => `
            <div class="timeline-item">
              <div class="timeline-dot ${item.agentType}"></div>
              <div class="timeline-meta">
                <span class="timeline-agent-tag">${item.agent}</span>
                <span class="timeline-time">${item.time}</span>
              </div>
              <div class="timeline-desc">
                <strong>${item.title}:</strong> ${item.detail}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderWorkflowTimeline() {
  // Timeline rendered as part of agent workflow section
}

/* ==========================================================================
   Dedicated View Tabs (Network, Cost, Changes, Approvals, Evidence)
   ========================================================================== */

function renderNetworkIncidentsView() {
  const container = document.getElementById('main-tab-content');
  const { networkIncident } = window.CLOUD_POLICE_DATA.demonstrations;

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-wrap">
        <h2 class="section-title">Network Incidents Command Center</h2>
        <span class="status-badge critical">1 Active Blocking Incident</span>
      </div>
      <button class="btn btn-outline" onclick="switchTab('overview')">← Back to Overview</button>
    </div>
    ${renderNetworkCardHTML(networkIncident)}
  `;
}

function renderCostAnomaliesView() {
  const container = document.getElementById('main-tab-content');
  const { costAnomaly } = window.CLOUD_POLICE_DATA.demonstrations;

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-wrap">
        <h2 class="section-title">Cost Anomalies & FinOps Governance</h2>
        <span class="status-badge warning">1 Active Cost Surge (+$2,100/mo)</span>
      </div>
      <button class="btn btn-outline" onclick="switchTab('overview')">← Back to Overview</button>
    </div>
    ${renderCostCardHTML(costAnomaly)}
  `;
}

function renderChangeInspectorView() {
  const container = document.getElementById('main-tab-content');
  const { changeInspector } = window.CLOUD_POLICE_DATA.demonstrations;

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-wrap">
        <h2 class="section-title">Change Inspector & IaC Blast Radius</h2>
        <span class="status-badge info">3 Changes Monitored</span>
      </div>
      <button class="btn btn-outline" onclick="switchTab('overview')">← Back to Overview</button>
    </div>
    ${renderChangeCardHTML(changeInspector)}
  `;
}

function renderHumanApprovalsView() {
  const container = document.getElementById('main-tab-content');
  const pendingCount = getPendingApprovalsCount();

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-wrap">
        <h2 class="section-title">Human Approvals Safety Queue</h2>
        <span class="status-badge ${pendingCount > 0 ? 'warning' : 'success'}">${pendingCount} Items Awaiting Review</span>
      </div>
      <button class="btn btn-outline" onclick="switchTab('overview')">← Back to Overview</button>
    </div>

    <!-- Safety Banner in Queue -->
    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 20px; font-size: 0.85rem; color: #bfdbfe;">
      🔒 <strong>Cloud Police Safety Lock Active:</strong> All proposed remediations, NSG modifications, and compute resizes are quarantined here. You must explicitly approve each action before any deployment is generated.
    </div>

    <div class="cards-showcase">
      <!-- Item 1: Azure SQL NSG -->
      <div class="showcase-card">
        <div class="card-top-bar">
          <div class="card-identity">
            <span class="cloud-provider-tag azure">Azure</span>
            <strong>INC-AZ-9402: Allow Port 1433 NSG Rule Deployment</strong>
          </div>
          <span class="status-badge ${AppState.approvals['INC-AZ-9402'] === 'APPROVED' ? 'success' : AppState.approvals['INC-AZ-9402'] === 'REJECTED' ? 'warning' : 'critical'}">
            ${AppState.approvals['INC-AZ-9402']}
          </span>
        </div>
        <div class="card-content">
          <p style="font-size: 0.88rem; margin-bottom: 12px;">Restores network rule allowing App Subnet <code>10.0.4.0/24</code> to talk to SQL Database on TCP 1433.</p>
          <div class="card-actions-bar">
            <button class="btn btn-outline" onclick="openNetworkInvestigateModal('INC-AZ-9402')">Investigate Details</button>
            <div class="action-btn-group">
              <button class="btn btn-approve" onclick="handleApprovalAction('INC-AZ-9402', 'APPROVE')">Approve Remediation</button>
              <button class="btn btn-reject" onclick="handleApprovalAction('INC-AZ-9402', 'REJECT')">Reject</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Item 2: AWS EC2 Downsize -->
      <div class="showcase-card">
        <div class="card-top-bar">
          <div class="card-identity">
            <span class="cloud-provider-tag aws">AWS</span>
            <strong>COST-AWS-3180: Downsize EC2 Instance (c5.9xlarge → t3.xlarge)</strong>
          </div>
          <span class="status-badge ${AppState.approvals['COST-AWS-3180'] === 'APPROVED' ? 'success' : AppState.approvals['COST-AWS-3180'] === 'REJECTED' ? 'warning' : 'warning'}">
            ${AppState.approvals['COST-AWS-3180']}
          </span>
        </div>
        <div class="card-content">
          <p style="font-size: 0.88rem; margin-bottom: 12px;">Saves an estimated <strong>$2,100/month</strong> by rightsizing idle compute worker.</p>
          <div class="card-actions-bar">
            <button class="btn btn-outline" onclick="openCostAnalysisModal('COST-AWS-3180')">View Cost Model</button>
            <div class="action-btn-group">
              <button class="btn btn-approve" onclick="handleApprovalAction('COST-AWS-3180', 'APPROVE')">Approve Resize</button>
              <button class="btn btn-reject" onclick="handleApprovalAction('COST-AWS-3180', 'REJECT')">Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEvidenceView() {
  const container = document.getElementById('main-tab-content');
  const { evidenceList } = window.CLOUD_POLICE_DATA;

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-wrap">
        <h2 class="section-title">Evidence & Multi-Cloud Audit Vault</h2>
        <span class="status-badge info">${evidenceList.length} Cryptographic Evidence Records</span>
      </div>
      <button class="btn btn-outline" onclick="switchTab('overview')">← Back to Overview</button>
    </div>

    <div class="cards-showcase">
      ${evidenceList.map(ev => `
        <div class="showcase-card">
          <div class="card-top-bar">
            <div class="card-identity">
              <span class="cloud-provider-tag ${ev.cloudCode}">${ev.cloud}</span>
              <strong>${ev.id} — ${ev.type}</strong>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${ev.timestamp}</span>
          </div>
          <div class="card-content">
            <div style="font-size: 0.85rem; margin-bottom: 6px;">
              <strong>Resource:</strong> <span class="resource-code">${ev.resource}</span>
            </div>
            <div style="font-size: 0.88rem; color: var(--text-primary); margin-bottom: 8px;">
              <strong>Summary:</strong> ${ev.summary}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); background: var(--bg-card-subtle); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              ${ev.details}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ==========================================================================
   Interactive Actions: Approve / Reject / Collapsible
   ========================================================================== */
function handleApprovalAction(itemId, actionType) {
  if (actionType === 'RESET') {
    AppState.approvals[itemId] = 'PENDING';
    showToast('Decision Reset', `Status for ${itemId} reset to PENDING.`);
  } else if (actionType === 'APPROVE') {
    AppState.approvals[itemId] = 'APPROVED';
    showToast('Proposal Approved', `Action ${itemId} approved. Mock interface updated (No cloud action executed).`, 'success');
  } else if (actionType === 'REJECT') {
    AppState.approvals[itemId] = 'REJECTED';
    showToast('Proposal Rejected', `Action ${itemId} rejected. Logged in audit trail.`, 'warning');
  }

  // Update audit log
  AppState.auditLogs.unshift({
    id: `LOG-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toLocaleTimeString(),
    action: `Human ${actionType} on ${itemId}`,
    details: `Operator decision: ${actionType}. Cloud safety policy upheld.`,
    status: actionType === 'APPROVE' ? 'SUCCESS' : 'WARNING'
  });

  // Re-render
  updateApprovalCounts();
  switchTab(AppState.activeTab);
}

function toggleTechDetails(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (el.style.display === 'none' || el.style.display === '') {
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

function copyRawJSON(id) {
  const jsonEl = document.getElementById(`json-${id}`);
  if (jsonEl) {
    navigator.clipboard.writeText(jsonEl.innerText).then(() => {
      showToast('JSON Copied', 'Raw telemetry payload copied to clipboard.');
    }).catch(() => {
      showToast('Copy Failed', 'Please select and copy manually.');
    });
  }
}

/* ==========================================================================
   Modals & Investigation Drawers
   ========================================================================== */
function initModals() {
  const modalBackdrop = document.getElementById('modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });
  }
}

function openModal(title, bodyHTML, footerHTML) {
  const backdrop = document.getElementById('modal-backdrop');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');

  if (!backdrop || !titleEl || !bodyEl || !footerEl) return;

  titleEl.innerHTML = title;
  bodyEl.innerHTML = bodyHTML;
  footerEl.innerHTML = footerHTML || `
    <button class="btn btn-outline" onclick="closeModal()">Close</button>
  `;

  backdrop.classList.add('show');
}

function closeModal() {
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) {
    backdrop.classList.remove('show');
  }
}

function openNetworkInvestigateModal(id) {
  const incident = window.CLOUD_POLICE_DATA.demonstrations.networkIncident;
  const title = `
    <span class="cloud-provider-tag azure">Azure</span>
    Investigate Network Incident (${incident.id})
  `;

  const body = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--color-red-border); padding: 12px 16px; border-radius: var(--radius-md);">
        <strong style="color: #f87171;">Diagnostic Findings:</strong> Port 1433 communication to SQL database is blocked due to missing NSG rule Priority 110.
      </div>

      <div>
        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px;">Network Topology Path</h4>
        <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-family: var(--font-mono); font-size: 0.8rem; line-height: 1.6;">
          <div>[Source] <strong>vm-app-prod-eastus2</strong> (10.0.4.15)</div>
          <div style="color: var(--text-muted);">   ↓ (VNet Peering eastus2-core)</div>
          <div style="color: #f87171;">   ✖ [BLOCKED BY NSG: nsg-prod-db-eastus2] ✖</div>
          <div>[Target] <strong>sql-prod-db01</strong> (10.0.5.10:1433)</div>
        </div>
      </div>

      <div>
        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px;">Diagnosis Agent Confidence Score</h4>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="flex: 1; background: #1e293b; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background: #38bdf8; width: 99.4%; height: 100%;"></div>
          </div>
          <span style="font-weight: 800; color: #38bdf8; font-size: 0.88rem;">99.4% Verified</span>
        </div>
      </div>

      <div>
        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px;">Safe Remediation Action</h4>
        <pre class="json-code-view" style="font-size: 0.75rem;">
# Terraform Dry-Run Plan
resource "azurerm_network_security_rule" "allow_app_sql" {
  name                        = "Allow-AppSubnet-SQL-1433"
  priority                    = 110
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_address_prefix       = "10.0.4.0/24"
  destination_port_range     = "1433"
  destination_address_prefix  = "10.0.5.10"
}
        </pre>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Dismiss</button>
    <button class="btn btn-approve" onclick="handleApprovalAction('${incident.id}', 'APPROVE'); closeModal();">Approve Remediation</button>
  `;

  openModal(title, body, footer);
}

function openCostAnalysisModal(id) {
  const cost = window.CLOUD_POLICE_DATA.demonstrations.costAnomaly;
  const title = `
    <span class="cloud-provider-tag aws">AWS</span>
    Analyze Cost Anomaly (${cost.id})
  `;

  const body = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--color-amber-border); padding: 12px 16px; border-radius: var(--radius-md);">
        <strong style="color: #fbbf24;">FinOps Analysis:</strong> AWS EC2 instance <code>i-09f83a84bce</code> was scaled 9x higher than workload demand.
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <div style="font-size: 0.75rem; color: var(--text-muted);">BASELINE (t3.medium)</div>
          <div style="font-size: 1.1rem; font-weight: 800;">$55.00 / day</div>
          <div style="font-size: 0.72rem; color: var(--text-secondary);">$1,650 / month</div>
        </div>
        <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--color-red-border);">
          <div style="font-size: 0.75rem; color: #f87171;">CURRENT (c5.9xlarge)</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: #f87171;">$125.00 / day</div>
          <div style="font-size: 0.72rem; color: #f87171;">$3,750 / month (+127.3%)</div>
        </div>
      </div>

      <div>
        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px;">Resource Utilization Telemetry</h4>
        <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
            <span>Average CPU Utilization</span>
            <strong style="color: #fbbf24;">4.2% (Idle)</strong>
          </div>
          <div style="background: #1e293b; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: #fbbf24; width: 4.2%; height: 100%;"></div>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">Instance provisioned with 36 vCPUs and 72GB RAM for a 1-vCPU background batch job.</div>
        </div>
      </div>

      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--color-green-border); padding: 12px; border-radius: var(--radius-sm);">
        <strong style="color: #34d399;">Recommended Right-Sizing:</strong> Resize to <code>t3.xlarge</code> saves <strong>$2,100.00/month</strong> while providing ample 4 vCPUs and 16GB RAM headroom.
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Dismiss</button>
    <button class="btn btn-approve" onclick="handleApprovalAction('${cost.id}', 'APPROVE'); closeModal();">Approve Resize Playbook</button>
  `;

  openModal(title, body, footer);
}

function openChangeInspectorModal() {
  const changes = window.CLOUD_POLICE_DATA.demonstrations.changeInspector;
  const title = `
    <span class="brand-badge">IaC Inspection</span>
    Inspect Proposed Multi-Cloud Changes
  `;

  const body = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <p style="font-size: 0.85rem; color: var(--text-secondary);">
        Cloud Police evaluated 3 upcoming infrastructure changes before application:
      </p>

      <div style="border: 1px solid var(--color-red-border); background: rgba(239, 68, 68, 0.05); padding: 12px; border-radius: var(--radius-sm);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <strong style="color: #f87171;">1. [Azure] NSG Rule Deletion</strong>
          <span class="risk-tag high">HIGH RISK</span>
        </div>
        <div style="font-size: 0.8rem;">Impact: Drops database connectivity for production checkout API.</div>
      </div>

      <div style="border: 1px solid var(--color-red-border); background: rgba(239, 68, 68, 0.05); padding: 12px; border-radius: var(--radius-sm);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <strong style="color: #f87171;">2. [AWS] EC2 Instance Resize</strong>
          <span class="risk-tag high">HIGH RISK</span>
        </div>
        <div style="font-size: 0.8rem;">Impact: +127.3% cost surge without workload utilization demand.</div>
      </div>

      <div style="border: 1px solid var(--color-green-border); background: rgba(16, 185, 129, 0.05); padding: 12px; border-radius: var(--radius-sm);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <strong style="color: #34d399;">3. [GCP] GKE Label Update</strong>
          <span class="risk-tag low">LOW RISK</span>
        </div>
        <div style="font-size: 0.8rem;">Impact: Safe metadata enrichment for cost allocation.</div>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Close</button>
  `;

  openModal(title, body, footer);
}

function openRemediationModal(id) {
  const title = `
    <span class="brand-badge">Safety Guardrails</span>
    Review Safe Remediation Plan
  `;

  const body = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--color-green-border); padding: 12px; border-radius: var(--radius-md); font-size: 0.85rem;">
        🛡 <strong>Dry-Run Pre-Flight Completed:</strong> Zero unintended blast radius detected. Rollback snapshot prepared in memory.
      </div>

      <div>
        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 6px;">Safety Verification Checklist</h4>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 6px; font-size: 0.82rem;">
          <li>✓ <strong>Infrastructure Drift Check:</strong> Verified current live state against IaC statefile.</li>
          <li>✓ <strong>Rollback Plan:</strong> Automatic revert triggers if synthetic health probes fail within 120s.</li>
          <li>✓ <strong>Human Authorization:</strong> Requires digital operator confirmation before execution.</li>
        </ul>
      </div>

      <div>
        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 6px;">Generated Rollback Guardrail</h4>
        <pre class="json-code-view" style="font-size: 0.75rem;">
{
  "safety_lock": "STRICT_HUMAN_APPROVAL_REQUIRED",
  "auto_rollback_seconds": 120,
  "probe_endpoints": [
    "https://api.internal.corp/healthz",
    "tcp://10.0.5.10:1433"
  ]
}
        </pre>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="btn btn-approve" onclick="showToast('Safe Execution Prepared', 'Awaiting operator signature in Human Approvals queue.'); closeModal();">
      Confirm Readiness
    </button>
  `;

  openModal(title, body, footer);
}

function openFlaskCodeModal() {
  const title = `
    <span class="brand-badge">Flask Integration</span>
    Python Flask Connection Guide
  `;

  const body = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <p style="font-size: 0.85rem; color: var(--text-secondary);">
        You can copy these frontend files directly into your Python Flask project:
      </p>

      <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-family: var(--font-mono); font-size: 0.78rem;">
        <div>my_flask_project/</div>
        <div>├── app.py                   <span style="color: var(--text-muted);"># Flask application</span></div>
        <div>├── templates/</div>
        <div>│   └── index.html           <span style="color: var(--text-muted);"># This HTML file</span></div>
        <div>└── static/</div>
        <div>    ├── css/styles.css       <span style="color: var(--text-muted);"># Command Center Styles</span></div>
        <div>    └── js/</div>
        <div>        ├── mockData.js      <span style="color: var(--text-muted);"># Mock or API adapter</span></div>
        <div>        └── app.js           <span style="color: var(--text-muted);"># Interactivity</span></div>
      </div>

      <pre class="json-code-view" style="font-size: 0.75rem;">
# Python Flask snippet (app.py)
from flask import Flask, render_template, jsonify

app = Flask(__name__)

@app.route("/")
def dashboard():
    return render_template("index.html")

@app.route("/api/v1/overview")
def get_overview():
    return jsonify({...}) # Returns live cloud metrics

if __name__ == "__main__":
    app.run(debug=True, port=5000)
      </pre>
    </div>
  `;

  openModal(title, body);
}

/* ==========================================================================
   Agent Live Simulation (For Stage Presentations)
   ========================================================================== */
function triggerLiveWorkflowSimulation() {
  showToast('Simulation Started', 'Cloud Police Root Agent orchestrating multi-agent scan...', 'info');

  const nodes = [
    { id: 'agent-node-root', text: 'Dispatching telemetry...' },
    { id: 'agent-node-diag', text: 'Analyzing Azure flow logs...' },
    { id: 'agent-node-cost', text: 'Evaluating AWS EC2 cost...' },
    { id: 'agent-node-change', text: 'Checking Terraform blast radius...' },
    { id: 'agent-node-rem', text: 'Generating safety guardrail...' },
    { id: 'agent-node-human', text: 'Awaiting human authorization...' }
  ];

  nodes.forEach((node, idx) => {
    setTimeout(() => {
      const el = document.getElementById(node.id);
      if (el) {
        el.classList.add('active-pulse');
        setTimeout(() => el.classList.remove('active-pulse'), 1800);
      }
    }, idx * 600);
  });

  setTimeout(() => {
    showToast('Workflow Complete', 'All agents converged. 3 items ready in Human Approval queue.', 'success');
  }, nodes.length * 600 + 400);
}

/* ==========================================================================
   Presentation Mode
   ========================================================================== */
function initPresentationMode() {
  const toggleBtn = document.getElementById('btn-presentation-mode');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      AppState.presentationMode = !AppState.presentationMode;
      if (AppState.presentationMode) {
        document.body.style.zoom = '1.05';
        toggleBtn.innerHTML = `
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/></svg>
          Exit Stage Mode
        `;
        showToast('Stage Presentation Mode ON', 'Typography and cards optimized for stage projection.', 'info');
      } else {
        document.body.style.zoom = '1.0';
        toggleBtn.innerHTML = `
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/></svg>
          Stage Presentation Mode
        `;
      }
    });
  }
}

/* ==========================================================================
   Toast Notification Utility
   ========================================================================== */
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'danger') icon = '🚨';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div style="flex: 1;">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Expose handlers globally for onclick attributes
window.switchTab = switchTab;
window.handleApprovalAction = handleApprovalAction;
window.toggleTechDetails = toggleTechDetails;
window.copyRawJSON = copyRawJSON;
window.openNetworkInvestigateModal = openNetworkInvestigateModal;
window.openCostAnalysisModal = openCostAnalysisModal;
window.openChangeInspectorModal = openChangeInspectorModal;
window.openRemediationModal = openRemediationModal;
window.openFlaskCodeModal = openFlaskCodeModal;
window.closeModal = closeModal;
window.triggerLiveWorkflowSimulation = triggerLiveWorkflowSimulation;
