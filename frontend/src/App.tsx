import { OverviewDetails } from './components/OverviewDetails';
import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SummaryCards } from './components/SummaryCards';
import { MonitoringStatus } from './components/MonitoringStatus';
import { DetailModal } from './components/DetailModal';
import { PolicyModal } from './components/PolicyModal';
import { EvidenceStore } from './components/EvidenceStore';
import { AssistantPanel } from './components/AssistantPanel';
import { ApprovalQueue } from './components/ApprovalQueue';
import { IncidentsPage } from './components/IncidentsPage';
import { CostPage } from './components/CostPage';
import { ChangesPage } from './components/ChangesPage';
import { MarketingSite } from './components/MarketingSite';
import { LoginPage } from './components/LoginPage';
import { PublicInformationPage } from './components/PublicInformationPage';
import { PublicPageId } from './components/marketing/PublicFooter';
import { AdminUsersPage } from './components/AdminUsersPage';
import { MyProfilePage } from './components/MyProfilePage';
import { PreferencesPage } from './components/PreferencesPage';
import { SecurityPage } from './components/SecurityPage';
import {
  initialNetworkIncident,
  initialCostAnomaly,
  initialChangeInspector,
} from './data/mockData';
import { initialApprovalItems } from './data/approvalData';
import { SearchItem } from './data/searchData';
import {
  LiveDashboardData,
  loadLiveDashboardData,
} from './services/cloudPoliceApi';
import {
  loadReviewerSession,
  ReviewerAuthenticationError,
  ReviewerSession,
  signOutReviewer,
} from './services/authService';
import {
  loadUserPreferences,
  saveUserPreferences,
  UserPreferences,
} from './services/userPreferences';
import {
  ApprovalApiError,
  loadApprovalDecisionHistory,
  recordApprovalDecision,
  reopenCase,
  RecordedApprovalDecision,
} from './services/approvalApi';
import {
  NetworkIncidentData,
  CostAnomalyData,
  ChangeInspectorData,
  DemonstrationType,
  ApprovalStatus,
  SearchCategoryFilter,
  SidebarNavId,
  ApprovalItem,
  ApprovalHistoryRecord,
  ThemeMode,
} from './types';
import { CheckCircle2, XCircle, Info, Filter, X, Lock, Terminal } from 'lucide-react';

import { aggregateApprovalStatus, isApprovalOpen } from './utils/approvalStatus';

const LOCAL_STORAGE_THEME_KEY = 'cloud_police_theme_mode_v2';
const LOCAL_STORAGE_SIDEBAR_COLLAPSED_KEY = 'cloud_police_sidebar_collapsed_v2';
const PUBLIC_PATHS: Record<string, PublicPageId> = {
  '/privacy': 'privacy', '/terms': 'terms', '/cookies': 'cookies',
  '/accessibility': 'accessibility', '/support': 'support',
  '/password-reset': 'password-reset', '/email-verification': 'email-verification',
  '/access-denied': 'access-denied', '/maintenance': 'maintenance',
};
export default function App() {
  // Main View Mode: defaults to the marketing site
  const [viewMode, setViewMode] = useState<'marketing' | 'login' | 'console'>(() => {
    if (window.location.pathname === '/login') return 'login';
    return window.location.pathname === '/console' && loadReviewerSession() ? 'console' : 'marketing';
  });
  const [publicPage, setPublicPage] = useState<PublicPageId | null>(() => {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    return path === '/' || path === '/login' || path === '/console' ? null : PUBLIC_PATHS[path] || 'not-found';
  });
  const [reviewerSession, setReviewerSession] = useState<ReviewerSession | null>(() =>
    loadReviewerSession()
  );
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() =>
    loadUserPreferences()
  );
  // Theme Mode State with device preference default and localStorage persistence
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return userPreferences.theme;
  });

  // Apply dark class to documentElement and persist theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const navigatePublic = (page: PublicPageId) => {
    const path = Object.entries(PUBLIC_PATHS).find(([, value]) => value === page)?.[0] || '/404';
    window.history.pushState({}, '', path);
    setPublicPage(page);
    setViewMode('marketing');
    window.scrollTo({ top: 0 });
  };

  const navigateHome = () => {
    window.history.pushState({}, '', '/');
    setPublicPage(null);
    setViewMode('marketing');
    window.scrollTo({ top: 0 });
  };

  const navigateLogin = () => {
    window.history.pushState({}, '', '/login');
    setPublicPage(null);
    setViewMode('login');
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const syncPath = () => {
      const path = window.location.pathname.replace(/\/$/, '') || '/';
      if (path === '/login') { setPublicPage(null); setViewMode('login'); return; }
      if (path === '/' || path === '/console') { setPublicPage(null); setViewMode(path === '/console' && reviewerSession ? 'console' : 'marketing'); return; }
      setPublicPage(PUBLIC_PATHS[path] || 'not-found'); setViewMode('marketing');
    };
    window.addEventListener('popstate', syncPath);
    return () => window.removeEventListener('popstate', syncPath);
  }, [reviewerSession]);

  // Sidebar Collapse State with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SIDEBAR_COLLAPSED_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isSignOutConfirmOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSignOutConfirmOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSignOutConfirmOpen]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LOCAL_STORAGE_SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };
  const [networkIncident, setNetworkIncident] = useState<NetworkIncidentData>(initialNetworkIncident);
  const [networkIncidents, setNetworkIncidents] = useState<NetworkIncidentData[]>([
    initialNetworkIncident,
  ]);
  const [costAnomaly, setCostAnomaly] = useState<CostAnomalyData>(initialCostAnomaly);
  const [costAnomalies, setCostAnomalies] = useState<CostAnomalyData[]>([
    initialCostAnomaly,
  ]);
  const [changeInspector, setChangeInspector] = useState<ChangeInspectorData>(initialChangeInspector);

  // Approval state is loaded from the APIs. Browser storage is not authoritative.
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>(initialApprovalItems);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryRecord[]>([]);

  const [dashboardSummary, setDashboardSummary] = useState<
    LiveDashboardData['summary'] | null
  >(null);
  const [monitoringStatus, setMonitoringStatus] = useState<
    LiveDashboardData['monitoring']
  >(null);
  const [dataConnection, setDataConnection] = useState<
    'loading' | 'live' | 'fallback'
  >('loading');
  const [hasLoadedLiveData, setHasLoadedLiveData] = useState(false);

  const loadLiveData = async (showLoadingState = true) => {
    if (showLoadingState) {
      setDataConnection('loading');
    }
    try {
      const liveData = await loadLiveDashboardData();
      setDashboardSummary(liveData.summary);
      setMonitoringStatus(liveData.monitoring);
      setNetworkIncident(liveData.networkIncident);
      setNetworkIncidents(liveData.networkIncidents);
      setCostAnomaly(liveData.costAnomaly);
      setCostAnomalies(liveData.costAnomalies);
      setChangeInspector(liveData.changeInspector);

      setApprovalItems(liveData.approvalItems);
      setHasLoadedLiveData(true);
      setDataConnection('live');
    } catch (error) {
      console.error('Unable to load the Cloud Police API.', error);
      setMonitoringStatus(null);
      setDataConnection('fallback');
    }
  };

  useEffect(() => {
    if (!reviewerSession) {
      return;
    }

    void loadLiveData();

    const refreshTimer = window.setInterval(() => {
      void loadLiveData(false);
    }, userPreferences.refreshIntervalMinutes * 60 * 1000);

    return () => window.clearInterval(refreshTimer);
  }, [reviewerSession, userPreferences.refreshIntervalMinutes]);

  // Active navigation in sidebar
  const [activeNav, setActiveNav] = useState<SidebarNavId>('overview');
  const [approvalTargetId, setApprovalTargetId] = useState<string | null>(null);

  // Modal and Policy States
  const [activeModal, setActiveModal] = useState<DemonstrationType | null>(null);
  const [activePolicy, setActivePolicy] = useState<SearchItem | null>(null);

  // Global Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategoryFilter>('ALL');
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<string | null>(
    userPreferences.defaultCloud === 'ALL' ? null : userPreferences.defaultCloud
  );

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((current) => (current?.text === text ? null : current));
    }, 4000);
  };

  const requireReviewer = () => {
    if (reviewerSession) return true;

    showToast('Reviewer sign-in is required to record a decision.', 'warning');
    setViewMode('login');
    return false;
  };

  const reviewerEmail = reviewerSession?.email || 'Authenticated Reviewer';

  const getFormattedTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const approvalHistoryCaseKey = useMemo(
    () => approvalItems.map((item) => item.id).sort().join('|'),
    [approvalItems]
  );

  useEffect(() => {
    if (!reviewerSession) {
      setApprovalHistory([]);
      return;
    }

    let cancelled = false;

    void loadApprovalDecisionHistory(approvalItems)
      .then((history) => {
        if (!cancelled) setApprovalHistory(history);
      })
      .catch((error) => {
        if (cancelled) return;
        if (
          error instanceof ReviewerAuthenticationError ||
          (error instanceof ApprovalApiError && error.status === 401)
        ) {
          signOutReviewer();
          setReviewerSession(null);
          showToast('Your reviewer session ended. Please sign in again.', 'warning');
        } else {
          console.error('Unable to load approval history.', error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reviewerSession?.localId, approvalHistoryCaseKey]);

  const handleApprovalApiError = (error: unknown): never => {
    if (
      error instanceof ReviewerAuthenticationError ||
      (error instanceof ApprovalApiError && error.status === 401)
    ) {
      signOutReviewer();
      setReviewerSession(null);
      setViewMode('login');
      showToast('Your reviewer session ended. Please sign in again.', 'warning');
    } else {
      const message =
        error instanceof Error ? error.message : 'The decision could not be saved.';
      showToast(`Decision not saved: ${message}`, 'warning');
    }
    throw error;
  };

  const verifiedReviewer = (decision: RecordedApprovalDecision) =>
    decision.reviewer_name || decision.reviewer_email || reviewerEmail;

  // The header cloud scope applies to every console page and summary.
  const scopedNetworkIncidents = useMemo(
    () =>
      selectedCloudProvider
        ? networkIncidents.filter((item) => item.provider === selectedCloudProvider)
        : networkIncidents,
    [networkIncidents, selectedCloudProvider]
  );
  const scopedCostAnomalies = useMemo(
    () =>
      selectedCloudProvider
        ? costAnomalies.filter((item) => item.provider === selectedCloudProvider)
        : costAnomalies,
    [costAnomalies, selectedCloudProvider]
  );
  const scopedApprovalItems = useMemo(
    () =>
      selectedCloudProvider
        ? approvalItems.filter((item) => item.provider === selectedCloudProvider)
        : approvalItems,
    [approvalItems, selectedCloudProvider]
  );
  const scopedApprovalHistory = useMemo(
    () =>
      selectedCloudProvider
        ? approvalHistory.filter((item) => item.provider === selectedCloudProvider)
        : approvalHistory,
    [approvalHistory, selectedCloudProvider]
  );
  const scopedChangeInspector = useMemo(
    () => ({
      ...changeInspector,
      changes: selectedCloudProvider
        ? changeInspector.changes.filter((item) => item.cloud === selectedCloudProvider)
        : changeInspector.changes,
    }),
    [changeInspector, selectedCloudProvider]
  );

  const scopedNetworkIncident = scopedNetworkIncidents[0] || networkIncident;
  const scopedCostAnomaly = scopedCostAnomalies[0] || costAnomaly;
  const visibleNetworkIncidents = scopedNetworkIncidents.slice(
    0,
    userPreferences.listSize
  );
  const visibleCostAnomalies = scopedCostAnomalies.slice(
    0,
    userPreferences.listSize
  );
  const visibleApprovalItems = scopedApprovalItems.slice(
    0,
    userPreferences.listSize
  );
  const visibleApprovalHistory = scopedApprovalHistory.slice(
    0,
    userPreferences.listSize
  );
  const visibleChangeInspector = {
    ...scopedChangeInspector,
    changes: scopedChangeInspector.changes.slice(0, userPreferences.listSize),
  };

  // Live counts for summary cards and sidebar
  const activeIncidentsCount = hasLoadedLiveData
    ? scopedNetworkIncidents.filter((item) => item.operationalStatus && !['RESOLVED', 'CLOSED', 'UNKNOWN'].includes(item.operationalStatus.toUpperCase())).length : 0;
  // Show unresolved cost exposure, not the static ingestion summary. This keeps
  // Overview and Cost Intelligence consistent after a reviewer decision.
  const totalMonthlyCostImpact = hasLoadedLiveData
    ? scopedCostAnomalies
        // Reviewer approval status controls whether cost is still at risk.
        // A case may remain operationally OPEN after it is approved for
        // engineering planning, so operationalStatus must not drive this total.
        .filter(
          (item) =>
            item.status === 'PENDING' || item.status === 'EVIDENCE_REQUESTED'
        )
        .reduce((total, item) => {
          const amount = Number(item.metrics.monthlyExtraCost.replace(/[^0-9.-]/g, ''));
          return total + (Number.isFinite(amount) ? amount : 0);
        }, 0)
    : 0;
  const costAtRiskOverview =
    totalMonthlyCostImpact === 0
      ? '$0'
      : `$${(totalMonthlyCostImpact / 1000).toFixed(1)}K/month`;
  const costAtRiskFull =
    totalMonthlyCostImpact === 0
      ? '$0'
      : `+$${totalMonthlyCostImpact.toLocaleString('en-US')} / mo`;
  const costAtRisk = costAtRiskOverview;
  const proposedChangesCount = hasLoadedLiveData
    ? scopedChangeInspector.changes.length : 0;

  const updateChangeStatus = (id: string, status: ApprovalStatus) => {
    setChangeInspector((prev) => {
      const changes = prev.changes.map((change) => change.id === id ? { ...change, status } : change);
      return { ...prev, changes, status: aggregateApprovalStatus(changes.map((change) => change.status)) };
    });
  };

  // Dynamically calculate awaiting approvals (Requirements 5, 6, 7)
  const awaitingApprovalCount = hasLoadedLiveData
    ? scopedApprovalItems.filter(
        (item) => item.status === 'PENDING' || item.status === 'MORE_EVIDENCE_REQUESTED'
      ).length
    : 0;

  // Handle Human Approval Decisions (Requirement 4, 8)
  const handleApproveRecommendation = async (item: ApprovalItem) => {
    if (!requireReviewer()) return;

    let decision: RecordedApprovalDecision;
    try {
      decision = await recordApprovalDecision(item.id, {
        action: 'APPROVE',
        reason: 'Reviewed and authorized to proceed to engineering planning.',
      });
    } catch (error) {
      handleApprovalApiError(error);
    }

    const timestamp = getFormattedTimestamp(decision.decided_ts);
    const reviewer = verifiedReviewer(decision);

    setApprovalItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'APPROVED_FOR_PLANNING',
              reviewer,
              decisionTimestamp: timestamp,
            }
          : i
      )
    );

    const newRecord: ApprovalHistoryRecord = {
      id: decision.decision_id,
      approvalItemId: item.id,
      recommendationTitle: item.recommendationTitle,
      recommendationType:
        item.recommendationType ||
        (item.operationType === 'network'
          ? 'Incident Remediation'
          : item.operationType === 'cost'
          ? 'Cost Optimization'
          : 'Pre-Flight Change'),
      provider: item.provider,
      riskLevel: item.riskLevel,
      decision: 'APPROVED',
      statusLabel: 'Approved for Change Planning',
      finalStatus: decision.resulting_approval_status,
      reviewer,
      timestamp,
      notes: 'Authorized to proceed to engineering planning.',
      decisionReason: 'Authorized by Human Operator to proceed to change planning.',
      evidenceReviewed: item.evidenceReviewed,
      safetyNotice: 'Approval recorded. No infrastructure change has been applied.',
      operationType: item.operationType,
      technicalEvidence: item.technicalEvidence,
    };
    setApprovalHistory((prev) => [newRecord, ...prev]);

    if (item.operationType === 'network') {
      setNetworkIncident((prev) => prev.id === item.id ? { ...prev, status: 'APPROVED' } : prev);
      setNetworkIncidents((prev) =>
        prev.map((incident) =>
          incident.id === item.id ? { ...incident, status: 'APPROVED' } : incident
        )
      );
    } else if (item.operationType === 'cost') {
      setCostAnomaly((prev) => prev.id === item.id ? { ...prev, status: 'APPROVED' } : prev);
      setCostAnomalies((prev) =>
        prev.map((anomaly) =>
          anomaly.id === item.id ? { ...anomaly, status: 'APPROVED' } : anomaly
        )
      );
    } else if (item.operationType === 'change') {
      updateChangeStatus(item.id, 'APPROVED');
    }

    showToast(
      'Approval securely recorded in BigQuery. No infrastructure change has been applied.',
      'success'
    );
  };

  const handleRejectRecommendation = async (item: ApprovalItem, reason: string) => {
    if (!requireReviewer()) return;

    let decision: RecordedApprovalDecision;
    try {
      decision = await recordApprovalDecision(item.id, {
        action: 'REJECT',
        reason,
      });
    } catch (error) {
      handleApprovalApiError(error);
    }

    const timestamp = getFormattedTimestamp(decision.decided_ts);
    const reviewer = verifiedReviewer(decision);

    setApprovalItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'REJECTED',
              reviewer,
              rejectionReason: reason,
              decisionTimestamp: timestamp,
            }
          : i
      )
    );

    const newRecord: ApprovalHistoryRecord = {
      id: decision.decision_id,
      approvalItemId: item.id,
      recommendationTitle: item.recommendationTitle,
      recommendationType:
        item.recommendationType ||
        (item.operationType === 'network'
          ? 'Incident Remediation'
          : item.operationType === 'cost'
          ? 'Cost Optimization'
          : 'Pre-Flight Change'),
      provider: item.provider,
      riskLevel: item.riskLevel,
      decision: 'REJECTED',
      statusLabel: 'Rejected',
      finalStatus: decision.resulting_approval_status,
      reviewer,
      timestamp,
      notes: reason,
      decisionReason: reason,
      evidenceReviewed: item.evidenceReviewed,
      safetyNotice: 'Proposal rejected. Infrastructure remains unmodified.',
      operationType: item.operationType,
      technicalEvidence: item.technicalEvidence,
    };
    setApprovalHistory((prev) => [newRecord, ...prev]);

    if (item.operationType === 'network') {
      setNetworkIncident((prev) => prev.id === item.id ? { ...prev, status: 'REJECTED' } : prev);
      setNetworkIncidents((prev) =>
        prev.map((incident) =>
          incident.id === item.id ? { ...incident, status: 'REJECTED' } : incident
        )
      );
    } else if (item.operationType === 'cost') {
      setCostAnomaly((prev) => prev.id === item.id ? { ...prev, status: 'REJECTED' } : prev);
      setCostAnomalies((prev) =>
        prev.map((anomaly) =>
          anomaly.id === item.id ? { ...anomaly, status: 'REJECTED' } : anomaly
        )
      );
    } else if (item.operationType === 'change') {
      updateChangeStatus(item.id, 'REJECTED');
    }

    showToast(
      'Rejection securely recorded in BigQuery. Infrastructure remains unmodified.',
      'warning'
    );
  };

  const handleRequestMoreEvidence = async (
    item: ApprovalItem,
    requestedEvidence: string
  ) => {
    if (!requireReviewer()) return;

    let decision: RecordedApprovalDecision;
    try {
      decision = await recordApprovalDecision(item.id, {
        action: 'REQUEST_EVIDENCE',
        evidence_request: requestedEvidence,
      });
    } catch (error) {
      handleApprovalApiError(error);
    }

    const timestamp = getFormattedTimestamp(decision.decided_ts);
    const reviewer = verifiedReviewer(decision);

    setApprovalItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'MORE_EVIDENCE_REQUESTED',
              reviewer,
              requestedEvidenceNote: requestedEvidence,
              decisionTimestamp: timestamp,
            }
          : i
      )
    );

    const newRecord: ApprovalHistoryRecord = {
      id: decision.decision_id,
      approvalItemId: item.id,
      recommendationTitle: item.recommendationTitle,
      recommendationType:
        item.recommendationType ||
        (item.operationType === 'network'
          ? 'Incident Remediation'
          : item.operationType === 'cost'
          ? 'Cost Optimization'
          : 'Pre-Flight Change'),
      provider: item.provider,
      riskLevel: item.riskLevel,
      decision: 'EVIDENCE_REQUESTED',
      statusLabel: 'More Evidence Requested',
      finalStatus: decision.resulting_approval_status,
      reviewer,
      timestamp,
      notes: `Requested: ${requestedEvidence}`,
      decisionReason: `Requested additional telemetry: ${requestedEvidence}`,
      evidenceReviewed: item.evidenceReviewed,
      safetyNotice: 'Item kept in queue awaiting telemetry verification.',
      operationType: item.operationType,
      technicalEvidence: item.technicalEvidence,
    };
    setApprovalHistory((prev) => [newRecord, ...prev]);

    if (item.operationType === 'network') {
      setNetworkIncident((prev) => prev.id === item.id ? { ...prev, status: 'EVIDENCE_REQUESTED' } : prev);
      setNetworkIncidents((prev) =>
        prev.map((incident) =>
          incident.id === item.id
            ? { ...incident, status: 'EVIDENCE_REQUESTED' }
            : incident
        )
      );
    } else if (item.operationType === 'cost') {
      setCostAnomaly((prev) => prev.id === item.id ? { ...prev, status: 'EVIDENCE_REQUESTED' } : prev);
      setCostAnomalies((prev) =>
        prev.map((anomaly) =>
          anomaly.id === item.id
            ? { ...anomaly, status: 'EVIDENCE_REQUESTED' }
            : anomaly
        )
      );
    } else if (item.operationType === 'change') {
      updateChangeStatus(item.id, 'EVIDENCE_REQUESTED');
    }

    showToast(
      'Evidence request securely recorded in BigQuery. The item remains under review.',
      'info'
    );
  };

  const handleReopenCase = async (item: ApprovalItem, reason: string) => {
    if (!requireReviewer()) return;
    if (reviewerSession?.role !== 'ADMIN') {
      showToast('Only an administrator can reopen a case.', 'warning');
      return;
    }

    let decision: RecordedApprovalDecision;
    try {
      decision = await reopenCase(item.id, reason);
    } catch (error) {
      handleApprovalApiError(error);
    }

    const timestamp = getFormattedTimestamp(decision.decided_ts);
    const reviewer = verifiedReviewer(decision);

    setApprovalItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'PENDING',
              reviewer,
              decisionTimestamp: timestamp,
              rejectionReason: undefined,
              requestedEvidenceNote: undefined,
            }
          : i
      )
    );

    const newRecord: ApprovalHistoryRecord = {
      id: decision.decision_id,
      approvalItemId: item.id,
      recommendationTitle: item.recommendationTitle,
      recommendationType:
        item.recommendationType ||
        (item.operationType === 'network'
          ? 'Incident Remediation'
          : item.operationType === 'cost'
          ? 'Cost Optimization'
          : 'Pre-Flight Change'),
      provider: item.provider,
      riskLevel: item.riskLevel,
      decision: 'REOPENED',
      statusLabel: 'Reopened for Re-review',
      finalStatus: decision.resulting_approval_status,
      reviewer,
      timestamp,
      notes: reason,
      decisionReason: reason,
      evidenceReviewed: item.evidenceReviewed,
      safetyNotice:
        'Case reopened by an administrator. No infrastructure change has been applied.',
      operationType: item.operationType,
      technicalEvidence: item.technicalEvidence,
    };
    setApprovalHistory((prev) => [newRecord, ...prev]);

    if (item.operationType === 'network') {
      setNetworkIncident((prev) => prev.id === item.id ? { ...prev, status: 'PENDING' } : prev);
      setNetworkIncidents((prev) =>
        prev.map((incident) =>
          incident.id === item.id ? { ...incident, status: 'PENDING' } : incident
        )
      );
    } else if (item.operationType === 'cost') {
      setCostAnomaly((prev) => prev.id === item.id ? { ...prev, status: 'PENDING' } : prev);
      setCostAnomalies((prev) =>
        prev.map((anomaly) =>
          anomaly.id === item.id ? { ...anomaly, status: 'PENDING' } : anomaly
        )
      );
    } else if (item.operationType === 'change') {
      updateChangeStatus(item.id, 'PENDING');
    }

    showToast(
      'Case reopened and returned to Pending Review. The original decision remains in the permanent history.',
      'info'
    );
  };

  const handleApprovalChange = (type: DemonstrationType, newStatus: ApprovalStatus) => {
    if (!requireReviewer()) return;

    // Find matching approval item
    const matchingItem = approvalItems.find((i) => i.operationType === type);
    if (newStatus === 'APPROVED' && matchingItem) {
      void handleApproveRecommendation(matchingItem);
    } else if (newStatus === 'REJECTED' && matchingItem) {
      void handleRejectRecommendation(matchingItem, 'Declined via case file review.');
    } else {
      showToast('Open Reviewer Approvals to record a decision for the exact case.', 'warning');
    }
  };

  const handleSelectSearchItem = (item: SearchItem) => {
    if (item.category === 'POLICY') {
      setActivePolicy(item);
      showToast(`Viewing policy: ${item.title}`, 'info');
    } else if (!hasLoadedLiveData) {
      showToast('Live case data is unavailable. Sample case files are disabled.', 'warning');
    } else if (item.targetModal) {
      setActiveModal(item.targetModal);
      showToast(`Opened case file for ${item.title}`, 'info');
    } else {
      setSearchQuery(item.title);
      showToast(`Filtered dashboard by "${item.title}"`, 'info');
    }
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedCloudProvider(null);
    setActiveNav('overview');
    showToast('Dashboard filters cleared.', 'info');
  };

  const handleSidebarNavSelect = (nav: SidebarNavId) => {
    if (nav === 'admin_users' && reviewerSession?.role !== 'ADMIN') {
      showToast('Administrator permission is required.', 'warning');
      return;
    }

    setApprovalTargetId(null);
    setActiveNav(nav);
    // Page navigation keeps the global cloud scope, but clears global text/category search.
    setSearchQuery('');
    setSelectedCategory('ALL');
  };

  const openApprovalItem = (itemId: string) => {
    setApprovalTargetId(itemId);
    setActiveNav('approvals');
  };

  const handleAccountAction = (
    action: 'profile' | 'preferences' | 'security'
  ) => {
    setActiveNav(action);
    setSearchQuery('');
    setSelectedCategory('ALL');
  };

  const handleSavePreferences = (preferences: UserPreferences) => {
    saveUserPreferences(preferences);
    setUserPreferences(preferences);
    setTheme(preferences.theme);
    setSelectedCloudProvider(
      preferences.defaultCloud === 'ALL' ? null : preferences.defaultCloud
    );
    showToast('Preferences saved.', 'success');
  };

  const requestSignOut = () => {
    setIsSignOutConfirmOpen(true);
  };

  const confirmSignOut = () => {
    setIsSignOutConfirmOpen(false);
    signOutReviewer();
    setReviewerSession(null);
    setViewMode('marketing');
    window.history.pushState({}, '', '/');
    showToast('Signed out.', 'info');
  };

  const isFiltered = Boolean(searchQuery || selectedCategory !== 'ALL' || selectedCloudProvider);

  if (publicPage) {
    return <PublicInformationPage page={publicPage} onHome={navigateHome} onLogin={navigateLogin} onNavigate={navigatePublic} />;
  }

  if (viewMode === 'marketing') {
    return (
      <MarketingSite
        onOpenLogin={navigateLogin}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={navigatePublic}
      />
    );
  }

  if (viewMode === 'login') {
    return (
      <LoginPage
        onBack={navigateHome}
        onNavigate={navigatePublic}
        onSignedIn={(session) => {
          setReviewerSession(session);
          setViewMode('console');
          window.history.pushState({}, '', '/console');
        }}
      />
    );
  }

  return (
    <div className="console-flat min-h-screen bg-[#FFFFFF] dark:bg-[#0F2024] text-[#18373A] dark:text-[#E4EFED] flex flex-col font-sans selection:bg-[#137D78]/25 dark:selection:bg-[#35B3AA]/25 selection:text-[#137D78] dark:selection:text-[#35B3AA] transition-colors duration-200">
      {/* 1. Header with Compact ~76px Height, Sun/Moon Theme Toggle & Reset Session */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedCloudProvider={selectedCloudProvider}
        onCloudProviderChange={setSelectedCloudProvider}
        onSelectSearchItem={handleSelectSearchItem}
        onResetSearch={handleResetSearch}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSignOut={requestSignOut}
        onOpenHelp={() => navigatePublic('support')}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* 2. Main Command Center Layout: Sidebar + Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        {/* Left Navigation Sidebar (Collapsible 220px <-> 68px) */}
        <Sidebar
          activeNav={activeNav}
          onSelectNav={handleSidebarNavSelect}
          activeIncidentsCount={activeIncidentsCount}
          costAtRisk={costAtRisk}
          proposedChangesCount={proposedChangesCount}
          awaitingApprovalCount={awaitingApprovalCount}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          isAdmin={reviewerSession?.role === 'ADMIN'}
          currentUserName={
            reviewerSession?.displayName ||
            reviewerSession?.email ||
            'Cloud Police user'
          }
          currentUserEmail={reviewerSession?.email || ''}
          currentUserRole={reviewerSession?.role || 'OPERATOR'}
          onSelectAccountAction={handleAccountAction}
          onSignOut={requestSignOut}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Body */}
        <main
          className={`flex-1 px-4 sm:px-6 py-4 sm:py-5 space-y-4 pb-20 overflow-hidden dark:bg-[#0F2024] ${
            activeNav === 'overview'
              ? 'overview-main-surface bg-[#EEF2F1]'
              : 'bg-[#FFFFFF]'
          }`}
        >
          {hasLoadedLiveData && dataConnection === 'fallback' && (
            <div
              role="status"
              className="border-b border-[#AD702F]/35 pb-3 text-sm text-[#8A541B] dark:border-[#D5A45A]/40 dark:text-[#E5BB78]"
            >
              Live refresh is temporarily unavailable. Showing the last successfully loaded
              BigQuery data.
            </div>
          )}

          {/* Active Filter Banner if filtered */}
          {hasLoadedLiveData && isFiltered && activeNav === 'overview' && (
            <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-3 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2 text-xs text-[#18373A] dark:text-[#E4EFED]">
                <span className="w-6 h-6 rounded-lg bg-[#137D78]/15 dark:bg-[#35B3AA]/15 text-[#137D78] dark:text-[#35B3AA] flex items-center justify-center shrink-0 border border-[#137D78]/30 dark:border-[#35B3AA]/30">
                  <Filter className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="font-bold text-[#18373A] dark:text-[#E4EFED]">Active Filter:</span>{' '}
                  {searchQuery && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#137D78]/15 dark:bg-[#35B3AA]/15 text-[#137D78] dark:text-[#35B3AA] font-semibold text-[11px] mr-1 border border-[#137D78]/30 dark:border-[#35B3AA]/30">
                      Query: "{searchQuery}"
                    </span>
                  )}
                  {selectedCategory !== 'ALL' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#18373A] dark:text-[#9FB5B3] font-semibold text-[11px] mr-1 border border-[#D4E4E1] dark:border-[#29484C]">
                      Category: {selectedCategory}
                    </span>
                  )}
                  {selectedCloudProvider && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#18373A] dark:text-[#9FB5B3] font-semibold text-[11px] border border-[#D4E4E1] dark:border-[#29484C]">
                      Cloud: {selectedCloudProvider}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleResetSearch}
                id="btn-clear-all-filters"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] hover:bg-[#DDF1EE] dark:hover:bg-[#1D3B41] text-[#18373A] dark:text-[#E4EFED] text-[11px] font-semibold transition-colors cursor-pointer shrink-0 border border-[#D4E4E1] dark:border-[#29484C]"
              >
                <span>Clear Filter</span>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Conditional View: Dedicated Pages or Overview Dashboard */}
          {activeNav === 'profile' && reviewerSession ? (
            <MyProfilePage session={reviewerSession} />
          ) : activeNav === 'preferences' ? (
            <PreferencesPage
              preferences={{ ...userPreferences, theme }}
              onSave={handleSavePreferences}
            />
          ) : activeNav === 'security' && reviewerSession ? (
            <SecurityPage session={reviewerSession} />
          ) : activeNav === 'admin_users' && reviewerSession?.role === 'ADMIN' ? (
            <AdminUsersPage currentUserId={reviewerSession.localId} />
          ) : !hasLoadedLiveData ? (
            <section
              aria-live="polite"
              className="mx-auto w-full max-w-2xl border-y border-[#D4E4E1] py-10 dark:border-[#29484C]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#137D78] dark:text-[#35B3AA]">
                Live BigQuery data
              </p>
              <h1 className="mt-2 text-2xl font-bold text-[#18373A] dark:text-[#E4EFED]">
                {dataConnection === 'loading'
                  ? 'Connecting to Cloud Police'
                  : 'Live data unavailable'}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5F7779] dark:text-[#B2C5C3]">
                {dataConnection === 'loading'
                  ? 'Loading the latest incidents, cost anomalies, changes and approval records.'
                  : 'The dashboard API could not be reached. No sample cases are being shown as live data.'}
              </p>
              {dataConnection === 'fallback' && (
                <button
                  type="button"
                  onClick={() => void loadLiveData()}
                  className="mt-6 border-b border-[#137D78] pb-1 text-sm font-bold text-[#137D78] transition-colors hover:text-[#0F6662] dark:border-[#35B3AA] dark:text-[#35B3AA] dark:hover:text-[#72D0B3]"
                >
                  Retry live connection
                </button>
              )}
            </section>
          ) : activeNav === 'incidents' ? (
            /* Dedicated Incidents Page (Shows only Active Incidents Summary Card) */
            <IncidentsPage
              networkIncident={scopedNetworkIncident}
              networkIncidents={scopedNetworkIncidents}
              activeIncidentsCount={activeIncidentsCount}
              globalCloudScope={selectedCloudProvider}
              onNavigateApprovals={openApprovalItem}
              onNavigateEvidence={() => setActiveNav('evidence')}
            />
          ) : activeNav === 'cost' ? (
            /* Dedicated Cost Intelligence Page (Shows only Estimated Extra Cost Summary Card) */
            <CostPage
              costAnomaly={scopedCostAnomaly}
              costAnomalies={scopedCostAnomalies}
              costAtRisk={costAtRiskFull}
              globalCloudScope={selectedCloudProvider}
              onNavigateApprovals={openApprovalItem}
              onNavigateEvidence={() => setActiveNav('evidence')}
            />
          ) : activeNav === 'changes' ? (
            /* Dedicated Change Inspector Page (Shows only Proposed Changes Summary Card) */
            <ChangesPage
              changeInspector={scopedChangeInspector}
              proposedChangesCount={proposedChangesCount}
              globalCloudScope={selectedCloudProvider}
              onNavigateApprovals={openApprovalItem}
              onNavigateEvidence={() => setActiveNav('evidence')}
            />
          ) : activeNav === 'approvals' ? (
            /* Dedicated Human Approvals Queue Page (Shows only Awaiting Approval Summary Card) */
            <ApprovalQueue
              items={scopedApprovalItems}
              history={scopedApprovalHistory}
              canReview={
                reviewerSession?.role === 'APPROVER' ||
                reviewerSession?.role === 'ADMIN'
              }
              isAdmin={reviewerSession?.role === 'ADMIN'}
              onRequireSignIn={() => setViewMode('login')}
              globalCloudScope={selectedCloudProvider}
              initialItemId={approvalTargetId}
              onApprove={handleApproveRecommendation}
              onReject={handleRejectRecommendation}
              onRequestEvidence={handleRequestMoreEvidence}
              onReopen={handleReopenCase}
              onViewCaseFile={(type) => setActiveModal(type)}
            />
          ) : activeNav === 'evidence' ? (
            /* Dedicated Cloud Governance Evidence Store Page (Shows only Read-Only Evidence Card) */
            <EvidenceStore
              networkIncidents={scopedNetworkIncidents}
              costAnomalies={scopedCostAnomalies}
              changeInspector={scopedChangeInspector}
              globalCloudScope={selectedCloudProvider}
              connectionStatus={dataConnection}
              onSelectCase={(type) => setActiveModal(type)}
            />
          ) : (
            /* Overview Dashboard: live totals and scheduled monitoring health */
            <>
              <SummaryCards
                activeIncidentsCount={activeIncidentsCount}
                costAtRisk={costAtRisk}
                proposedChangesCount={proposedChangesCount}
                awaitingApprovalCount={awaitingApprovalCount}
                onSelectDemo={(type) => {
                  const destination: SidebarNavId =
                    type === 'network'
                      ? 'incidents'
                      : type === 'cost'
                      ? 'cost'
                      : 'changes';
                  handleSidebarNavSelect(destination);
                }}
                onOpenApprovals={() => handleSidebarNavSelect('approvals')}
              />

              <MonitoringStatus
                connectionStatus={dataConnection}
                monitoring={monitoringStatus}
              />
              <OverviewDetails incidents={scopedNetworkIncidents} costs={scopedCostAnomalies}
                approvals={scopedApprovalItems} history={scopedApprovalHistory}
                refreshing={dataConnection === 'loading'} onRefresh={() => void loadLiveData()}
                onCloud={(cloud, page) => { setSelectedCloudProvider(cloud); handleSidebarNavSelect(page); }} />

            </>
          )}
        </main>
      </div>

      {/* Case Investigation Modal */}
      <DetailModal
        type={activeModal}
        networkIncident={networkIncident}
        costAnomaly={costAnomaly}
        changeInspector={changeInspector}
        onClose={() => setActiveModal(null)}
        onApprovalChange={handleApprovalChange}
      />

      {/* Policy Definition Modal */}
      <PolicyModal
        policy={activePolicy}
        onClose={() => setActivePolicy(null)}
        onOpenInvestigation={(type) => {
          setActivePolicy(null);
          setActiveModal(type);
        }}
      />

      {isSignOutConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F2024]/55 p-4 backdrop-blur-xs"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsSignOutConfirmOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-out-dialog-title"
            className="w-full max-w-sm rounded-2xl border border-[#D4E4E1] bg-white p-5 shadow-2xl dark:border-[#29484C] dark:bg-[#183238]"
          >
            <h2
              id="sign-out-dialog-title"
              className="text-lg font-bold text-[#18373A] dark:text-[#E4EFED]"
            >
              Sign out of Cloud Police?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5F7779] dark:text-[#B2C5C3]">
              You will need to sign in again to access the protected console.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setIsSignOutConfirmOpen(false)}
                className="rounded-lg border border-[#D4E4E1] bg-white px-4 py-2 text-sm font-semibold text-[#18373A] transition-colors hover:bg-[#ECF5F3] dark:border-[#29484C] dark:bg-[#13282D] dark:text-[#E4EFED] dark:hover:bg-[#1D3B41]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSignOut}
                className="rounded-lg bg-[#B3454F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#983942] dark:bg-[#C8545E] dark:hover:bg-[#DD6B73]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Floating Assistant Panel */}
      {hasLoadedLiveData && (
        <AssistantPanel
          networkIncidents={networkIncidents}
          costAnomalies={costAnomalies}
          changeInspector={changeInspector}
          connectionStatus={dataConnection}
          onNavigate={(destination) => setActiveNav(destination)}
        />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          id="toast-notification"
          className="fixed bottom-20 right-6 z-40 flex items-center gap-2.5 px-3.5 py-2.5 bg-[#FFFEFB] dark:bg-[#131826] text-[#20242A] dark:text-[#E7EAF0] rounded-xl shadow-xl border border-[#D8D1C5] dark:border-[#242C40] text-xs font-medium animate-fade-in"
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#16A085] dark:text-[#3DD68C] shrink-0" />}
          {toastMessage.type === 'warning' && <XCircle className="w-4 h-4 text-amber-600 dark:text-[#F5A623] shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-[#E2AA2F] dark:text-[#E3A63E] shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
