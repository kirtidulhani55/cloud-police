import React from 'react';
import { ApprovalHistoryRecord, ApprovalItem, CostAnomalyData, NetworkIncidentData, SidebarNavId } from '../types';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  incidents: NetworkIncidentData[];
  costs: CostAnomalyData[];
  approvals: ApprovalItem[];
  history: ApprovalHistoryRecord[];
  refreshing: boolean;
  onRefresh: () => void;
  onCloud: (cloud: string, page: SidebarNavId) => void;
}

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const amount = (cost: CostAnomalyData) => Number(cost.metrics.monthlyExtraCost.replace(/[^0-9.-]/g, '')) || 0;

const relativeTime = (value: string) => {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value || 'Time not recorded';
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export function OverviewDetails({ incidents, costs, approvals, history, refreshing, onRefresh, onCloud }: Props) {
  const pending = approvals.filter((item) => item.status === 'PENDING').length;
  const evidence = approvals.filter((item) => item.status === 'MORE_EVIDENCE_REQUESTED').length;
  const openCosts = costs.filter((item) => item.status === 'PENDING' || item.status === 'EVIDENCE_REQUESTED');
  const providerSummary = ['AWS', 'Azure', 'GCP'].map((cloud) => {
    const cloudIncidents = incidents.filter((item) => item.provider === cloud);
    const cloudCosts = openCosts.filter((item) => item.provider === cloud);
    return {
      cloud,
      incidents: cloudIncidents.length,
      exposure: cloudCosts.reduce((sum, item) => sum + amount(item), 0),
    };
  });
  const decisionActivity = history.map((item) => {
    const subject = item.operationType === 'cost'
      ? `cost case ${item.approvalItemId}`
      : item.operationType === 'change'
        ? `change case ${item.approvalItemId}`
        : `incident ${item.approvalItemId}`;
    const text = item.decision === 'APPROVED'
      ? `${item.reviewer} approved ${subject}`
      : item.decision === 'REJECTED'
        ? `${item.reviewer} rejected ${subject}`
        : item.decision === 'REOPENED'
          ? `${item.reviewer} reopened ${subject} for re-review`
          : `${item.reviewer} requested more evidence for ${subject}`;
    const dot = item.decision === 'APPROVED'
      ? 'bg-[#2E8B75] dark:bg-[#48B896]'
      : item.decision === 'REJECTED'
        ? 'bg-[#C8545E] dark:bg-[#DD6B73]'
        : 'bg-[#B8720A] dark:bg-[#35B3AA]';
    return { id: `decision-${item.id}`, text, timestamp: item.timestamp, dot };
  });
  const incidentActivity = incidents
    .filter((item) => item.updatedAt)
    .map((item) => ({
      id: `incident-${item.id}`,
      text: `Diagnosis Agent recorded ${item.provider} connectivity incident ${item.id}`,
      timestamp: item.updatedAt || '',
      dot: 'bg-[#C8545E] dark:bg-[#DD6B73]',
    }));
  const costActivity = costs
    .filter((item) => item.updatedAt)
    .map((item) => ({
      id: `cost-${item.id}`,
      text: `Cost Agent recorded ${item.provider} cost anomaly ${item.id}`,
      timestamp: item.updatedAt || '',
      dot: 'bg-[#B8720A] dark:bg-[#35B3AA]',
    }));
  const recent = [...decisionActivity, ...incidentActivity, ...costActivity]
    .sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0))
    .slice(0, 5);

  return <section className="overview-details space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="inline-flex items-center gap-1.5 text-[#7B7468] dark:text-[#A9A39A]">Awaiting approval: {pending} pending · {evidence} evidence requested <InfoTooltip text="Pending cases need a reviewer decision. Evidence-requested cases are waiting for additional supporting information before a decision." /></p>
      <button className="flat-text-action" disabled={refreshing} onClick={onRefresh}>{refreshing ? 'Refreshing…' : 'Refresh Data'}</button>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {providerSummary.map(({ cloud, incidents: incidentCount, exposure }) => (
        <article key={cloud} className="overview-panel p-4 space-y-3">
          <h2 className="inline-flex items-center gap-1.5 font-semibold">{cloud} <InfoTooltip text={`Incident count and estimated monthly extra cost currently recorded for ${cloud} in the selected scope.`} /></h2>
          <div className="flex flex-col gap-2 text-sm">
            <button className="flat-text-action w-fit" onClick={() => onCloud(cloud, 'incidents')}>{incidentCount} incident records</button>
            <button className="flat-text-action w-fit" onClick={() => onCloud(cloud, 'cost')}>{money(exposure)}/mo estimated extra</button>
          </div>
        </article>
      ))}
    </div>
    <p className="text-xs text-[#7B7468] dark:text-[#A9A39A]">Estimates come from the loaded case records, not a live billing feed. Review approval does not confirm resolution or realised savings.</p>
    <article className="overview-panel p-5">
        <h2 className="mb-4 inline-flex items-center gap-1.5 font-semibold">Recent Activity <InfoTooltip text="The five newest real records combined from reviewer decision history, incident updates, and cost-anomaly updates." /></h2>
        {recent.length === 0 && <p className="text-sm text-[#7B7468] dark:text-[#A9A39A]">No recorded activity available in the current cloud scope.</p>}
        {recent.map((item) => <div key={item.id} className="overview-detail-row py-3">
          <div className="flex gap-3">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
            <div className="min-w-0">
              <p className="text-sm font-medium break-words">{item.text}</p>
              <p className="mt-0.5 text-xs text-[#7B7468] dark:text-[#A9A39A]">{relativeTime(item.timestamp)}</p>
            </div>
          </div>
        </div>)}
    </article>
  </section>;
}
