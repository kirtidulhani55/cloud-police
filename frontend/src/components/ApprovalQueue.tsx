import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ApprovalItem,
  ApprovalHistoryRecord,
  RiskLevel,
  Provider,
  ApprovalDecisionType,
} from '../types';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  Lock,
  History,
  Copy,
  AlertCircle,
  Database,
} from 'lucide-react';
import { CountTabs } from './CountTabs';
import { ListPagination } from './ListPagination';
import { getCaseReference } from '../utils/caseReference';
import { ConfirmActionDialog } from './ConfirmActionDialog';

interface ApprovalQueueProps {
  items: ApprovalItem[];
  history: ApprovalHistoryRecord[];
  canReview?: boolean;
  isAdmin?: boolean;
  onRequireSignIn?: () => void;
  onApprove: (item: ApprovalItem) => void | Promise<void>;
  onReject: (item: ApprovalItem, reason: string) => void | Promise<void>;
  onRequestEvidence: (
    item: ApprovalItem,
    requestedEvidence: string
  ) => void | Promise<void>;
  onReopen: (item: ApprovalItem, reason: string) => void | Promise<void>;
  onViewCaseFile?: (operationType: 'network' | 'cost' | 'change') => void;
  globalCloudScope?: string | null;
  initialItemId?: string | null;
}

export type QueueViewMode = 'queue_list' | 'queue_detail' | 'history_list' | 'history_detail';

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  items,
  history,
  canReview = false,
  isAdmin = false,
  onRequireSignIn,
  onApprove,
  onReject,
  onRequestEvidence,
  onReopen,
  onViewCaseFile,
  globalCloudScope = null,
  initialItemId = null,
}) => {
  const [viewMode, setViewMode] = useState<QueueViewMode>(
    initialItemId ? 'queue_detail' : 'queue_list'
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialItemId);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [openCaseTabIds, setOpenCaseTabIds] = useState<string[]>(
    initialItemId ? [initialItemId] : []
  );

  // Filters state for Queue
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<ApprovalDecisionType>('PENDING');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters state for History
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyCloudFilter, setHistoryCloudFilter] = useState<string>('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');

  // Action Panel states for Detail view
  const [activeActionPanel, setActiveActionPanel] = useState<
    'none' | 'approve' | 'reject' | 'evidence' | 'reopen'
  >('none');
  const [reopenReason, setReopenReason] = useState('');
  const [pendingConfirm, setPendingConfirm] = useState<
    'approve' | 'reject' | 'reopen' | null
  >(null);
  const [rejectionReasonPreset, setRejectionReasonPreset] = useState('');
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [evidencePreset, setEvidencePreset] = useState('');
  const [customEvidenceNote, setCustomEvidenceNote] = useState('');
  const [isSavingDecision, setIsSavingDecision] = useState(false);

  const [copiedQuery, setCopiedQuery] = useState(false);
  const [savedScrollPos, setSavedScrollPos] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const statusCounts: Record<ApprovalDecisionType, number> = {
    PENDING: items.filter((item) => item.status === 'PENDING').length,
    MORE_EVIDENCE_REQUESTED: items.filter(
      (item) => item.status === 'MORE_EVIDENCE_REQUESTED'
    ).length,
    APPROVED_FOR_PLANNING: items.filter(
      (item) => item.status === 'APPROVED_FOR_PLANNING'
    ).length,
    REJECTED: items.filter((item) => item.status === 'REJECTED').length,
  };

  const statusTabLabels: Record<ApprovalDecisionType, string> = {
    PENDING: 'Pending',
    MORE_EVIDENCE_REQUESTED: 'Evidence Requested',
    APPROVED_FOR_PLANNING: 'Approved',
    REJECTED: 'Rejected',
  };

  const statusTabs: ApprovalDecisionType[] = [
    'PENDING',
    'MORE_EVIDENCE_REQUESTED',
    'APPROVED_FOR_PLANNING',
    'REJECTED',
  ];

  const getDisplayReference = (item: ApprovalItem) =>
    getCaseReference(item.id, item.operationType);

  const getItemActionLabel = (status: ApprovalDecisionType) => {
    if (status === 'MORE_EVIDENCE_REQUESTED') return 'Review Evidence';
    if (status === 'APPROVED_FOR_PLANNING') return 'View Approval';
    if (status === 'REJECTED') return 'View Rejection';
    return canReview ? 'Review & Decide' : 'Review (Read Only)';
  };

  const getStatusBorderClass = (status: ApprovalDecisionType) => {
    if (status === 'MORE_EVIDENCE_REQUESTED') {
      return 'border-l-[#AD702F] dark:border-l-[#D5A45A]';
    }
    if (status === 'APPROVED_FOR_PLANNING') {
      return 'border-l-[#2E8B75] dark:border-l-[#48B896]';
    }
    if (status === 'REJECTED') {
      return 'border-l-[#C8545E] dark:border-l-[#DD6B73]';
    }
    return 'border-l-[#4F7FA3] dark:border-l-[#6D9CC0]';
  };

  const riskPriority: Record<string, number> = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
    SAFE: 5,
  };

  const filteredQueueItems = useMemo(() => {
    return items
      .filter((item) => {
        if (item.status !== statusFilter) return false;
        const effectiveCloudFilter = globalCloudScope || 'ALL';
        if (effectiveCloudFilter !== 'ALL' && item.provider !== effectiveCloudFilter) return false;
        if (riskFilter !== 'ALL' && item.riskLevel !== riskFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const displayReference = getDisplayReference(item).toLowerCase();
          const matchTitle = item.recommendationTitle.toLowerCase().includes(q);
          const matchId = item.id.toLowerCase().includes(q);
          const matchReference = displayReference.includes(q);
          const matchProvider = item.provider.toLowerCase().includes(q);
          const matchImpact = item.businessImpact.toLowerCase().includes(q);
          const matchStatus = statusTabLabels[item.status].toLowerCase().includes(q);
          if (!matchTitle && !matchId && !matchReference && !matchProvider && !matchImpact && !matchStatus)
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priorityA = riskPriority[a.riskLevel] || 99;
        const priorityB = riskPriority[b.riskLevel] || 99;
        return priorityA - priorityB;
      });
  }, [items, globalCloudScope, riskFilter, statusFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery, globalCloudScope, riskFilter, pageSize]);

  const pagedQueueItems = useMemo(
    () => filteredQueueItems.slice((page - 1) * pageSize, page * pageSize),
    [filteredQueueItems, page, pageSize]
  );

  const filteredHistoryItems = useMemo(() => {
    return history.filter((record) => {
      if (historyCloudFilter !== 'ALL' && record.provider !== historyCloudFilter) return false;
      if (historyStatusFilter !== 'ALL' && record.decision !== historyStatusFilter) return false;
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase();
        const matchTitle = record.recommendationTitle.toLowerCase().includes(q);
        const matchId = record.approvalItemId.toLowerCase().includes(q);
        const matchReviewer = record.reviewer.toLowerCase().includes(q);
        const matchProvider = record.provider.toLowerCase().includes(q);
        const matchStatus = `${record.decision} ${record.statusLabel}`.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchReviewer && !matchProvider && !matchStatus) return false;
      }
      return true;
    });
  }, [history, historyCloudFilter, historyStatusFilter, historySearchQuery]);

  const currentSelectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return items.find((i) => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  const currentRecordedDecision = useMemo(() => {
    if (!selectedItemId) return null;
    return history.find((record) => record.approvalItemId === selectedItemId) || null;
  }, [history, selectedItemId]);

  const currentSelectedHistory = useMemo(() => {
    if (!selectedHistoryId) return null;
    return history.find((h) => h.id === selectedHistoryId) || null;
  }, [history, selectedHistoryId]);

  const openCaseTabs = useMemo(
    () =>
      openCaseTabIds
        .map((itemId) => items.find((item) => item.id === itemId))
        .filter((item): item is ApprovalItem => Boolean(item)),
    [items, openCaseTabIds]
  );

  const handleOpenDetail = (item: ApprovalItem) => {
    setSavedScrollPos(window.scrollY);
    setOpenCaseTabIds((current) => {
      if (current.includes(item.id)) return current;
      return [...current, item.id].slice(-8);
    });
    setSelectedItemId(item.id);
    setActiveActionPanel('none');
    setViewMode('queue_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToQueue = () => {
    setViewMode('queue_list');
    setSelectedItemId(null);
    setActiveActionPanel('none');
    setTimeout(() => {
      window.scrollTo({ top: savedScrollPos, behavior: 'auto' });
    }, 50);
  };

  const handleSelectCaseTab = (itemId: string) => {
    setSelectedItemId(itemId);
    setActiveActionPanel('none');
    setViewMode('queue_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseCaseTab = (
    event: React.MouseEvent<HTMLButtonElement>,
    itemId: string
  ) => {
    event.stopPropagation();
    const remainingTabIds = openCaseTabIds.filter((id) => id !== itemId);
    setOpenCaseTabIds(remainingTabIds);

    if (selectedItemId !== itemId) return;

    const nextItemId = remainingTabIds.at(-1);
    if (nextItemId) {
      handleSelectCaseTab(nextItemId);
      return;
    }

    handleBackToQueue();
  };

  const handleOpenHistoryDetail = (record: ApprovalHistoryRecord) => {
    setSavedScrollPos(window.scrollY);
    setSelectedHistoryId(record.id);
    setViewMode('history_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHistory = () => {
    setViewMode('history_list');
    setSelectedHistoryId(null);
    setTimeout(() => {
      window.scrollTo({ top: savedScrollPos, behavior: 'auto' });
    }, 50);
  };

  const handleExecuteApprove = async () => {
    if (!canReview) {
      onRequireSignIn?.();
      return;
    }
    if (currentSelectedItem) {
      setIsSavingDecision(true);
      try {
        await onApprove(currentSelectedItem);
        setActiveActionPanel('none');
        setPendingConfirm(null);
      } catch {
        // The application displays the API error and keeps this panel open.
      } finally {
        setIsSavingDecision(false);
      }
    }
  };

  const handleExecuteReject = async () => {
    if (!canReview) {
      onRequireSignIn?.();
      return;
    }
    if (currentSelectedItem) {
      const finalReason =
        customRejectionReason.trim() ||
        rejectionReasonPreset.trim() ||
        'Declined by Human Operator during engineering governance review.';
      setIsSavingDecision(true);
      try {
        await onReject(currentSelectedItem, finalReason);
        setActiveActionPanel('none');
        setRejectionReasonPreset('');
        setCustomRejectionReason('');
        setPendingConfirm(null);
      } catch {
        // The application displays the API error and keeps this panel open.
      } finally {
        setIsSavingDecision(false);
      }
    }
  };

  const handleExecuteRequestEvidence = async () => {
    if (!canReview) {
      onRequireSignIn?.();
      return;
    }
    if (currentSelectedItem) {
      const finalEvidence =
        customEvidenceNote.trim() ||
        evidencePreset.trim() ||
        'Additional BigQuery telemetry logs required for validation.';
      setIsSavingDecision(true);
      try {
        await onRequestEvidence(currentSelectedItem, finalEvidence);
        setActiveActionPanel('none');
        setEvidencePreset('');
        setCustomEvidenceNote('');
      } catch {
        // The application displays the API error and keeps this panel open.
      } finally {
        setIsSavingDecision(false);
      }
    }
  };

  const handleExecuteReopen = async () => {
    if (!isAdmin) {
      onRequireSignIn?.();
      return;
    }
    if (currentSelectedItem) {
      const finalReason =
        reopenReason.trim() ||
        'Reopened by an administrator for re-review.';
      setIsSavingDecision(true);
      try {
        await onReopen(currentSelectedItem, finalReason);
        setActiveActionPanel('none');
        setReopenReason('');
        setPendingConfirm(null);
      } catch {
        // The application displays the API error and keeps this panel open.
      } finally {
        setIsSavingDecision(false);
      }
    }
  };

  // The Approve/Reject/Reopen buttons open this confirmation modal rather
  // than acting immediately; the modal's own confirm button is what
  // actually triggers the corresponding handleExecute* call above.
  const handleConfirmPendingAction = () => {
    if (pendingConfirm === 'approve') {
      void handleExecuteApprove();
      return;
    }
    if (pendingConfirm === 'reject') {
      void handleExecuteReject();
      return;
    }
    if (pendingConfirm === 'reopen') {
      void handleExecuteReopen();
    }
  };

  const handleCopyQuery = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'CRITICAL':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#C8545E]/10 text-[#B3454F] dark:text-[#F08A91]">
            Critical Risk
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#AD702F]/10 text-[#925D25] dark:text-[#E4B76C]">
            High Risk
          </span>
        );
      case 'LOW':
      case 'SAFE':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#2E8B75]/10 text-[#257361] dark:text-[#65C9AA]">
            Low Risk
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#ECF5F3] dark:bg-[#13282D] text-[#4F6769] dark:text-[#B5C7C5]">
            Medium Risk
          </span>
        );
    }
  };

  const getStatusBadge = (status: ApprovalDecisionType) => {
    switch (status) {
      case 'APPROVED_FOR_PLANNING':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#DDF1EE] text-[#1F6B59] dark:bg-[#48B896]/15 dark:text-[#72D7B7] flex items-center gap-1.5 border border-[#2E8B75]/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved for Planning
          </span>
        );
      case 'REJECTED':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FCEBEC] text-[#A43B45] dark:bg-[#DD6B73]/15 dark:text-[#F08A91] flex items-center gap-1.5 border border-[#C8545E]/20">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'MORE_EVIDENCE_REQUESTED':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FFF3E3] text-[#8A561F] dark:bg-[#D5A45A]/15 dark:text-[#E4B76C] flex items-center gap-1.5 border border-[#AD702F]/20">
            <HelpCircle className="w-3.5 h-3.5" />
            Evidence Requested
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FFF3E3] text-[#8A561F] dark:bg-[#D5A45A]/15 dark:text-[#E4B76C] flex items-center gap-1.5 border border-[#AD702F]/25">
            <Clock className="w-3.5 h-3.5" />
            Awaiting Review
          </span>
        );
    }
  };

  const getHistoryStatusBadge = (decision: ApprovalHistoryRecord['decision']) => {
    if (decision === 'APPROVED') {
      return (
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#DDF1EE] text-[#1F6B59] dark:bg-[#48B896]/15 dark:text-[#72D7B7] flex items-center gap-1.5 border border-[#2E8B75]/20">
          <CheckCircle2 className="w-4 h-4" />
          Approved for Planning
        </span>
      );
    }

    if (decision === 'REJECTED') {
      return (
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#FCEBEC] text-[#A43B45] dark:bg-[#DD6B73]/15 dark:text-[#F08A91] flex items-center gap-1.5 border border-[#C8545E]/20">
          <XCircle className="w-4 h-4" />
          Rejected
        </span>
      );
    }

    if (decision === 'REOPENED') {
      return (
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#FFF3E3] text-[#8A561F] dark:bg-[#D5A45A]/15 dark:text-[#E4B76C] flex items-center gap-1.5 border border-[#AD702F]/20">
          <History className="w-4 h-4" />
          Reopened by Admin
        </span>
      );
    }

    return (
      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#FFF3E3] text-[#8A561F] dark:bg-[#D5A45A]/15 dark:text-[#E4B76C] flex items-center gap-1.5 border border-[#AD702F]/20">
        <HelpCircle className="w-4 h-4" />
        Evidence Requested
      </span>
    );
  };

  const getHistoryButtonLabel = (decision: ApprovalHistoryRecord['decision']) => {
    if (decision === 'APPROVED') return 'View Approved Decision';
    if (decision === 'REJECTED') return 'View Rejection';
    if (decision === 'REOPENED') return 'View Reopen Record';
    return 'View Evidence Request';
  };

  return (
    <div ref={containerRef} id="human-approval-system-view" className="space-y-4 text-[#18373A] dark:text-[#E4EFED]">
      {openCaseTabs.length > 0 &&
        (viewMode === 'queue_list' || viewMode === 'queue_detail') && (
        <div
          role="tablist"
          aria-label="Reviewer approval workspace"
          className="-mx-4 flex min-h-10 items-end gap-1.5 overflow-x-auto border-b border-[#C9DAD7] bg-[#ECF5F3] px-4 pt-1 dark:border-[#29484C] dark:bg-[#13282D] sm:-mx-6 sm:px-6"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'queue_list'}
            onClick={handleBackToQueue}
            className={`-mb-px flex h-9 shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 px-3 text-xs font-semibold transition-colors ${
              viewMode === 'queue_list'
                ? 'border-[#B8D0CC] bg-white text-[#137D78] shadow-[inset_0_2px_0_#137D78] dark:border-[#3A5B5F] dark:bg-[#183238] dark:text-[#35B3AA]'
                : 'border-[#D4E4E1] bg-[#E3EEEC] text-[#5F7779] hover:bg-white hover:text-[#18373A] dark:border-[#29484C] dark:bg-[#173036] dark:text-[#B2C5C3] dark:hover:bg-[#183238] dark:hover:text-[#E4EFED]'
            }`}
          >
            <span>Reviewer Approvals</span>
            <span aria-hidden="true" className="text-[#91A5A4]">
              ›
            </span>
            <span>{statusTabLabels[statusFilter]}</span>
          </button>

          {openCaseTabs.map((item) => {
            const isActive =
              viewMode === 'queue_detail' && selectedItemId === item.id;

            return (
              <div
                key={item.id}
                role="tab"
                aria-selected={isActive}
                className={`-mb-px flex h-9 shrink-0 items-center rounded-t-lg border border-b-0 transition-colors ${
                  isActive
                    ? 'border-[#B8D0CC] bg-white text-[#137D78] shadow-[inset_0_2px_0_#137D78] dark:border-[#3A5B5F] dark:bg-[#183238] dark:text-[#35B3AA]'
                    : 'border-[#D4E4E1] bg-[#E3EEEC] text-[#5F7779] hover:bg-white hover:text-[#18373A] dark:border-[#29484C] dark:bg-[#173036] dark:text-[#B2C5C3] dark:hover:bg-[#183238] dark:hover:text-[#E4EFED]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectCaseTab(item.id)}
                  className="h-full max-w-[240px] truncate pl-3 pr-1 text-left text-xs font-semibold"
                  title={`${getDisplayReference(item)} · ${getItemActionLabel(item.status)}`}
                >
                  {getDisplayReference(item)} · {getItemActionLabel(item.status)}
                </button>
                <button
                  type="button"
                  onClick={(event) => handleCloseCaseTab(event, item.id)}
                  className="mr-1.5 ml-0.5 flex h-6 w-6 items-center justify-center rounded-md text-[19px] font-semibold leading-none text-[#4F6769] transition-colors hover:bg-[#DDEBE8] hover:text-[#B3454F] dark:text-[#B2C5C3] dark:hover:bg-[#29484C] dark:hover:text-[#F08A91]"
                  aria-label={`Close ${getDisplayReference(item)} tab`}
                  title="Close tab"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            );
          })}
        </div>
        )}

      {/* =========================================================================
          VIEW 1: APPROVAL QUEUE LIST
          ========================================================================= */}
      {viewMode === 'queue_list' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
            <div className="flex items-start sm:items-center gap-3">
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
                  Reviewer Approvals
                </h1>
                <p className="text-xs text-[#5F7779] dark:text-[#9FB5B3] mt-0.5">
                  Review, approve, or reject proposed cloud infrastructure actions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="flat-page-summary text-xs tabular-nums">
                {statusCounts[statusFilter]} {statusTabLabels[statusFilter]}
              </span>
            </div>
          </div>

          <div className="flat-toolbar flex flex-col xl:flex-row xl:items-center gap-2.5">
            <CountTabs
              label="Approval status"
              activeTab={statusFilter}
              onChange={(status) => {
                setStatusFilter(status);
                setSearchQuery('');
              }}
              tabs={statusTabs.map((status) => ({
                id: status,
                label: statusTabLabels[status],
                count: statusCounts[status],
              }))}
            />

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[#5F7779] dark:text-[#9FB5B3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter approvals by ID, resource, or status..."
                  className="flat-search-input w-full pl-9 pr-3 py-2 text-xs text-[#18373A] dark:text-[#E4EFED] placeholder-[#5F7779] dark:placeholder-[#9FB5B3] focus:outline-none transition-colors"
                />
              </div>

                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C] text-[#18373A] dark:text-[#E4EFED] text-xs font-medium px-2.5 py-2 rounded-lg focus:outline-none cursor-pointer shrink-0"
                >
                  <option value="ALL">All Risks</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="LOW">Low</option>
                </select>

            </div>
          </div>

          {/* Queue Items List */}
          <div className="flat-list space-y-3">
            {filteredQueueItems.length === 0 ? (
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-8 border border-[#D4E4E1] dark:border-[#29484C] text-center space-y-2">
                <div className="text-base font-semibold text-[#18373A] dark:text-[#E4EFED]">
                  No {statusTabLabels[statusFilter].toLowerCase()} items found
                </div>
                <p className="text-sm text-[#5F7779] dark:text-[#9FB5B3]">
                  Try a different search, global cloud scope, or risk filter.
                </p>
              </div>
            ) : (
              pagedQueueItems.map((item) => (
                <div
                  key={item.id}
                  id={`approval-item-${item.id}`}
                  onClick={() => handleOpenDetail(item)}
                  className={`flat-list-row transition-all cursor-pointer group ${getStatusBorderClass(
                    item.status
                  )}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Recommendation title is the primary row information. */}
                      <div>
                        <h3 className="text-sm font-semibold leading-5 text-[#18373A] dark:text-[#E4EFED] group-hover:text-[#137D78] dark:group-hover:text-[#35B3AA] transition-colors">
                          {item.recommendationTitle}
                        </h3>
                      </div>

                      {/* Keep risk visible because it is decision-relevant. */}
                      <div className="flat-meta flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#5F7779] dark:text-[#9FB5B3] border border-[#D4E4E1] dark:border-[#29484C]">
                          {getDisplayReference(item)}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#4F7FA3] dark:text-[#8DB3D0] border border-[#D4E4E1] dark:border-[#29484C]">
                          {item.provider}
                        </span>
                        {getRiskBadge(item.riskLevel)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 self-end lg:self-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#D4E4E1] dark:border-[#29484C]">
                      {getStatusBadge(item.status)}
                      <button
                        id={`btn-review-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item);
                        }}
                        className="flat-text-action text-xs transition-colors cursor-pointer"
                      >
                        <span>{getItemActionLabel(item.status)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <ListPagination
            page={page}
            pageSize={pageSize}
            totalItems={filteredQueueItems.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* =========================================================================
          VIEW 2: DEDICATED IN-PAGE APPROVAL DETAIL VIEW
          ========================================================================= */}
      {viewMode === 'queue_detail' && currentSelectedItem && (
        <div className="flat-detail-view space-y-3 animate-fade-in">
          {/* Details Header */}
          <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-4 sm:p-5 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs space-y-2">
            <div className="flat-meta flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#18373A] dark:text-[#E4EFED] border border-[#D4E4E1] dark:border-[#29484C]">
                {getDisplayReference(currentSelectedItem)}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#4F7FA3] dark:text-[#6D9CC0] border border-[#D4E4E1] dark:border-[#29484C]">
                {currentSelectedItem.provider}
              </span>
              {getRiskBadge(currentSelectedItem.riskLevel)}
              {getStatusBadge(currentSelectedItem.status)}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
              {currentSelectedItem.recommendationTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#5F7779] dark:text-[#9FB5B3] leading-relaxed">
              {currentSelectedItem.businessImpact}
            </p>
          </div>

          {/* 2-Column Detail Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Columns: Explanation, Action Plan, Blast Radius, BigQuery Query */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 sm:p-6 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#D4E4E1] dark:border-[#29484C] pb-3">
                  <h2 className="text-sm font-bold text-[#18373A] dark:text-[#E4EFED] uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#137D78] dark:text-[#35B3AA]" />
                    <span>Decision Package & Verification</span>
                  </h2>
                  <span className="text-xs text-[#5F7779] dark:text-[#9FB5B3]">
                    Confidence: <strong className="text-[#18373A] dark:text-[#E4EFED] font-mono">{currentSelectedItem.confidenceScore || 'Not reported'}</strong>
                  </span>
                </div>

                {/* 1. Proposed Action */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED]">
                    1. Proposed Remediation Action
                  </span>
                  <div className="text-xs text-[#18373A] dark:text-[#E4EFED] leading-relaxed bg-[#ECF5F3] dark:bg-[#13282D] p-3 rounded-lg border border-[#D4E4E1] dark:border-[#29484C]">
                    {currentSelectedItem.proposedAction}
                  </div>
                </div>

                {/* 2. Blast Radius */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED]">
                    2. Blast Radius & Affected Scope
                  </span>
                  <div className="text-xs text-[#18373A] dark:text-[#E4EFED] leading-relaxed bg-[#ECF5F3] dark:bg-[#13282D] p-3 rounded-lg border border-[#D4E4E1] dark:border-[#29484C]">
                    {currentSelectedItem.blastRadius || currentSelectedItem.businessImpact}
                  </div>
                </div>

                {/* 3. Safety Guardrails */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED]">
                    3. Cloud Police Safety Guardrails
                  </span>
                  <div className="p-3.5 bg-[#2E8B75]/10 border border-[#2E8B75]/20 rounded-lg space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-[#2E8B75] dark:text-[#48B896] font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Zero autonomous destructive execution</span>
                    </div>
                    <p className="text-[#18373A] dark:text-[#E4EFED] mt-1">
                      No cloud configuration change or Terraform apply operation is executed without explicit human authorization.
                    </p>
                  </div>
                </div>

                {/* 4. BigQuery Evidence Query */}
                {currentSelectedItem.evidenceQuery && (
                  <div className="space-y-1.5 pt-2 border-t border-[#D4E4E1] dark:border-[#29484C]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED] flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-[#137D78] dark:text-[#35B3AA]" />
                        <span>Audit BigQuery Query</span>
                      </span>
                      <button
                        onClick={() => handleCopyQuery(currentSelectedItem.evidenceQuery || '')}
                        className="text-xs text-[#137D78] dark:text-[#35B3AA] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        {copiedQuery ? <Check className="w-3 h-3 text-[#2E8B75]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedQuery ? 'Copied' : 'Copy Query'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-[#0F2024] text-[#E4EFED] rounded-lg text-[10px] font-mono overflow-x-auto border border-[#29484C]">
                      {currentSelectedItem.evidenceQuery}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Column: Human Action Controls */}
            <div className="space-y-5">
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs space-y-4">
                <div className="border-b border-[#D4E4E1] dark:border-[#29484C] pb-2.5">
                  <h3 className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED] uppercase tracking-wider">
                    Reviewer Decision
                  </h3>
                </div>

                {currentSelectedItem.status === 'PENDING' || currentSelectedItem.status === 'MORE_EVIDENCE_REQUESTED' ? (
                  <div className="space-y-3">
                    {!canReview && (
                      <div className="rounded-lg border border-[#D4E4E1] bg-[#ECF5F3] px-3 py-2.5 text-xs text-[#5F7779] dark:border-[#29484C] dark:bg-[#13282D] dark:text-[#9FB5B3]">
                        <div className="flex items-center gap-2 font-semibold text-[#18373A] dark:text-[#E4EFED]">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Approver permission required</span>
                        </div>
                        <p className="mt-1 leading-relaxed">
                          You can inspect this case, but only an Approver or Admin can record a decision.
                        </p>
                      </div>
                    )}

                    {activeActionPanel === 'none' && (
                      <div className="space-y-2">
                        <button
                          id="btn-action-approve"
                          type="button"
                          onClick={() => setActiveActionPanel('approve')}
                          disabled={!canReview}
                          title={!canReview ? 'Approver permission required' : undefined}
                          className="w-full py-3 bg-[#2E8B75] hover:bg-[#257361] text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#2E8B75]"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve for Planning</span>
                        </button>

                        {currentSelectedItem.status === 'PENDING' && (
                          <button
                            id="btn-action-evidence"
                            type="button"
                            onClick={() => setActiveActionPanel('evidence')}
                            disabled={!canReview}
                            title={!canReview ? 'Approver permission required' : undefined}
                            className="w-full py-3 bg-[#FFF3E3] dark:bg-[#D5A45A]/10 hover:bg-[#FBE6C9] text-[#7D4C18] dark:text-[#E4B76C] rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-[#AD702F]/25 cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#FFF3E3]"
                          >
                            <HelpCircle className="w-4 h-4 text-[#AD702F] dark:text-[#D5A45A]" />
                            <span>Request More Evidence</span>
                          </button>
                        )}

                        {currentSelectedItem.status === 'MORE_EVIDENCE_REQUESTED' && (
                          <div className="rounded-lg border border-[#AD702F]/25 bg-[#FFF3E3] px-4 py-3 text-sm text-[#7D4C18] dark:bg-[#D5A45A]/10 dark:text-[#E4B76C]">
                            <p className="font-bold">More evidence has already been requested.</p>
                            <p className="mt-1 text-xs leading-relaxed">
                              Review the requested evidence before approving or rejecting.
                            </p>
                            <dl className="mt-3 space-y-2 border-t border-[#AD702F]/20 pt-3 text-xs">
                              <div>
                                <dt className="font-semibold">Requested by</dt>
                                <dd className="mt-0.5 break-words">
                                  {currentSelectedItem.reviewer ||
                                    currentRecordedDecision?.reviewer ||
                                    'Verified reviewer'}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-semibold">Requested on</dt>
                                <dd className="mt-0.5">
                                  {currentSelectedItem.decisionTimestamp ||
                                    currentRecordedDecision?.timestamp ||
                                    'Loading saved timestamp…'}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-semibold">Reason</dt>
                                <dd className="mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
                                  {currentSelectedItem.requestedEvidenceNote ||
                                    currentRecordedDecision?.decisionReason ||
                                    currentRecordedDecision?.notes ||
                                    'Loading saved reason…'}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        )}

                        <button
                          id="btn-action-reject"
                          type="button"
                          onClick={() => setActiveActionPanel('reject')}
                          disabled={!canReview}
                          title={!canReview ? 'Approver permission required' : undefined}
                          className="w-full py-3 bg-[#FFFFFF] dark:bg-[#183238] hover:bg-[#FCEBEC] dark:hover:bg-[#DD6B73]/10 text-[#B3454F] dark:text-[#F08A91] rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-[#C8545E]/35 cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#FFFFFF]"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Proposal</span>
                        </button>
                      </div>
                    )}

                    {/* Approve Confirm Form */}
                    {activeActionPanel === 'approve' && (
                      <div className="p-3.5 bg-[#ECF5F3] dark:bg-[#13282D] rounded-xl border border-[#D4E4E1] dark:border-[#29484C] space-y-3 animate-fade-in">
                        <p className="text-xs text-[#18373A] dark:text-[#E4EFED] font-medium">
                          Confirm authorization to draft and stage Terraform plan changes for this recommendation?
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPendingConfirm('approve')}
                            disabled={isSavingDecision}
                            className="flex-1 py-2 bg-[#2E8B75] hover:bg-[#257361] text-white rounded-lg text-xs font-semibold cursor-pointer disabled:cursor-wait disabled:opacity-60"
                          >
                            {isSavingDecision ? 'Saving…' : 'Confirm Approve'}
                          </button>
                          <button
                            onClick={() => setActiveActionPanel('none')}
                            className="px-3 py-2 bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] text-xs font-medium rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Request Evidence Form */}
                    {activeActionPanel === 'evidence' && (
                      <div className="p-3.5 bg-[#ECF5F3] dark:bg-[#13282D] rounded-xl border border-[#D4E4E1] dark:border-[#29484C] space-y-3 animate-fade-in">
                        <p className="text-xs text-[#18373A] dark:text-[#E4EFED] font-medium">
                          Select telemetry requirements before deciding:
                        </p>
                        <input
                          type="text"
                          value={customEvidenceNote}
                          onChange={(e) => setCustomEvidenceNote(e.target.value)}
                          placeholder="e.g. Need VPC flow logs for last 48h..."
                          className="w-full p-2 bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] rounded-lg text-xs focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleExecuteRequestEvidence}
                            disabled={isSavingDecision}
                            className="flex-1 py-2 bg-[#AD702F] hover:bg-[#925D25] text-white rounded-lg text-xs font-semibold cursor-pointer disabled:cursor-wait disabled:opacity-60"
                          >
                            {isSavingDecision ? 'Saving…' : 'Submit Request'}
                          </button>
                          <button
                            onClick={() => setActiveActionPanel('none')}
                            className="px-3 py-2 bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] text-xs font-medium rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reject Form */}
                    {activeActionPanel === 'reject' && (
                      <div className="p-3.5 bg-[#ECF5F3] dark:bg-[#13282D] rounded-xl border border-[#D4E4E1] dark:border-[#29484C] space-y-3 animate-fade-in">
                        <p className="text-xs text-[#18373A] dark:text-[#E4EFED] font-medium">
                          Reason for declining this recommendation:
                        </p>
                        <input
                          type="text"
                          value={customRejectionReason}
                          onChange={(e) => setCustomRejectionReason(e.target.value)}
                          placeholder="e.g. Change scheduled in upcoming maintenance window..."
                          className="w-full p-2 bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] rounded-lg text-xs focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPendingConfirm('reject')}
                            disabled={isSavingDecision}
                            className="flex-1 py-2 bg-[#C8545E] hover:bg-[#B3454F] text-white rounded-lg text-xs font-semibold cursor-pointer disabled:cursor-wait disabled:opacity-60"
                          >
                            {isSavingDecision ? 'Saving…' : 'Confirm Decline'}
                          </button>
                          <button
                            onClick={() => setActiveActionPanel('none')}
                            className="px-3 py-2 bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] text-xs font-medium rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C] space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2E8B75]" />
                      <span className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED]">
                        {currentSelectedItem.status === 'APPROVED_FOR_PLANNING'
                          ? 'Decision Approved'
                          : 'Decision Rejected'}
                      </span>
                    </div>
                    <dl className="space-y-1.5 pt-1 text-xs">
                      <div>
                        <dt className="inline font-semibold text-[#18373A] dark:text-[#E4EFED]">Status: </dt>
                        <dd className="inline text-[#5F7779] dark:text-[#9FB5B3]">
                          {currentSelectedItem.status === 'APPROVED_FOR_PLANNING'
                            ? 'Approved for Planning'
                            : 'Rejected'}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-[#18373A] dark:text-[#E4EFED]">
                          {currentSelectedItem.status === 'APPROVED_FOR_PLANNING' ? 'Approved by: ' : 'Rejected by: '}
                        </dt>
                        <dd className="inline text-[#5F7779] dark:text-[#9FB5B3]">
                          {currentSelectedItem.reviewer || currentRecordedDecision?.reviewer || 'Verified reviewer'}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-[#18373A] dark:text-[#E4EFED]">
                          {currentSelectedItem.status === 'APPROVED_FOR_PLANNING' ? 'Approved on: ' : 'Rejected on: '}
                        </dt>
                        <dd className="inline text-[#5F7779] dark:text-[#9FB5B3]">
                          {currentSelectedItem.decisionTimestamp || currentRecordedDecision?.timestamp || 'Timestamp unavailable'}
                        </dd>
                      </div>
                      <div className="pt-1">
                        <dt className="block font-semibold text-[#18373A] dark:text-[#E4EFED]">
                          Decision reason
                        </dt>
                        <dd className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-[#5F7779] dark:text-[#9FB5B3]">
                          {currentRecordedDecision?.decisionReason ||
                            currentRecordedDecision?.notes ||
                            currentSelectedItem.rejectionReason ||
                            'Loading saved reason…'}
                        </dd>
                      </div>
                    </dl>
                    <p className="pt-1 text-xs text-[#5F7779] dark:text-[#9FB5B3]">
                      Securely recorded by the approval service.
                    </p>

                    {isAdmin && activeActionPanel !== 'reopen' && (
                      <div className="pt-3 border-t border-[#D4E4E1] dark:border-[#29484C]">
                        <button
                          id="btn-action-reopen"
                          type="button"
                          onClick={() => setActiveActionPanel('reopen')}
                          className="w-full py-2.5 bg-[#FFF3E3] dark:bg-[#D5A45A]/10 hover:bg-[#FBE6C9] text-[#7D4C18] dark:text-[#E4B76C] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-[#AD702F]/25 cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5 text-[#AD702F] dark:text-[#D5A45A]" />
                          <span>Reopen Case (Admin)</span>
                        </button>
                      </div>
                    )}

                    {isAdmin && activeActionPanel === 'reopen' && (
                      <div className="mt-3 p-3.5 bg-[#ECF5F3] dark:bg-[#13282D] rounded-xl border border-[#D4E4E1] dark:border-[#29484C] space-y-3 animate-fade-in">
                        <p className="text-xs text-[#18373A] dark:text-[#E4EFED] font-medium">
                          Reason for reopening this case:
                        </p>
                        <input
                          type="text"
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="e.g. New evidence changes the original risk assessment..."
                          className="w-full p-2 bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] rounded-lg text-xs focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPendingConfirm('reopen')}
                            disabled={isSavingDecision}
                            className="flex-1 py-2 bg-[#AD702F] hover:bg-[#925D25] text-white rounded-lg text-xs font-semibold cursor-pointer disabled:cursor-wait disabled:opacity-60"
                          >
                            {isSavingDecision ? 'Saving…' : 'Continue'}
                          </button>
                          <button
                            onClick={() => {
                              setActiveActionPanel('none');
                              setReopenReason('');
                            }}
                            className="px-3 py-2 bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] text-xs font-medium rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: DECISION HISTORY LIST
          ========================================================================= */}
      {viewMode === 'history_list' && (
        <div className="space-y-5 animate-fade-in">
          {/* Header */}
          <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 sm:p-6 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#137D78]/10 text-[#137D78] dark:text-[#35B3AA] flex items-center justify-center shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
                  Decision History
                </h1>
                <p className="text-xs sm:text-sm text-[#5F7779] dark:text-[#9FB5B3] mt-0.5">
                  Verified approvals, rejections, and evidence requests from BigQuery.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('queue_list')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#ECF5F3] dark:bg-[#13282D] text-[#18373A] dark:text-[#E4EFED] border border-[#D4E4E1] dark:border-[#29484C] hover:bg-[#DDF1EE] dark:hover:bg-[#183238] transition-colors cursor-pointer"
              >
                ← Back to Pending Queue
              </button>
            </div>
          </div>

          {/* Search and status filters */}
          <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-3 sm:p-4 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#5F7779] dark:text-[#9FB5B3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Search by case ID, resource, reviewer, provider, or status..."
                  className="w-full pl-9 pr-3 py-2.5 bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C] rounded-lg text-sm text-[#18373A] dark:text-[#E4EFED] placeholder-[#5F7779] dark:placeholder-[#9FB5B3] focus:bg-[#FFFFFF] dark:focus:bg-[#183238] focus:border-[#137D78] dark:focus:border-[#35B3AA] focus:outline-none transition-colors"
                />
              </div>

              <select
                value={historyCloudFilter}
                onChange={(e) => setHistoryCloudFilter(e.target.value)}
                className="bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C] text-[#18373A] dark:text-[#E4EFED] text-sm font-medium px-3 py-2.5 rounded-lg focus:outline-none cursor-pointer"
                aria-label="Filter decision history by cloud"
              >
                <option value="ALL">All Clouds</option>
                <option value="Azure">Azure</option>
                <option value="AWS">AWS</option>
                <option value="GCP">GCP</option>
              </select>

              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C] text-[#18373A] dark:text-[#E4EFED] text-sm font-medium px-3 py-2.5 rounded-lg focus:outline-none cursor-pointer"
                aria-label="Filter decision history by status"
              >
                <option value="ALL">All Decisions</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="EVIDENCE_REQUESTED">Evidence Requested</option>
              </select>
            </div>
          </div>

          {/* History Records List */}
          <div className="space-y-3">
            {filteredHistoryItems.length === 0 ? (
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-8 border border-[#D4E4E1] dark:border-[#29484C] text-center space-y-2">
                <div className="text-sm font-semibold text-[#18373A] dark:text-[#E4EFED]">No History Records Yet</div>
                <p className="text-xs text-[#5F7779] dark:text-[#9FB5B3]">
                  Verified decisions made through the approval service will appear here.
                </p>
              </div>
            ) : (
              filteredHistoryItems.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handleOpenHistoryDetail(rec)}
                  className={`bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 sm:p-6 border border-[#D4E4E1] dark:border-[#29484C] border-l-4 shadow-2xs hover:border-[#137D78] dark:hover:border-[#35B3AA] transition-all cursor-pointer group ${
                    rec.decision === 'APPROVED'
                      ? 'border-l-[#2E8B75] dark:border-l-[#48B896]'
                      : rec.decision === 'REJECTED'
                      ? 'border-l-[#C8545E] dark:border-l-[#DD6B73]'
                      : 'border-l-[#AD702F] dark:border-l-[#D5A45A]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getHistoryStatusBadge(rec.decision)}
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#ECF5F3] dark:bg-[#13282D] text-[#4F7FA3] dark:text-[#8DB3D0] border border-[#D4E4E1] dark:border-[#29484C]">
                          {rec.provider}
                        </span>
                        <span className="text-sm text-[#5F7779] dark:text-[#9FB5B3] tabular-nums">
                          {rec.timestamp}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-[17px] font-semibold leading-6 text-[#18373A] dark:text-[#E4EFED] group-hover:text-[#137D78] dark:group-hover:text-[#35B3AA] transition-colors">
                        {rec.recommendationTitle}
                      </h3>
                      <div className="flex items-center gap-4 flex-wrap text-sm text-[#5F7779] dark:text-[#9FB5B3]">
                        <p>
                          Reviewed by <strong className="text-[#18373A] dark:text-[#E4EFED] font-semibold">{rec.reviewer}</strong>
                        </p>
                        <p>
                          Case <span className="font-mono font-semibold text-[#18373A] dark:text-[#E4EFED]">{rec.approvalItemId}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button className="h-11 px-5 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] group-hover:bg-[#137D78] group-hover:text-white dark:group-hover:bg-[#35B3AA] dark:group-hover:text-[#0F2024] text-sm font-bold transition-colors flex items-center gap-2 border border-[#D4E4E1] dark:border-[#29484C]">
                        <span>{getHistoryButtonLabel(rec.decision)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: DEDICATED HISTORY DETAIL VIEW
          ========================================================================= */}
      {viewMode === 'history_detail' && currentSelectedHistory && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToHistory}
              className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] dark:bg-[#183238] hover:bg-[#ECF5F3] dark:hover:bg-[#13282D] text-[#18373A] dark:text-[#E4EFED] border border-[#D4E4E1] dark:border-[#29484C] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-[#5F7779] dark:text-[#9FB5B3]" />
              <span>Back to Decision History</span>
            </button>

            <span className="text-xs text-[#5F7779] dark:text-[#9FB5B3]">
              Decision record: <strong className="text-[#18373A] dark:text-[#E4EFED] font-mono">{currentSelectedHistory.id}</strong>
            </span>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 sm:p-6 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#18373A] dark:text-[#E4EFED] border border-[#D4E4E1] dark:border-[#29484C]">
                {currentSelectedHistory.id}
              </span>
              {getHistoryStatusBadge(currentSelectedHistory.decision)}
              <span className="text-sm text-[#5F7779] dark:text-[#9FB5B3] tabular-nums">
                {currentSelectedHistory.timestamp}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
              {currentSelectedHistory.recommendationTitle}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C]">
                <p className="text-xs font-medium text-[#5F7779] dark:text-[#9FB5B3]">Reviewed by</p>
                <p className="text-sm font-bold text-[#18373A] dark:text-[#E4EFED] mt-1">{currentSelectedHistory.reviewer}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C]">
                <p className="text-xs font-medium text-[#5F7779] dark:text-[#9FB5B3]">Cloud provider</p>
                <p className="text-sm font-bold text-[#18373A] dark:text-[#E4EFED] mt-1">{currentSelectedHistory.provider}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C]">
                <p className="text-xs font-medium text-[#5F7779] dark:text-[#9FB5B3]">Case ID</p>
                <p className="text-sm font-bold font-mono text-[#18373A] dark:text-[#E4EFED] mt-1 break-all">{currentSelectedHistory.approvalItemId}</p>
              </div>
            </div>

            {currentSelectedHistory.notes && (
              <div className="space-y-1 pt-2">
                <span className="text-sm font-bold text-[#18373A] dark:text-[#E4EFED]">Decision notes</span>
                <p className="text-sm leading-6 text-[#18373A] dark:text-[#E4EFED] p-4 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C]">
                  {currentSelectedHistory.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {pendingConfirm === 'approve' && (
        <ConfirmActionDialog
          title="Approve this recommendation?"
          description="This authorizes Cloud Police to draft and stage a Terraform plan for engineering review. No infrastructure change is applied automatically."
          confirmLabel="Yes, Approve"
          busyLabel="Approving…"
          isBusy={isSavingDecision}
          onConfirm={handleConfirmPendingAction}
          onCancel={() => setPendingConfirm(null)}
        />
      )}

      {pendingConfirm === 'reject' && (
        <ConfirmActionDialog
          title="Reject this recommendation?"
          description="This case will be marked as rejected and locked. Only an administrator can reopen it afterward."
          confirmLabel="Yes, Reject"
          confirmClassName="bg-[#C8545E] hover:bg-[#B3454F] dark:bg-[#C8545E] dark:hover:bg-[#B3454F]"
          busyLabel="Rejecting…"
          isBusy={isSavingDecision}
          onConfirm={handleConfirmPendingAction}
          onCancel={() => setPendingConfirm(null)}
        />
      )}

      {pendingConfirm === 'reopen' && (
        <ConfirmActionDialog
          title="Reopen this case?"
          description="The case will move back to Pending Review for a fresh decision. The original decision stays visible in the permanent history — nothing is deleted."
          confirmLabel="Yes, Reopen"
          confirmClassName="bg-[#AD702F] hover:bg-[#925D25] dark:bg-[#AD702F] dark:hover:bg-[#925D25]"
          busyLabel="Reopening…"
          isBusy={isSavingDecision}
          onConfirm={handleConfirmPendingAction}
          onCancel={() => setPendingConfirm(null)}
        />
      )}
    </div>
  );
};
