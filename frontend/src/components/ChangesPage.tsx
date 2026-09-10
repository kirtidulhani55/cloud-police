import React, { useState, useMemo, useEffect } from 'react';
import {
  FileCheck2,
  ArrowRight,
  ExternalLink,
  Search,
  RotateCcw,
  Database,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { ChangeInspectorData } from '../types';
import { CountTabs } from './CountTabs';
import { ListPagination } from './ListPagination';
import { WorkspaceTabs } from './WorkspaceTabs';
import { getCaseReference } from '../utils/caseReference';
import {
  approvalStatusDescription,
  approvalStatusPresentation,
} from '../utils/approvalStatus';

type ChangeTab = 'all' | 'high' | 'safe';

interface ChangesPageProps {
  changeInspector: ChangeInspectorData;
  proposedChangesCount: number;
  onNavigateApprovals?: (changeId: string) => void;
  onNavigateEvidence?: () => void;
  globalCloudScope?: string | null;
}

export const ChangesPage: React.FC<ChangesPageProps> = ({
  changeInspector,
  proposedChangesCount,
  onNavigateApprovals,
  onNavigateEvidence,
  globalCloudScope = null,
}) => {
  // Navigation View Mode (List vs In-Page Dedicated Details)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [openPlanTabIds, setOpenPlanTabIds] = useState<string[]>([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ChangeTab>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // UI state
  const [savedScrollPos, setSavedScrollPos] = useState(0);
  const [rawTelemetryOpen, setRawTelemetryOpen] = useState(false);
  const [copiedTelemetry, setCopiedTelemetry] = useState(false);
  const [expandedDiffs, setExpandedDiffs] = useState<Record<string, boolean>>({});

  // Render every proposed change as its own inspectable plan. The previous
  // composite wrapper made four changes look like a single list item.
  const allPlans = useMemo(() => {
    return changeInspector.changes.map((change) => {
      const isHighRisk = change.riskLevel === 'CRITICAL' || change.riskLevel === 'HIGH';
      return {
        ...changeInspector,
        id: change.id,
        title: change.action,
        simpleSummary: change.plainExplanation,
        severity: change.riskLevel,
        status: change.status,
        changes: [change],
        planName: `${change.cloud} infrastructure change`,
        resourcesEvaluatedCount: 1,
        cloudProvidersLabel: change.cloud,
        highRiskCount: isHighRisk ? 1 : 0,
        safeCount: isHighRisk ? 0 : 1,
        technicalDetails: {
          ...changeInspector.technicalDetails,
          planId: change.id,
          evidenceIds: change.evidenceIds || [],
        },
        validationSteps: [
          'Run Terraform syntax check & policy validator on proposed branch',
          `Execute a pre-flight safety scan for ${change.resource}`,
          'Verify dependencies, capacity, and budget guardrails',
          'Prepare automated state rollback plan before approval',
        ],
      };
    });
  }, [changeInspector]);

  const openPlanTabs = useMemo(
    () =>
      openPlanTabIds.flatMap((planId) => {
        const plan = allPlans.find((item) => item.id === planId);
        return plan ? [plan] : [];
      }),
    [allPlans, openPlanTabIds]
  );

  const highRiskCount = changeInspector.changes.filter(
    (item) => item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH'
  ).length;
  const safeCount = changeInspector.changes.filter(
    (item) => item.riskLevel === 'SAFE' || item.riskLevel === 'LOW'
  ).length;

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return allPlans.filter((plan) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = plan.title.toLowerCase().includes(q);
        const matchesId = plan.id.toLowerCase().includes(q);
        const matchesReference = getCaseReference(plan.id, 'change').toLowerCase().includes(q);
        const matchesName = plan.planName.toLowerCase().includes(q);
        const matchesResource = plan.changes.some(
          (c) => c.resource.toLowerCase().includes(q) || c.action.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesId && !matchesReference && !matchesName && !matchesResource) {
          return false;
        }
      }

      const effectiveCloudFilter = globalCloudScope || 'ALL';
      if (effectiveCloudFilter !== 'ALL') {
        if (effectiveCloudFilter === 'Multi-Cloud' && plan.provider !== 'Multi-Cloud') return false;
        if (effectiveCloudFilter !== 'Multi-Cloud' && !plan.changes.some((c) => c.cloud === effectiveCloudFilter)) return false;
      }

      if (activeTab === 'high' && !plan.changes.some((item) => item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH')) return false;
      if (activeTab === 'safe' && !plan.changes.some((item) => item.riskLevel === 'SAFE' || item.riskLevel === 'LOW')) return false;

      return true;
    });
  }, [allPlans, searchQuery, globalCloudScope, activeTab]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || activeTab !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, globalCloudScope, activeTab, pageSize]);

  const pagedPlans = useMemo(
    () => filteredPlans.slice((page - 1) * pageSize, page * pageSize),
    [filteredPlans, page, pageSize]
  );

  const handleOpenDetail = (planId: string) => {
    setSavedScrollPos(window.scrollY);
    setOpenPlanTabIds((current) =>
      current.includes(planId) ? current : [...current, planId].slice(-8)
    );
    setSelectedPlanId(planId);
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

  const handleSelectPlanTab = (planId: string) => {
    setSelectedPlanId(planId);
    setViewMode('detail');
    setRawTelemetryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClosePlanTab = (planId: string) => {
    const closingIndex = openPlanTabIds.indexOf(planId);
    const remainingIds = openPlanTabIds.filter((id) => id !== planId);
    setOpenPlanTabIds(remainingIds);

    if (viewMode === 'detail' && selectedPlanId === planId) {
      const nextPlanId =
        remainingIds[Math.min(closingIndex, remainingIds.length - 1)] || null;

      if (nextPlanId) {
        handleSelectPlanTab(nextPlanId);
      } else {
        setSelectedPlanId(null);
        handleBackToList();
      }
    }
  };

  const handleCopyTelemetry = () => {
    navigator.clipboard.writeText(
      JSON.stringify(selectedPlan.technicalDetails.rawTelemetry, null, 2)
    );
    setCopiedTelemetry(true);
    setTimeout(() => setCopiedTelemetry(false), 2000);
  };

  const toggleDiff = (id: string) => {
    setExpandedDiffs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedPlan =
    allPlans.find((p) => p.id === selectedPlanId) || allPlans[0];
  const selectedPlanStatus = approvalStatusPresentation(selectedPlan?.status);

  return (
    <div id="changes-page-container" className="space-y-4 animate-fade-in text-[#18373A] dark:text-[#E4EFED]">
      <WorkspaceTabs
        ariaLabel="Change inspector workspace"
        parentLabel="Change Inspector"
        parentContext={
          activeTab === 'all'
            ? 'All'
            : activeTab === 'high'
              ? 'High Risk'
              : 'Safe'
        }
        activeTabId={viewMode === 'detail' ? selectedPlanId : null}
        tabs={openPlanTabs.map((plan) => ({
          id: plan.id,
          label: `${getCaseReference(plan.id, 'change')} · Inspect Plan`,
          title: plan.title,
        }))}
        onSelectParent={handleBackToList}
        onSelectTab={handleSelectPlanTab}
        onCloseTab={handleClosePlanTab}
      />

      {/* =========================================================================
          VIEW 1: CHANGE PLAN LIST VIEW
          ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
            <div className="flex items-start sm:items-center gap-3">
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
                  Change Inspector
                </h1>
                <p className="text-xs text-[#5F7779] dark:text-[#9FB5B3] mt-0.5">
                  Review infrastructure changes before deployment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="flat-page-summary text-xs tabular-nums">
                {proposedChangesCount} Proposed Changes
              </span>
            </div>
          </div>

          <div className="flat-toolbar flex flex-col xl:flex-row xl:items-center gap-2.5">
            <CountTabs
              label="Change risk"
              activeTab={activeTab}
              onChange={setActiveTab}
              tabs={[
                { id: 'all', label: 'All', count: allPlans.length },
                { id: 'high', label: 'High Risk', count: highRiskCount },
                { id: 'safe', label: 'Safe', count: safeCount },
              ].filter((tab) => tab.id === 'all' || tab.count > 0)}
            />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[#5F7779] dark:text-[#9FB5B3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-changes-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter plans by ID, title, or resource action..."
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

          {/* Change Plans List */}
          <div className="flat-list space-y-3">
            {filteredPlans.length === 0 ? (
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-8 border border-[#D4E4E1] dark:border-[#29484C] text-center space-y-3">
                <div className="text-sm font-semibold text-[#18373A] dark:text-[#E4EFED]">No Change Plans Found</div>
                <p className="text-xs text-[#5F7779] dark:text-[#9FB5B3]">
                  No change plans match the active search and filter criteria.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 bg-[#137D78] dark:bg-[#35B3AA] text-white dark:text-[#0F2024] rounded-lg text-xs font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              pagedPlans.map((plan) => {
                const statusPresentation = approvalStatusPresentation(plan.status);

                return (
                <div
                  key={plan.id}
                  id={`change-plan-item-${plan.id}`}
                  onClick={() => handleOpenDetail(plan.id)}
                  className="flat-list-row transition-all cursor-pointer group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Change title is the primary row information. */}
                      <div>
                        <h3 className="text-sm font-semibold leading-5 text-[#18373A] dark:text-[#E4EFED] group-hover:text-[#137D78] dark:group-hover:text-[#35B3AA] transition-colors">
                          {plan.title}
                        </h3>
                      </div>

                      {/* Secondary metadata mirrors the incident list. */}
                      <div className="flat-meta flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#5F7779] dark:text-[#9FB5B3] border border-[#D4E4E1] dark:border-[#29484C]">
                          {getCaseReference(plan.id, 'change')}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#4F7FA3] dark:text-[#6D9CC0] border border-[#D4E4E1] dark:border-[#29484C]">
                          {plan.cloudProvidersLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 self-end lg:self-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#D4E4E1] dark:border-[#29484C]">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPresentation.pillClass}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusPresentation.dotClass}`} aria-hidden="true" />
                        {statusPresentation.label}
                      </span>
                      <button
                        id={`btn-inspect-plan-${plan.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(plan.id);
                        }}
                        className="flat-text-action text-xs transition-colors cursor-pointer"
                      >
                        <span>Inspect Plan</span>
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
            totalItems={filteredPlans.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* =========================================================================
          VIEW 2: DEDICATED IN-PAGE PLAN DETAILS VIEW
          ========================================================================= */}
      {viewMode === 'detail' && (
        <div className="flat-detail-view space-y-3 animate-fade-in">
          {/* Details Header */}
          <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-4 sm:p-5 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs space-y-2">
            <div className="flat-meta flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#18373A] dark:text-[#E4EFED] border border-[#D4E4E1] dark:border-[#29484C]">
                {getCaseReference(selectedPlan.id, 'change')}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#4F7FA3] dark:text-[#6D9CC0] border border-[#D4E4E1] dark:border-[#29484C]">
                Multi-Cloud
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
              {selectedPlan.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#5F7779] dark:text-[#9FB5B3] leading-relaxed">
              {selectedPlan.simpleSummary}
            </p>
          </div>

          {/* 2-Column Detail Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Columns: Resource Changes & Pre-flight validations */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 sm:p-6 border border-[#D4E4E1] dark:border-[#29484C] shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#D4E4E1] dark:border-[#29484C] pb-3">
                  <h2 className="text-sm font-bold text-[#18373A] dark:text-[#E4EFED] uppercase tracking-wider flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#4F7FA3] dark:text-[#6D9CC0]" />
                    <span>Resource Changes & Blast Radius</span>
                  </h2>
                  <span className="text-xs text-[#5F7779] dark:text-[#9FB5B3]">
                    Scan: <strong className="text-[#18373A] dark:text-[#E4EFED] font-mono">100% Pre-Flight Scanned</strong>
                  </span>
                </div>

                {/* List of 3 Changes */}
                <div className="space-y-3">
                  {selectedPlan.changes.map((c) => {
                    const isHigh = c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH';
                    const isExpanded = expandedDiffs[c.resource];

                    return (
                      <div
                        key={c.resource}
                        className="p-4 rounded-xl bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C] space-y-3"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isHigh ? 'bg-[#C8545E] dark:bg-[#DD6B73]' : 'bg-[#2E8B75] dark:bg-[#48B896]'
                              }`}
                            />
                            <span className="font-mono text-xs font-bold text-[#18373A] dark:text-[#E4EFED]">
                              {c.resource}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                isHigh
                                  ? 'bg-[#C8545E]/10 text-[#C8545E] dark:text-[#DD6B73]'
                                  : 'bg-[#2E8B75]/10 text-[#2E8B75] dark:text-[#48B896]'
                              }`}
                            >
                              {c.riskLevel} Risk
                            </span>
                            <span className="text-xs font-mono text-[#5F7779] dark:text-[#9FB5B3]">
                              {c.action}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-[#18373A] dark:text-[#E4EFED] leading-relaxed">
                          {c.description}
                        </p>

                        {/* Diff Expand */}
                        <div>
                          <button
                            onClick={() => toggleDiff(c.resource)}
                            className="text-xs text-[#137D78] dark:text-[#35B3AA] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Terraform Code Diff' : 'View Terraform Code Diff'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {isExpanded && (
                            <pre className="mt-2 p-3 bg-[#0F2024] text-[#E4EFED] rounded-lg text-[10px] font-mono overflow-x-auto border border-[#29484C] animate-fade-in">
                              {c.diff}
                            </pre>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Validation Steps */}
                <div className="space-y-2 pt-2 border-t border-[#D4E4E1] dark:border-[#29484C]">
                  <span className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED]">
                    Automated Pre-Flight Validation Steps
                  </span>
                  <div className="space-y-1.5">
                    {selectedPlan.validationSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-[#18373A] dark:text-[#E4EFED] p-2 bg-[#FFFFFF] dark:bg-[#183238] rounded-lg border border-[#D4E4E1] dark:border-[#29484C]"
                      >
                        <Check className="w-3.5 h-3.5 text-[#2E8B75] dark:text-[#48B896] shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Column: Telemetry, BigQuery Evidence, Approval Status */}
            <div className="space-y-5">
              {/* Evidence Store Reference */}
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
                    {selectedPlan.technicalDetails.evidenceIds.map((evId) => (
                      <div
                        key={evId}
                        className="text-[11px] font-mono bg-[#ECF5F3] dark:bg-[#13282D] px-2 py-1 rounded border border-[#D4E4E1] dark:border-[#29484C] text-[#18373A] dark:text-[#E4EFED] truncate"
                      >
                        {evId}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Raw Telemetry */}
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
                        {JSON.stringify(selectedPlan.technicalDetails.rawTelemetry, null, 2)}
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
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono ${selectedPlanStatus.pillClass}`}>
                    {selectedPlanStatus.label}
                  </span>
                </div>

                <p className="text-xs text-[#5F7779] dark:text-[#9FB5B3] leading-relaxed">
                  {approvalStatusDescription(selectedPlan.status)}
                </p>

                {onNavigateApprovals && (
                  <button
                    onClick={() => onNavigateApprovals(selectedPlan.id)}
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
