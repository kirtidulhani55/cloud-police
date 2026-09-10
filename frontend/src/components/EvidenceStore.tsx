import React, { useState, useMemo, useEffect } from 'react';
import {
  Database,
  Lock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  Search,
  RotateCcw,
} from 'lucide-react';
import {
  ChangeInspectorData,
  CostAnomalyData,
  DemonstrationType,
  NetworkIncidentData,
} from '../types';
import { CountTabs } from './CountTabs';
import { ListPagination } from './ListPagination';
import { WorkspaceTabs } from './WorkspaceTabs';
import { getCaseReference, getEvidenceReference } from '../utils/caseReference';

export type EvidenceTabId = 'all' | 'network' | 'cost' | 'change';

export interface EvidenceRecord {
  id: string;
  category: string;
  categoryType: 'network' | 'cost' | 'change';
  tableName: string;
  associatedId: string;
  summary: string;
  eventTime: string;
  query: string;
  associatedCaseType?: DemonstrationType;
  recordsVolume: string;
}

interface EvidenceStoreProps {
  onSelectCase: (type: DemonstrationType) => void;
  networkIncidents?: NetworkIncidentData[];
  costAnomalies?: CostAnomalyData[];
  changeInspector?: ChangeInspectorData;
  connectionStatus?: 'loading' | 'live' | 'fallback';
  globalCloudScope?: string | null;
}

const INCIDENTS_TABLE = 'cloudpolice-506015.cloud_police.incidents';

function storedCaseQuery(incidentId: string): string {
  return `SELECT
  incident_id,
  incident_type,
  cloud_provider,
  severity,
  status,
  summary,
  root_cause,
  affected_resource,
  blocking_component,
  confidence,
  evidence_event_ids,
  diagnosis,
  updated_ts
FROM \`${INCIDENTS_TABLE}\`
WHERE incident_id = "${incidentId}"`;
}

function displayTime(value?: string): string {
  if (!value) {
    return 'Stored agent result';
  }

  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime())
    ? value
    : timestamp.toLocaleString();
}

export const EvidenceStore: React.FC<EvidenceStoreProps> = ({
  networkIncidents = [],
  costAnomalies = [],
  changeInspector,
  connectionStatus = 'fallback',
  globalCloudScope = null,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [openEvidenceTabIds, setOpenEvidenceTabIds] = useState<string[]>([]);
  const [savedScrollPos, setSavedScrollPos] = useState(0);
  const [activeTab, setActiveTab] = useState<EvidenceTabId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedQueries, setExpandedQueries] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const evidenceRecords = useMemo<EvidenceRecord[]>(
    () =>
      connectionStatus === 'live'
        ? [
          ...networkIncidents.map((incident) => ({
            id: incident.technicalDetails.evidenceIds[0] || incident.id,
            category: 'Network Evidence',
            categoryType: 'network' as const,
            tableName: INCIDENTS_TABLE,
            associatedId: incident.id,
            summary: incident.simpleSummary,
            eventTime: displayTime(incident.updatedAt),
            query: storedCaseQuery(incident.id),
            associatedCaseType: 'network' as const,
            recordsVolume: `${incident.technicalDetails.evidenceIds.length} linked evidence ID(s)`,
          })),
          ...costAnomalies.map((anomaly) => ({
            id: anomaly.technicalDetails.evidenceIds[0] || anomaly.id,
            category: 'Cost Evidence',
            categoryType: 'cost' as const,
            tableName: INCIDENTS_TABLE,
            associatedId: anomaly.id,
            summary: anomaly.simpleSummary,
            eventTime: displayTime(anomaly.updatedAt),
            query: storedCaseQuery(anomaly.id),
            associatedCaseType: 'cost' as const,
            recordsVolume: `${anomaly.technicalDetails.evidenceIds.length} linked evidence ID(s)`,
          })),
          ...(changeInspector?.changes || []).map((change) => ({
            id: change.evidenceIds?.[0] || change.id,
            category: 'Change Evidence',
            categoryType: 'change' as const,
            tableName: INCIDENTS_TABLE,
            associatedId: change.id,
            summary: `${change.action}. ${change.plainExplanation}`,
            eventTime: displayTime(change.updatedAt),
            query: storedCaseQuery(change.id),
            associatedCaseType: 'change' as const,
            recordsVolume: `${change.evidenceIds?.length || 0} linked evidence ID(s)`,
          })),
          ]
        : [],
    [changeInspector, connectionStatus, costAnomalies, networkIncidents]
  );

  const openEvidenceTabs = useMemo(
    () =>
      openEvidenceTabIds.flatMap((evidenceId) => {
        const record = evidenceRecords.find((item) => item.id === evidenceId);
        return record ? [record] : [];
      }),
    [evidenceRecords, openEvidenceTabIds]
  );

  const selectedEvidence =
    evidenceRecords.find((item) => item.id === selectedEvidenceId) || null;

  const handleToggleQuery = (id: string) => {
    setExpandedQueries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenEvidenceDetail = (evidenceId: string) => {
    setSavedScrollPos(window.scrollY);
    setOpenEvidenceTabIds((current) =>
      current.includes(evidenceId)
        ? current
        : [...current, evidenceId].slice(-8)
    );
    setSelectedEvidenceId(evidenceId);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToEvidenceList = () => {
    setViewMode('list');
    setTimeout(() => {
      window.scrollTo({ top: savedScrollPos, behavior: 'auto' });
    }, 50);
  };

  const handleSelectEvidenceTab = (evidenceId: string) => {
    setSelectedEvidenceId(evidenceId);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseEvidenceTab = (evidenceId: string) => {
    const closingIndex = openEvidenceTabIds.indexOf(evidenceId);
    const remainingIds = openEvidenceTabIds.filter((id) => id !== evidenceId);
    setOpenEvidenceTabIds(remainingIds);

    if (viewMode === 'detail' && selectedEvidenceId === evidenceId) {
      const nextEvidenceId =
        remainingIds[Math.min(closingIndex, remainingIds.length - 1)] || null;

      if (nextEvidenceId) {
        handleSelectEvidenceTab(nextEvidenceId);
      } else {
        setSelectedEvidenceId(null);
        handleBackToEvidenceList();
      }
    }
  };

  const tabCounts: Record<EvidenceTabId, number> = {
    all: evidenceRecords.length,
    network: evidenceRecords.filter((item) => item.categoryType === 'network').length,
    cost: evidenceRecords.filter((item) => item.categoryType === 'cost').length,
    change: evidenceRecords.filter((item) => item.categoryType === 'change').length,
  };

  const filteredRecords = useMemo(() => {
    return evidenceRecords.filter((record) => {
      if (activeTab !== 'all' && record.categoryType !== activeTab) return false;
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const caseReference = getCaseReference(record.associatedId, record.categoryType).toLowerCase();
      const evidenceReference = getEvidenceReference(record.id).toLowerCase();
      return [
        record.id,
        record.associatedId,
        record.category,
        record.tableName,
        record.summary,
        caseReference,
        evidenceReference,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [evidenceRecords, activeTab, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, pageSize, globalCloudScope]);

  const pagedRecords = useMemo(
    () => filteredRecords.slice((page - 1) * pageSize, page * pageSize),
    [filteredRecords, page, pageSize]
  );

  return (
    <div id="evidence-store-page" className="space-y-3 text-[#18373A] dark:text-[#E4EFED] animate-fade-in">
      <WorkspaceTabs
        ariaLabel="Evidence workspace"
        parentLabel="Evidence"
        parentContext={
          activeTab === 'all'
            ? 'All'
            : activeTab === 'network'
              ? 'Network'
              : activeTab === 'cost'
                ? 'Cost'
                : 'Change'
        }
        activeTabId={viewMode === 'detail' ? selectedEvidenceId : null}
        tabs={openEvidenceTabs.map((record) => ({
          id: record.id,
          label: `${getEvidenceReference(record.id)} · View Evidence`,
          title: record.summary,
        }))}
        onSelectParent={handleBackToEvidenceList}
        onSelectTab={handleSelectEvidenceTab}
        onCloseTab={handleCloseEvidenceTab}
      />

      {viewMode === 'list' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
              Evidence
            </h1>
            <p className="text-xs text-[#5F7779] dark:text-[#9FB5B3] mt-0.5">
              Inspect the raw telemetry and query logs that support every diagnosis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="flat-page-summary text-xs tabular-nums">
            {evidenceRecords.length} Evidence Packages · Read-Only{globalCloudScope ? ` · ${globalCloudScope}` : ''}
          </span>
        </div>
      </div>

      <div className="flat-toolbar flex flex-col xl:flex-row xl:items-center gap-2.5">
        <CountTabs
          label="Evidence category"
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'all', label: 'All', count: tabCounts.all },
            { id: 'network', label: 'Network', count: tabCounts.network },
            { id: 'cost', label: 'Cost', count: tabCounts.cost },
            { id: 'change', label: 'Change', count: tabCounts.change },
          ].filter((tab) => tab.id === 'all' || tab.count > 0)}
        />
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#5F7779] dark:text-[#9FB5B3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filter evidence by ID, case, table, or resource..."
            className="flat-search-input w-full pl-9 pr-24 py-2 text-xs text-[#18373A] dark:text-[#E4EFED] placeholder-[#5F7779] dark:placeholder-[#9FB5B3] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#137D78] dark:text-[#35B3AA] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Evidence Records List */}
      <div className="flat-list space-y-2.5">
        {connectionStatus !== 'live' && (
          <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-8 border border-[#D4E4E1] dark:border-[#29484C] text-center">
            <p className="text-sm font-semibold text-[#18373A] dark:text-[#E4EFED]">
              {connectionStatus === 'loading'
                ? 'Loading live BigQuery evidence…'
                : 'Live evidence is currently unavailable.'}
            </p>
            <p className="text-xs text-[#5F7779] dark:text-[#9FB5B3] mt-2">
              Sample evidence is intentionally hidden to prevent it from being mistaken for real telemetry.
            </p>
          </div>
        )}
        {connectionStatus === 'live' && filteredRecords.length === 0 && (
          <div className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl p-8 border border-[#D4E4E1] dark:border-[#29484C] text-center">
            <p className="text-base font-semibold">No evidence packages match this view.</p>
            <p className="text-sm text-[#5F7779] dark:text-[#9FB5B3] mt-2">Try another category or clear the search.</p>
          </div>
        )}
        {pagedRecords.map((rec) => {
          const isExpanded = expandedQueries[rec.id];

          return (
            <div
              key={rec.id}
              className="flat-list-row space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Evidence summary is the primary row information. */}
                  <h3 className="text-sm font-semibold leading-5 text-[#18373A] dark:text-[#E4EFED]">
                    {rec.summary}
                  </h3>

                  <div className="flat-meta flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#5F7779] dark:text-[#9FB5B3] border border-[#D4E4E1] dark:border-[#29484C]">
                      {getEvidenceReference(rec.id)}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#ECF5F3] dark:bg-[#13282D] text-[#137D78] dark:text-[#35B3AA]">
                      {rec.category}
                    </span>
                    <span className="text-xs tabular-nums text-[#5F7779] dark:text-[#9FB5B3]">
                      {rec.eventTime}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#D4E4E1] dark:border-[#29484C]">
                  <span className="text-xs text-[#5F7779] dark:text-[#9FB5B3]">
                    {rec.recordsVolume}
                  </span>
                  {rec.associatedCaseType && (
                    <button
                      onClick={() => handleOpenEvidenceDetail(rec.id)}
                      className="flat-text-action text-xs cursor-pointer"
                    >
                      <span>View {getEvidenceReference(rec.id)}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* BigQuery SQL Drawer */}
              <div className="space-y-2 border-t border-[#D4E4E1] pt-2 dark:border-[#29484C]">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleToggleQuery(rec.id)}
                    className="flat-text-action evidence-sql-action text-xs cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide SQL Query' : 'View SQL Query'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="relative animate-fade-in">
                    <pre className="p-3 bg-[#0F2024] text-[#E4EFED] rounded-lg text-[10px] font-mono overflow-x-auto border border-[#29484C]">
                      {rec.query}
                    </pre>
                    <button
                      onClick={() => handleCopy(rec.query, rec.id)}
                      className="absolute top-2 right-2 p-1 bg-[#183238] hover:bg-[#1D3B41] text-[#E4EFED] rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer border border-[#29484C]"
                    >
                      {copiedId === rec.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#2E8B75]" />
                          <span className="text-[#2E8B75]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ListPagination
        page={page}
        pageSize={pageSize}
        totalItems={filteredRecords.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
        </div>
      )}

      {viewMode === 'detail' && selectedEvidence && (
        <div className="flat-detail-view space-y-3 animate-fade-in">
          <div className="space-y-2 rounded-xl border border-[#D4E4E1] bg-white p-4 shadow-2xs dark:border-[#29484C] dark:bg-[#183238] sm:p-5">
            <div className="flat-meta flex flex-wrap items-center gap-2">
              <span className="rounded border border-[#D4E4E1] bg-[#ECF5F3] px-2 py-0.5 font-mono text-xs font-semibold text-[#18373A] dark:border-[#29484C] dark:bg-[#13282D] dark:text-[#E4EFED]">
                {getEvidenceReference(selectedEvidence.id)}
              </span>
              <span className="rounded bg-[#137D78]/10 px-2 py-0.5 text-xs font-medium text-[#137D78] dark:text-[#35B3AA]">
                {selectedEvidence.category}
              </span>
              <span className="flex items-center gap-1 text-xs tabular-nums text-[#5F7779] dark:text-[#9FB5B3]">
                <Clock className="h-3 w-3" />
                {selectedEvidence.eventTime}
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED] sm:text-2xl">
              Evidence for {getCaseReference(selectedEvidence.associatedId, selectedEvidence.categoryType)}
            </h1>
            <p className="text-xs leading-relaxed text-[#5F7779] dark:text-[#9FB5B3] sm:text-sm">
              {selectedEvidence.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-4 rounded-xl border border-[#D4E4E1] bg-white p-5 shadow-2xs dark:border-[#29484C] dark:bg-[#183238] lg:col-span-1">
              <h2 className="border-b border-[#D4E4E1] pb-3 text-sm font-bold uppercase tracking-wider dark:border-[#29484C]">
                Evidence Details
              </h2>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-[#5F7779] dark:text-[#9FB5B3]">Associated case</dt>
                  <dd className="mt-1 font-mono font-semibold">
                    {getCaseReference(selectedEvidence.associatedId, selectedEvidence.categoryType)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5F7779] dark:text-[#9FB5B3]">BigQuery table</dt>
                  <dd className="mt-1 break-all font-mono font-semibold">
                    {selectedEvidence.tableName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5F7779] dark:text-[#9FB5B3]">Linked records</dt>
                  <dd className="mt-1 font-semibold">{selectedEvidence.recordsVolume}</dd>
                </div>
                <div>
                  <dt className="text-[#5F7779] dark:text-[#9FB5B3]">Access mode</dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-semibold text-[#2E8B75] dark:text-[#48B896]">
                    <Lock className="h-3.5 w-3.5" /> Read-only
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-4 rounded-xl border border-[#D4E4E1] bg-white p-5 shadow-2xs dark:border-[#29484C] dark:bg-[#183238] lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#D4E4E1] pb-3 dark:border-[#29484C]">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                  <Database className="h-4 w-4 text-[#137D78] dark:text-[#35B3AA]" />
                  BigQuery Evidence Query
                </h2>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedEvidence.query, selectedEvidence.id)}
                  className="flat-text-action text-xs"
                >
                  {copiedId === selectedEvidence.id ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedId === selectedEvidence.id ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="max-h-[420px] overflow-auto rounded-lg border border-[#29484C] bg-[#0F2024] p-4 font-mono text-[11px] leading-relaxed text-[#E4EFED]">
                {selectedEvidence.query}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
