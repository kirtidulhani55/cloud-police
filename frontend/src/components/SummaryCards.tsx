import React from 'react';
import { DemonstrationType } from '../types';
import { InfoTooltip } from './InfoTooltip';

interface SummaryMetricProps {
  id: string;
  label: string;
  value: string | number;
  explanation: string;
  onClick?: () => void;
}

const SummaryMetric: React.FC<SummaryMetricProps> = ({
  id,
  label,
  value,
  explanation,
  onClick,
}) => (
  <div className="overview-metric min-w-0">
    <div className="absolute right-3 top-3 z-10">
      <InfoTooltip text={explanation} label={`About ${label}`} />
    </div>
    <button id={id} type="button" onClick={onClick} className="w-full cursor-pointer pr-6 text-left">
      <span className="overview-metric-label text-xs font-semibold text-[#7B7468] dark:text-[#B2C5C3]">{label}</span>
      <strong className="mt-1 block font-mono text-xl font-bold tracking-tight text-[#2B2417] dark:text-[#E4EFED] sm:text-2xl">{value}</strong>
    </button>
  </div>
);

interface SummaryCardsProps {
  activeIncidentsCount: number;
  costAtRisk: string;
  proposedChangesCount: number;
  awaitingApprovalCount: number;
  onSelectDemo?: (type: DemonstrationType) => void;
  onOpenApprovals?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  activeIncidentsCount,
  costAtRisk,
  proposedChangesCount,
  awaitingApprovalCount,
  onSelectDemo,
  onOpenApprovals,
}) => (
  <section
    id="overview-summary-metrics"
    aria-label="Cloud overview metrics"
    className="grid grid-cols-2 lg:grid-cols-4"
  >
    <SummaryMetric
      id="summary-card-incidents"
      label="Active Incidents"
      value={activeIncidentsCount}
      explanation="Current incident records in the selected cloud scope that still require investigation or resolution."
      onClick={() => onSelectDemo?.('network')}
    />
    <SummaryMetric
      id="summary-card-cost"
      label="Estimated Extra Cost"
      value={costAtRisk}
      explanation="Combined estimated monthly extra cost from open cost-anomaly cases. Approved cases remain included until they are recorded as resolved."
      onClick={() => onSelectDemo?.('cost')}
    />
    <SummaryMetric
      id="summary-card-changes"
      label="Proposed Changes"
      value={proposedChangesCount}
      explanation="Infrastructure changes detected and assessed by Change Inspector in the selected cloud scope."
      onClick={() => onSelectDemo?.('change')}
    />
    <SummaryMetric
      id="summary-card-approvals"
      label="Awaiting Approval"
      value={awaitingApprovalCount}
      explanation="Cases currently pending a reviewer decision, including cases where more evidence has been requested."
      onClick={onOpenApprovals}
    />
  </section>
);
