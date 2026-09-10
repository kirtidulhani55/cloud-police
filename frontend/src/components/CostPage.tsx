import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Activity,
  Search,
  RotateCcw,
  Database,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { CostAnomalyData } from '../types';
import { CountTabs } from './CountTabs';
import { ListPagination } from './ListPagination';
import { WorkspaceTabs } from './WorkspaceTabs';
import { getCaseReference } from '../utils/caseReference';
import {
  approvalStatusDescription,
  approvalStatusPresentation,
} from '../utils/approvalStatus';

type CostTab = 'all' | 'pending' | 'evidence' | 'approved' | 'rejected';

interface CostPageProps {
  costAnomaly: CostAnomalyData;
  costAnomalies: CostAnomalyData[];
  costAtRisk: string;
  onNavigateApprovals?: (anomalyId: string) => void;
  onNavigateEvidence?: () => void;
  globalCloudScope?: string | null;
}

export const CostPage: React.FC<CostPageProps> = ({
  costAnomaly,
  costAnomalies,
  costAtRisk,
  onNavigateApprovals,
  onNavigateEvidence,
  globalCloudScope = null,
}) => {
  // Navigation View Mode (List vs In-Page Dedicated Details)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [openAnomalyTabIds, setOpenAnomalyTabIds] = useState<string[]>([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CostTab>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // UI state
  const [savedScrollPos, setSavedScrollPos] = useState(0);
  const [rawTelemetryOpen, setRawTelemetryOpen] = useState(false);
  const [copiedTelemetry, setCopiedTelemetry] = useState(false);

  // Cost Anomalies Array
  const allAnomalies = useMemo(() => {
    const source = costAnomalies.length > 0 ? costAnomalies : [costAnomaly];

    return source.map((anomaly) => ({
      ...anomaly,
      resourceName: anomaly.resourceName || 'Affected resource',
      baselineCost: anomaly.metrics.previousDailyCost,
      currentCost: anomaly.metrics.newDailyCost,
      percentageIncrease: anomaly.metrics.percentageIncrease,
      estimatedMonthlyImpact: anomaly.metrics.monthlyExtraCost,
      detectedTime: anomaly.updatedAt
        ? new Date(anomaly.updatedAt).toLocaleString()
        : 'Latest automated scan',
    }));
  }, [costAnomaly, costAnomalies]);

  const openAnomalyTabs = useMemo(
    () =>
      openAnomalyTabIds.flatMap((anomalyId) => {
        const anomaly = allAnomalies.find((item) => item.id === anomalyId);
        return anomaly ? [anomaly] : [];
      }),
    [allAnomalies, openAnomalyTabIds]
  );

  const pendingCount = allAnomalies.filter(
    (anomaly) => anomaly.status === 'PENDING'
  ).length;
  const tabCounts: Record<CostTab, number> = {
    all: allAnomalies.length,
    pending: pendingCount,
    evidence: allAnomalies.filter(
      (item) => item.status === 'EVIDENCE_REQUESTED'
    ).length,
    approved: allAnomalies.filter((item) => item.status === 'APPROVED').length,
    rejected: allAnomalies.filter((item) => item.status === 'REJECTED').length,
  };

  // Filtered Anomalies
  const filteredAnomalies = useMemo(() => {
    return allAnomalies.filter((anom) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = anom.title.toLowerCase().includes(q);
        const matchesId = anom.id.toLowerCase().includes(q);
        const matchesReference = getCaseReference(anom.id, 'cost').toLowerCase().includes(q);
        const matchesResource = anom.resourceName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesReference && !matchesResource) {
          return false;
        }
      }

      const effectiveCloudFilter = globalCloudScope || 'ALL';
      if (effectiveCloudFilter !== 'ALL' && anom.provider !== effectiveCloudFilter) {
        return false;
      }

      if (activeTab === 'pending' && anom.status !== 'PENDING') return false;
      if (activeTab === 'evidence' && anom.status !== 'EVIDENCE_REQUESTED') return false;
      if (activeTab === 'approved' && anom.status !== 'APPROVED') return false;
      if (activeTab === 'rejected' && anom.status !== 'REJECTED') return false;

      return true;
    });
  }, [allAnomalies, searchQuery, globalCloudScope, activeTab]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || activeTab !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, globalCloudScope, activeTab, pageSize]);

  const pagedAnomalies = useMemo(
    () => filteredAnomalies.slice((page - 1) * pageSize, page * pageSize),
    [filteredAnomalies, page, pageSize]
  );

  const handleOpenDetail = (anomalyId: string) => {
    setSavedScrollPos(window.scrollY);
    setOpenAnomalyTabIds((current) =>
      current.includes(anomalyId)
        ? current
        : [...current, anomalyId].slice(-8)
    );
    setSelectedAnomalyId(anomalyId);
    setViewMode('detail');
    setRawTelemetryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setViewMode('list');
    setTimeout(() => {
      window.scrollTo({ top: savedScrollPos, behavior: 'auto' });
    }, 50);
  };

  const handleSelectAnomalyTab = (anomalyId: string) => {
    setSelectedAnomalyId(anomalyId);
    setViewMode('detail');
    setRawTelemetryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseAnomalyTab = (anomalyId: string) => {
    const closingIndex = openAnomalyTabIds.indexOf(anomalyId);
    const remainingIds = openAnomalyTabIds.filter((id) => id !== anomalyId);
    setOpenAnomalyTabIds(remainingIds);

    if (viewMode === 'detail' && selectedAnomalyId === anomalyId) {
      const nextAnomalyId =
        remainingIds[Math.min(closingIndex, remainingIds.length - 1)] || null;

      if (nextAnomalyId) {
        handleSelectAnomalyTab(nextAnomalyId);
      } else {
        setSelectedAnomalyId(null);
        handleBackToList();
      }
    }
  };

  const handleCopyTelemetry = () => {
    navigator.clipboard.writeText(
      JSON.stringify(selectedAnomaly.technicalDetails.rawTelemetry, null, 2)
    );
    setCopiedTelemetry(true);
    setTimeout(() => setCopiedTelemetry(false), 2000);
  };

  const selectedAnomaly =
    allAnomalies.find((a) => a.id === selectedAnomalyId) || allAnomalies[0];
  const selectedAnomalyStatus = approvalStatusPresentation(selectedAnomaly?.status);

  return (
    <div id="cost-page-container" className="space-y-4 animate-fade-in text-[#18373A] dark:text-[#E4EFED]">
      <WorkspaceTabs
        ariaLabel="Cost intelligence workspace"
        parentLabel="Cost Intelligence"
        parentContext={
          activeTab === 'all'
            ? 'All'
            : activeTab === 'pending'
              ? 'Pending'
              : activeTab === 'evidence'
                ? 'Evidence Requested'
                : activeTab === 'approved'
                  ? 'Approved'
                  : 'Rejected'
        }
        activeTabId={viewMode === 'detail' ? selectedAnomalyId : null}
        tabs={openAnomalyTabs.map((anomaly) => ({
          id: anomaly.id,
          label: `${getCaseReference(anomaly.id, 'cost')} · Inspect`,
          title: anomaly.title,
        }))}
        onSelectParent={handleBackToList}
        onSelectTab={handleSelectAnomalyTab}
        onCloseTab={handleCloseAnomalyTab}
      />

      {/* =========================================================================
          VIEW 1: COST ANOMALIES LIST VIEW
          ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
            <div className="flex items-start sm:items-center gap-3">
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
                  Cost Intelligence
                </h1>
                <p className="text-xs text-[#5F7779] dark:text-[#9FB5B3] mt-0.5">
                  Review unusual cloud spending and estimated financial impact.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="flat-page-summary text-xs tabular-nums">
                {costAtRisk} Estimated Impact
              </span>
            </div>
          </div>

          <div className="flat-toolbar flex flex-col xl:flex-row xl:items-center gap-2.5">
            <CountTabs
              label="Cost anomaly status"
              activeTab={activeTab}
              onChange={setActiveTab}
              tabs={[
                { id: 'all', label: 'All', count: tabCounts.all },
                { id: 'pending', label: 'Pending', count: tabCounts.pending },
                { id: 'evidence', label: 'Evidence Requested', count: tabCounts.evidence },
                { id: 'approved', label: 'Approved', count: tabCounts.approved },
                { id: 'rejected', label: 'Rejected', count: tabCounts.rejected },
              ].filter((tab) => tab.id === 'all' || tab.count > 0)}
            />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[#5F7779] dark:text-[#9FB5B3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-cost-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter this cost list by ID or resource..."
                  className="flat-search-input w-full pl-9 pr-3 py-2 text-xs text-[#18373A] dark:text-[#E4EFED] placeholder-[#5F7779] dark:placeholder-[#9FB5B3] focus:outline-none transition-colors"
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-2.5 py-2 text-xs text-[#137D78] dark:text-[#35B3AA] hover:underline font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Anomaly Cards List */}
          <div className="flat-list space-y-3">
            {filteredAnomalies.length === 0 ? (
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-8 border border-[#D4E4E1] dark:border-[#29484C] text-center space-y-3">
                <div className="text-sm font-semibold text-[#18373A] dark:text-[#E4EFED]">No Cost Anomalies Found</div>
                <p className="text-xs text-[#5F7779] dark:text-[#9FB5B3]">
                  No anomalies match the active search and filter criteria.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 bg-[#137D78] dark:bg-[#35B3AA] text-white dark:text-[#0F2024] rounded-lg text-xs font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              pagedAnomalies.map((anom) => {
                const statusPresentation = approvalStatusPresentation(anom.status);

                return (
                  <div
                    key={anom.id}
                    id={`cost-anomaly-item-${anom.id}`}
                    onClick={() => handleOpenDetail(anom.id)}
                    className="flat-list-row transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        {/* Cost title is the primary row information. */}
                        <div>
                          <h3 className="text-sm font-semibold leading-5 text-[#18373A] dark:text-[#E4EFED] group-hover:text-[#137D78] dark:group-hover:text-[#35B3AA] transition-colors">
                            {anom.title}
                          </h3>
                        </div>

                        {/* Secondary metadata mirrors the incident list. */}
                        <div className="flat-meta flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#5F7779] dark:text-[#9FB5B3] border border-[#D4E4E1] dark:border-[#29484C]">
                            {getCaseReference(anom.id, 'cost')}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#4F7FA3] dark:text-[#6D9CC0] border border-[#D4E4E1] dark:border-[#29484C]">
                            {anom.provider}
                          </span>
                          <span className="text-xs text-[#5F7779] dark:text-[#9FB5B3] tabular-nums">
                            {anom.detectedTime}
                          </span>
                          <span className="text-xs text-[#7B7468] dark:text-[#9FB5B3]">
                            {anom.metrics.monthlyExtraCost} estimated extra
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 self-end lg:self-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#D4E4E1] dark:border-[#29484C]">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPresentation.pillClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusPresentation.dotClass}`}
                            aria-hidden="true"
                          />
                          {statusPresentation.label}
                        </span>
                        <button
                          id={`btn-view-cost-${anom.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(anom.id);
                          }}
                          className="flat-text-action text-xs transition-colors cursor-pointer"
                        >
                          <span>Review Cost</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <ListPagination
            page={page}
            pageSize={pageSize}
            totalItems={filteredAnomalies.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* =========================================================================
          VIEW 2: DEDICATED IN-PAGE COST DETAILS VIEW
          ========================================================================= */}
      {viewMode === 'detail' && (
        <div className="flat-detail-view space-y-3 animate-fade-in">
          {/* Details Header */}
          <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-4 sm:p-5 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs space-y-2">
            <div className="flat-meta flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#18373A] dark:text-[#E4EFED] border border-[#D4E4E1] dark:border-[#29484C]">
                {getCaseReference(selectedAnomaly.id, 'cost')}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#4F7FA3] dark:text-[#6D9CC0] border border-[#D4E4E1] dark:border-[#29484C]">
                {selectedAnomaly.provider}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#AD702F]/10 text-[#AD702F] dark:text-[#D5A45A]">
                {selectedAnomaly.severity} Cost Risk
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
              {selectedAnomaly.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#5F7779] dark:text-[#9FB5B3] leading-relaxed">
              {selectedAnomaly.simpleSummary}
            </p>
          </div>

          {/* 2-Column Detail Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Columns: Diagnostics, Metrics, Rightsizing */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 sm:p-6 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#D4E4E1] dark:border-[#29484C] pb-3">
                  <h2 className="text-sm font-bold text-[#18373A] dark:text-[#E4EFED] uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#AD702F] dark:text-[#D5A45A]" />
                    <span>Cost Analysis & Rightsizing Plan</span>
                  </h2>
                  <span className="text-xs text-[#5F7779] dark:text-[#9FB5B3]">
                    Confidence: <strong className="text-[#18373A] dark:text-[#E4EFED] font-mono">{selectedAnomaly.confidence}</strong>
                  </span>
                </div>

                {/* 1. What Happened */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED]">
                    1. Financial Finding
                  </span>
                  <div className="text-xs text-[#18373A] dark:text-[#E4EFED] leading-relaxed bg-[#ECF5F3] dark:bg-[#13282D] p-3 rounded-lg border border-[#D4E4E1] dark:border-[#29484C]">
                    {selectedAnomaly.plainLanguage.whatHappened}
                  </div>
                </div>

                {/* 2. Breakdown Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C]">
                    <p className="text-[10px] text-[#5F7779] dark:text-[#9FB5B3] font-medium">Baseline</p>
                    <p className="text-sm font-bold font-mono text-[#18373A] dark:text-[#E4EFED] mt-0.5">{selectedAnomaly.baselineCost}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C]">
                    <p className="text-[10px] text-[#5F7779] dark:text-[#9FB5B3] font-medium">Current Spend</p>
                    <p className="text-sm font-bold font-mono text-[#AD702F] dark:text-[#D5A45A] mt-0.5">{selectedAnomaly.currentCost}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C]">
                    <p className="text-[10px] text-[#5F7779] dark:text-[#9FB5B3] font-medium">Surge Pct</p>
                    <p className="text-sm font-bold font-mono text-[#AD702F] dark:text-[#D5A45A] mt-0.5">{selectedAnomaly.percentageIncrease}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C]">
                    <p className="text-[10px] text-[#5F7779] dark:text-[#9FB5B3] font-medium">Est. Monthly</p>
                    <p className="text-sm font-bold font-mono text-[#18373A] dark:text-[#E4EFED] mt-0.5">{selectedAnomaly.estimatedMonthlyImpact}</p>
                  </div>
                </div>

                {/* 3. Root Cause */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED]">
                    2. Root Cause Analysis
                  </span>
                  <div className="text-xs text-[#18373A] dark:text-[#E4EFED] leading-relaxed bg-[#ECF5F3] dark:bg-[#13282D] p-3 rounded-lg border border-[#D4E4E1] dark:border-[#29484C]">
                    {selectedAnomaly.plainLanguage.rootCause}
                  </div>
                </div>

                {/* 4. Recommended Safe Action */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED]">
                    3. Recommended Safe Action
                  </span>
                  <div className="p-3.5 bg-[#2E8B75]/10 border border-[#2E8B75]/20 rounded-lg space-y-1.5">
                    <p className="text-xs text-[#18373A] dark:text-[#E4EFED] font-medium leading-relaxed">
                      {selectedAnomaly.plainLanguage.recommendedNextStep}
                    </p>
                    <div className="text-[11px] text-[#2E8B75] dark:text-[#48B896] flex items-center gap-1.5 font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Action is gated: human approval is required before any cost or resource change.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Column: Telemetry, BigQuery Evidence, Approval Status */}
            <div className="space-y-5">
              {/* Telemetry Signals */}
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#D4E4E1] dark:border-[#29484C] pb-2.5">
                  <span className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#137D78] dark:text-[#35B3AA]" />
                    <span>FinOps Telemetry</span>
                  </span>
                  <span className="text-[10px] font-semibold text-[#2E8B75] dark:text-[#48B896] font-mono">
                    Read-Only
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C]">
                    <div className="text-[11px] text-[#5F7779] dark:text-[#9FB5B3]">Cloud Service</div>
                    <div className="text-sm font-bold text-[#18373A] dark:text-[#E4EFED] font-mono mt-0.5">{selectedAnomaly.service || 'Cloud service'}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C]">
                    <div className="text-[11px] text-[#5F7779] dark:text-[#9FB5B3]">Affected Resource</div>
                    <div className="text-sm font-bold text-[#18373A] dark:text-[#E4EFED] font-mono mt-0.5 break-all">{selectedAnomaly.resourceName}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C]">
                    <div className="text-[11px] text-[#5F7779] dark:text-[#9FB5B3]">Linked Evidence</div>
                    <div className="text-sm font-bold text-[#2E8B75] dark:text-[#48B896] font-mono mt-0.5">{selectedAnomaly.technicalDetails.evidenceIds.length} record(s)</div>
                  </div>
                </div>
              </div>

              {/* BigQuery Evidence Store */}
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#D4E4E1] dark:border-[#29484C] pb-2.5">
                  <span className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED] flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-[#137D78] dark:text-[#35B3AA]" />
                    <span>BigQuery Evidence</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#5F7779] dark:text-[#9FB5B3]">Immutable</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-[11px] text-[#5F7779] dark:text-[#9FB5B3]">Evidence IDs:</div>
                  <div className="space-y-1">
                    {selectedAnomaly.technicalDetails.evidenceIds.map((evId) => (
                      <div
                        key={evId}
                        className="text-[11px] font-mono bg-[#ECF5F3] dark:bg-[#13282D] px-2 py-1 rounded border border-[#D4E4E1] dark:border-[#29484C] text-[#18373A] dark:text-[#E4EFED] truncate"
                      >
                        {evId}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Raw Telemetry JSON */}
                <div className="pt-1">
                  <button
                    onClick={() => setRawTelemetryOpen(!rawTelemetryOpen)}
                    className="text-xs text-[#5F7779] dark:text-[#9FB5B3] hover:text-[#18373A] dark:hover:text-[#E4EFED] flex items-center justify-between w-full p-2 bg-[#ECF5F3] dark:bg-[#13282D] rounded-lg border border-[#D4E4E1] dark:border-[#29484C] font-medium cursor-pointer"
                  >
                    <span>Raw JSON Telemetry</span>
                    {rawTelemetryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {rawTelemetryOpen && (
                    <div className="mt-2 relative animate-fade-in">
                      <pre className="p-3 bg-[#0F2024] text-[#E4EFED] rounded-lg text-[10px] font-mono overflow-x-auto max-h-48 border border-[#29484C]">
                        {JSON.stringify(selectedAnomaly.technicalDetails.rawTelemetry, null, 2)}
                      </pre>
                      <button
                        onClick={handleCopyTelemetry}
                        className="absolute top-2 right-2 p-1 bg-[#183238] hover:bg-[#1D3B41] text-[#E4EFED] rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer border border-[#29484C]"
                      >
                        {copiedTelemetry ? (
                          <>
                            <Check className="w-3 h-3 text-[#2E8B75]" />
                            <span className="text-[#2E8B75]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {onNavigateEvidence && (
                  <button
                    onClick={onNavigateEvidence}
                    className="w-full py-2 bg-[#ECF5F3] dark:bg-[#13282D] hover:bg-[#DDF1EE] dark:hover:bg-[#183238] text-[#18373A] dark:text-[#E4EFED] rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-[#D4E4E1] dark:border-[#29484C]"
                  >
                    <span>Examine Evidence Store</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Approval Status Card */}
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#D4E4E1] dark:border-[#29484C] pb-2.5">
                  <span className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED] flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#137D78] dark:text-[#35B3AA]" />
                    <span>Human Approval</span>
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono ${selectedAnomalyStatus.pillClass}`}>
                    {selectedAnomalyStatus.label}
                  </span>
                </div>

                <p className="text-xs text-[#5F7779] dark:text-[#9FB5B3] leading-relaxed">
                  {approvalStatusDescription(selectedAnomaly.status)}
                </p>

                {onNavigateApprovals && (
                  <button
                    onClick={() => onNavigateApprovals(selectedAnomaly.id)}
                    className="w-full py-2.5 bg-[#137D78] hover:bg-[#0F6965] dark:bg-[#35B3AA] dark:hover:bg-[#48C7BD] text-white dark:text-[#0F2024] rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Open Human Approval Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
