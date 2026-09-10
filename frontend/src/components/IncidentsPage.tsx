import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  Server,
  Database,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Activity,
  Search,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lock,
  Ban,
} from 'lucide-react';
import { NetworkIncidentData } from '../types';
import { CountTabs } from './CountTabs';
import { ListPagination } from './ListPagination';
import { WorkspaceTabs } from './WorkspaceTabs';
import { getCaseReference } from '../utils/caseReference';
import {
  approvalStatusDescription,
  approvalStatusPresentation,
} from '../utils/approvalStatus';

type IncidentTab = 'all' | 'critical' | 'high' | 'other';

interface IncidentsPageProps {
  networkIncident: NetworkIncidentData;
  networkIncidents: NetworkIncidentData[];
  activeIncidentsCount: number;
  onNavigateApprovals?: (incidentId: string) => void;
  onNavigateEvidence?: () => void;
  globalCloudScope?: string | null;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  networkIncident,
  networkIncidents,
  activeIncidentsCount,
  onNavigateApprovals,
  onNavigateEvidence,
  globalCloudScope = null,
}) => {
  // Navigation View Mode (List vs In-Page Dedicated Details)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [openIncidentTabIds, setOpenIncidentTabIds] = useState<string[]>([]);

  // Filters State (Preserved across detail transitions)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<IncidentTab>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // UI state
  const [savedScrollPos, setSavedScrollPos] = useState(0);
  const [rawTelemetryOpen, setRawTelemetryOpen] = useState(false);
  const [copiedTelemetry, setCopiedTelemetry] = useState(false);

  // Live incidents returned by the read-only dashboard API.
  const allIncidents = useMemo(() => {
    return networkIncidents.map((incident) => ({
      ...incident,
      affectedResource: incident.affectedResource || 'Affected resource',
      affectedPort: incident.affectedPort
        ? `TCP ${incident.affectedPort}`
        : 'Not provided',
      detectedTime: incident.updatedAt
        ? new Date(incident.updatedAt).toLocaleString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : 'Latest automated scan',
    }));
  }, [networkIncidents]);

  const openIncidentTabs = useMemo(
    () =>
      openIncidentTabIds.flatMap((incidentId) => {
        const incident = allIncidents.find((item) => item.id === incidentId);
        return incident ? [incident] : [];
      }),
    [allIncidents, openIncidentTabIds]
  );

  const highestRisk = allIncidents.some((incident) => incident.severity === 'CRITICAL')
    ? 'Critical'
    : allIncidents.some((incident) => incident.severity === 'HIGH')
      ? 'High'
      : 'Low';

  const tabCounts: Record<IncidentTab, number> = {
    all: allIncidents.length,
    critical: allIncidents.filter((item) => item.severity === 'CRITICAL').length,
    high: allIncidents.filter((item) => item.severity === 'HIGH').length,
    other: allIncidents.filter(
      (item) => item.severity !== 'CRITICAL' && item.severity !== 'HIGH'
    ).length,
  };

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    return allIncidents.filter((inc) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = inc.title.toLowerCase().includes(q);
        const matchesId = inc.id.toLowerCase().includes(q);
        const matchesReference = getCaseReference(inc.id, 'network').toLowerCase().includes(q);
        const matchesResource = inc.affectedResource.toLowerCase().includes(q);
        const matchesPort = inc.affectedPort.toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesReference && !matchesResource && !matchesPort) {
          return false;
        }
      }

      // 2. Cloud Filter
      const effectiveCloudFilter = globalCloudScope || 'ALL';
      if (effectiveCloudFilter !== 'ALL' && inc.provider !== effectiveCloudFilter) {
        return false;
      }

      if (activeTab === 'critical' && inc.severity !== 'CRITICAL') return false;
      if (activeTab === 'high' && inc.severity !== 'HIGH') return false;
      if (activeTab === 'other' && (inc.severity === 'CRITICAL' || inc.severity === 'HIGH')) return false;

      return true;
    });
  }, [allIncidents, searchQuery, globalCloudScope, activeTab]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || activeTab !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, globalCloudScope, activeTab, pageSize]);

  const pagedIncidents = useMemo(
    () => filteredIncidents.slice((page - 1) * pageSize, page * pageSize),
    [filteredIncidents, page, pageSize]
  );

  // Handlers for switching views
  const handleOpenDetail = (incidentId: string) => {
    setSavedScrollPos(window.scrollY);
    setOpenIncidentTabIds((current) =>
      current.includes(incidentId)
        ? current
        : [...current, incidentId].slice(-8)
    );
    setSelectedIncidentId(incidentId);
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

  const handleSelectIncidentTab = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setViewMode('detail');
    setRawTelemetryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseIncidentTab = (incidentId: string) => {
    const closingIndex = openIncidentTabIds.indexOf(incidentId);
    const remainingIds = openIncidentTabIds.filter((id) => id !== incidentId);
    setOpenIncidentTabIds(remainingIds);

    if (viewMode === 'detail' && selectedIncidentId === incidentId) {
      const nextIncidentId =
        remainingIds[Math.min(closingIndex, remainingIds.length - 1)] || null;

      if (nextIncidentId) {
        handleSelectIncidentTab(nextIncidentId);
      } else {
        setSelectedIncidentId(null);
        handleBackToList();
      }
    }
  };

  const handleCopyTelemetry = () => {
    navigator.clipboard.writeText(
      JSON.stringify(selectedIncident.technicalDetails.rawTelemetry, null, 2)
    );
    setCopiedTelemetry(true);
    setTimeout(() => setCopiedTelemetry(false), 2000);
  };

  const selectedIncident =
    allIncidents.find((i) => i.id === selectedIncidentId) || allIncidents[0];
  const selectedIncidentStatus = approvalStatusPresentation(selectedIncident?.status);

  return (
    <div id="incidents-page-container" className="space-y-4 animate-fade-in text-[#2B2417] dark:text-[#E4EFED]">
      <WorkspaceTabs
        ariaLabel="Incident workspace"
        parentLabel="Incidents"
        parentContext={
          activeTab === 'all'
            ? 'All'
            : activeTab === 'critical'
              ? 'Critical'
              : activeTab === 'high'
                ? 'High Risk'
                : 'Other'
        }
        activeTabId={viewMode === 'detail' ? selectedIncidentId : null}
        tabs={openIncidentTabs.map((incident) => ({
          id: incident.id,
          label: `${getCaseReference(incident.id, 'network')} · Investigate`,
          title: incident.title,
        }))}
        onSelectParent={handleBackToList}
        onSelectTab={handleSelectIncidentTab}
        onCloseTab={handleCloseIncidentTab}
      />

      {/* =========================================================================
          VIEW 1: INCIDENTS LIST VIEW
          ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {/* Compact page identity: the work queue remains the visual priority. */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
            <div className="flex items-start sm:items-center gap-3">
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[#2B2417] dark:text-[#E4EFED]">
                  Incidents
                </h1>
                <p className="text-xs text-[#7B7468] dark:text-[#9FB5B3] mt-0.5">
                  Investigate active cloud incidents and their root causes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="flat-page-summary text-xs tabular-nums">
                {activeIncidentsCount} Active · Highest Risk: {highestRisk}
              </span>
            </div>
          </div>

          {/* One work-queue toolbar replaces separate tab and filter cards. */}
          <div className="flat-toolbar flex flex-col xl:flex-row xl:items-center gap-2.5">
            <CountTabs
              label="Incident severity"
              activeTab={activeTab}
              onChange={setActiveTab}
              tabs={[
                { id: 'all', label: 'All', count: tabCounts.all },
                { id: 'critical', label: 'Critical', count: tabCounts.critical },
                { id: 'high', label: 'High', count: tabCounts.high },
                { id: 'other', label: 'Other', count: tabCounts.other },
              ].filter((tab) => tab.id === 'all' || tab.count > 0)}
            />

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[#7B7468] dark:text-[#9FB5B3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-incidents-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter this incident list by ID, resource, or port..."
                  className="flat-search-input w-full pl-9 pr-3 py-2 text-xs text-[#2B2417] dark:text-[#E4EFED] placeholder-[#7B7468] dark:placeholder-[#9FB5B3] focus:outline-none transition-colors"
                />
              </div>

              {hasActiveFilters && (
                <button
                  id="btn-incident-reset-filters"
                  onClick={resetFilters}
                  className="px-2.5 py-2 text-xs text-[#B8720A] dark:text-[#35B3AA] hover:underline font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Incident List */}
          <div className="flat-list space-y-3">
            {filteredIncidents.length === 0 ? (
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-8 border border-[#EAE6DD] dark:border-[#29484C] text-center space-y-3">
                <div className="text-sm font-semibold text-[#2B2417] dark:text-[#E4EFED]">No Incidents Found</div>
                <p className="text-xs text-[#7B7468] dark:text-[#9FB5B3]">
                  No incidents match the active search and filter criteria.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 bg-[#B8720A] dark:bg-[#35B3AA] text-white dark:text-[#0F2024] rounded-lg text-xs font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              pagedIncidents.map((incident) => {
                const statusPresentation = approvalStatusPresentation(incident.status);

                return (
                <div
                  key={incident.id}
                  id={`incident-item-${incident.id}`}
                  onClick={() => handleOpenDetail(incident.id)}
                  className="flat-list-row transition-all cursor-pointer group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Incident title is the primary row information. */}
                      <div>
                        <h3 className="incident-list-title text-sm font-medium leading-5 text-[#2B2417] dark:text-[#E4EFED] group-hover:text-[#B8720A] dark:group-hover:text-[#35B3AA] transition-colors">
                          {incident.title}
                        </h3>
                      </div>

                      {/* Meta badges */}
                      <div className="flat-meta flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-[#FFF4DF] dark:bg-[#13282D] text-[#7B7468] dark:text-[#9FB5B3] border border-[#EAE6DD] dark:border-[#29484C]">
                          {getCaseReference(incident.id, 'network')}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#FFF4DF] dark:bg-[#13282D] text-[#4F7FA3] dark:text-[#6D9CC0] border border-[#EAE6DD] dark:border-[#29484C]">
                          {incident.provider}
                        </span>
                        <span className="text-xs text-[#7B7468] dark:text-[#9FB5B3] tabular-nums">
                          {incident.detectedTime}
                        </span>
                        <span className="text-xs text-[#7B7468] dark:text-[#9FB5B3]">
                          Resolution: {['RESOLVED', 'CLOSED'].includes((incident.operationalStatus || '').toUpperCase()) ? incident.operationalStatus : 'Not confirmed'}
                        </span>
                        <span className="text-xs text-[#7B7468] dark:text-[#9FB5B3]">
                          {incident.affectedResource}
                        </span>
                      </div>

                    </div>

                    <div className="flex flex-col items-end gap-1.5 self-end lg:self-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#EAE6DD] dark:border-[#29484C]">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPresentation.pillClass}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusPresentation.dotClass}`} aria-hidden="true" />
                        {statusPresentation.label}
                      </span>
                      <button
                        id={`btn-view-incident-${incident.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(incident.id);
                        }}
                        className="flat-text-action text-xs transition-colors cursor-pointer"
                      >
                        <span>Investigate</span>
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
            totalItems={filteredIncidents.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* =========================================================================
          VIEW 2: DEDICATED IN-PAGE INCIDENT DETAILS VIEW
          ========================================================================= */}
      {viewMode === 'detail' && (
        <div className="flat-detail-view space-y-3 animate-fade-in">
          {/* Details Header */}
          <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-4 sm:p-5 border border-[#EAE6DD] dark:border-[#29484C] shadow-2xs space-y-2">
            <div className="flat-meta flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#FFF4DF] dark:bg-[#13282D] text-[#2B2417] dark:text-[#E4EFED] border border-[#EAE6DD] dark:border-[#29484C]">
                {getCaseReference(selectedIncident.id, 'network')}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#FFF4DF] dark:bg-[#13282D] text-[#4F7FA3] dark:text-[#6D9CC0] border border-[#EAE6DD] dark:border-[#29484C]">
                {selectedIncident.provider}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#C8545E]/10 text-[#C8545E] dark:text-[#DD6B73]">
                {selectedIncident.severity} Risk
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2B2417] dark:text-[#E4EFED]">
              {selectedIncident.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B7468] dark:text-[#9FB5B3] leading-relaxed">
              {selectedIncident.simpleSummary}
            </p>
          </div>

          {/* 2-Column Detail Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Columns: Diagnostics, Impact, Traffic Path, Root Cause, Safe Next Step */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 sm:p-6 border border-[#EAE6DD] dark:border-[#29484C] shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#EAE6DD] dark:border-[#29484C] pb-3">
                  <h2 className="text-sm font-bold text-[#2B2417] dark:text-[#E4EFED] uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#C8545E] dark:text-[#DD6B73]" />
                    <span>Incident Diagnostics & Impact</span>
                  </h2>
                  <span className="text-xs text-[#7B7468] dark:text-[#9FB5B3]">
                    Confidence: <strong className="text-[#2B2417] dark:text-[#E4EFED] font-mono">{selectedIncident.confidence}</strong>
                  </span>
                </div>

                {/* 1. What Happened */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#2B2417] dark:text-[#E4EFED]">
                    1. What Happened
                  </span>
                  <div className="text-xs text-[#2B2417] dark:text-[#E4EFED] leading-relaxed bg-[#FFF4DF] dark:bg-[#13282D] p-3 rounded-lg border border-[#EAE6DD] dark:border-[#29484C]">
                    {selectedIncident.plainLanguage.whatHappened}
                  </div>
                </div>

                {/* 2. Business Impact */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#2B2417] dark:text-[#E4EFED]">
                    2. Business Impact
                  </span>
                  <div className="text-xs text-[#C8545E] dark:text-[#DD6B73] leading-relaxed bg-[#C8545E]/10 p-3 rounded-lg border border-[#C8545E]/20 font-medium">
                    {selectedIncident.plainLanguage.whyItMatters}
                  </div>
                </div>

                {/* 3. Traffic Path Topology */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#2B2417] dark:text-[#E4EFED]">
                    3. Traffic Path & Drop Point
                  </span>
                  <div className="bg-[#FFF4DF] dark:bg-[#13282D] rounded-xl p-4 border border-[#EAE6DD] dark:border-[#29484C]">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      {/* Source */}
                      <div className="w-full sm:w-auto flex-1 bg-[#FFFFFF] dark:bg-[#183238] p-3 rounded-lg border border-[#EAE6DD] dark:border-[#29484C] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF4DF] dark:bg-[#13282D] text-[#B8720A] dark:text-[#35B3AA] flex items-center justify-center shrink-0">
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-[#2B2417] dark:text-[#E4EFED]">App Server</div>
                          <div className="text-[10px] text-[#7B7468] dark:text-[#9FB5B3] font-mono">{selectedIncident.sourceResource}</div>
                        </div>
                      </div>

                      {/* Drop */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8545E]/10 text-[#C8545E] dark:text-[#DD6B73] font-mono font-medium text-[11px] shrink-0">
                        <Ban className="w-3.5 h-3.5" />
                        <span>{selectedIncident.affectedPort} Blocked</span>
                      </div>

                      {/* Target */}
                      <div className="w-full sm:w-auto flex-1 bg-[#FFFFFF] dark:bg-[#183238] p-3 rounded-lg border border-[#EAE6DD] dark:border-[#29484C] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF4DF] dark:bg-[#13282D] text-[#B8720A] dark:text-[#35B3AA] flex items-center justify-center shrink-0">
                          <Database className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-[#2B2417] dark:text-[#E4EFED]">Target Resource</div>
                          <div className="text-[10px] text-[#7B7468] dark:text-[#9FB5B3] font-mono">{selectedIncident.affectedResource}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Root Cause */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#2B2417] dark:text-[#E4EFED]">
                    4. Root Cause Analysis
                  </span>
                  <div className="text-xs text-[#2B2417] dark:text-[#E4EFED] leading-relaxed bg-[#FFF4DF] dark:bg-[#13282D] p-3 rounded-lg border border-[#EAE6DD] dark:border-[#29484C]">
                    {selectedIncident.plainLanguage.rootCause}
                  </div>
                </div>

                {/* 5. Recommended Safe Next Step */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#2B2417] dark:text-[#E4EFED]">
                    5. Recommended Safe Next Step
                  </span>
                  <div className="p-3.5 bg-[#2E8B75]/10 border border-[#2E8B75]/20 rounded-lg space-y-1.5">
                    <p className="text-xs text-[#2B2417] dark:text-[#E4EFED] font-medium leading-relaxed">
                      {selectedIncident.plainLanguage.recommendedNextStep}
                    </p>
                    <div className="text-[11px] text-[#2E8B75] dark:text-[#48B896] flex items-center gap-1.5 font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Action is gated: Operator approval required before applying Terraform state recovery.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Column: Telemetry, BigQuery Evidence, Approval Status */}
            <div className="space-y-5">
              {/* Telemetry Signals */}
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 border border-[#EAE6DD] dark:border-[#29484C] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAE6DD] dark:border-[#29484C] pb-2.5">
                  <span className="text-xs font-bold text-[#2B2417] dark:text-[#E4EFED] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#B8720A] dark:text-[#35B3AA]" />
                    <span>Telemetry Signals</span>
                  </span>
                  <span className="text-[10px] font-semibold text-[#2E8B75] dark:text-[#48B896] font-mono">
                    Read-Only
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#FFF4DF] dark:bg-[#13282D] border border-[#EAE6DD] dark:border-[#29484C]">
                    <div className="text-[11px] text-[#7B7468] dark:text-[#9FB5B3]">Linked Evidence</div>
                    <div className="text-sm font-bold text-[#C8545E] dark:text-[#DD6B73] font-mono mt-0.5">{selectedIncident.technicalDetails.evidenceIds.length} records</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FFF4DF] dark:bg-[#13282D] border border-[#EAE6DD] dark:border-[#29484C]">
                    <div className="text-[11px] text-[#7B7468] dark:text-[#9FB5B3]">Destination Port</div>
                    <div className="text-sm font-bold text-[#2B2417] dark:text-[#E4EFED] font-mono mt-0.5">{selectedIncident.affectedPort}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FFF4DF] dark:bg-[#13282D] border border-[#EAE6DD] dark:border-[#29484C]">
                    <div className="text-[11px] text-[#7B7468] dark:text-[#9FB5B3]">Confidence</div>
                    <div className="text-sm font-bold text-[#2E8B75] dark:text-[#48B896] font-mono mt-0.5">{selectedIncident.confidence}</div>
                  </div>
                </div>
              </div>

              {/* BigQuery Evidence Store */}
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 border border-[#EAE6DD] dark:border-[#29484C] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAE6DD] dark:border-[#29484C] pb-2.5">
                  <span className="text-xs font-bold text-[#2B2417] dark:text-[#E4EFED] flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-[#B8720A] dark:text-[#35B3AA]" />
                    <span>BigQuery Evidence</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#7B7468] dark:text-[#9FB5B3]">Immutable</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-[11px] text-[#7B7468] dark:text-[#9FB5B3]">Evidence IDs:</div>
                  <div className="space-y-1">
                    {selectedIncident.technicalDetails.evidenceIds.map((evId) => (
                      <div
                        key={evId}
                        className="text-[11px] font-mono bg-[#FFF4DF] dark:bg-[#13282D] px-2 py-1 rounded border border-[#EAE6DD] dark:border-[#29484C] text-[#2B2417] dark:text-[#E4EFED] truncate"
                      >
                        {evId}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Raw Telemetry JSON toggle */}
                <div className="pt-1">
                  <button
                    onClick={() => setRawTelemetryOpen(!rawTelemetryOpen)}
                    className="text-xs text-[#7B7468] dark:text-[#9FB5B3] hover:text-[#2B2417] dark:hover:text-[#E4EFED] flex items-center justify-between w-full p-2 bg-[#FFF4DF] dark:bg-[#13282D] rounded-lg border border-[#EAE6DD] dark:border-[#29484C] font-medium cursor-pointer"
                  >
                    <span>Raw JSON Telemetry</span>
                    {rawTelemetryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {rawTelemetryOpen && (
                    <div className="mt-2 relative animate-fade-in">
                      <pre className="p-3 bg-[#0F2024] text-[#E4EFED] rounded-lg text-[10px] font-mono overflow-x-auto max-h-48 border border-[#29484C]">
                        {JSON.stringify(selectedIncident.technicalDetails.rawTelemetry, null, 2)}
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
                    className="w-full py-2 bg-[#FFF4DF] dark:bg-[#13282D] hover:bg-[#F3E7D1] dark:hover:bg-[#183238] text-[#2B2417] dark:text-[#E4EFED] rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-[#EAE6DD] dark:border-[#29484C]"
                  >
                    <span>Examine Evidence Store</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Approval Status Card */}
              <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-5 border border-[#EAE6DD] dark:border-[#29484C] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAE6DD] dark:border-[#29484C] pb-2.5">
                  <span className="text-xs font-bold text-[#2B2417] dark:text-[#E4EFED] flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#B8720A] dark:text-[#35B3AA]" />
                    <span>Human Approval</span>
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono ${selectedIncidentStatus.pillClass}`}>
                    {selectedIncidentStatus.label}
                  </span>
                </div>

                <p className="text-xs text-[#7B7468] dark:text-[#9FB5B3] leading-relaxed">
                  {approvalStatusDescription(selectedIncident.status)}
                </p>

                {onNavigateApprovals && (
                  <button
                    id="btn-navigate-to-approvals"
                    onClick={() => onNavigateApprovals(selectedIncident.id)}
                    className="w-full py-2.5 bg-[#B8720A] hover:bg-[#9A5E05] dark:bg-[#35B3AA] dark:hover:bg-[#48C7BD] text-white dark:text-[#0F2024] rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
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
