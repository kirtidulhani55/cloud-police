import React from 'react';
import {
  ShieldAlert,
  TrendingUp,
  UserCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { DemonstrationType } from '../types';

interface SummaryBarProps {
  activeIncidentsCount: number;
  costAtRisk: string;
  proposedChangesCount: number;
  awaitingApprovalCount: number;
  onSelectDemo?: (type: DemonstrationType) => void;
  onOpenApprovals?: () => void;
  onFilterTag?: (tag: 'incident' | 'cost' | 'approval') => void;
}

export const SummaryBar: React.FC<SummaryBarProps> = ({
  activeIncidentsCount,
  costAtRisk,
  proposedChangesCount,
  awaitingApprovalCount,
  onSelectDemo,
  onOpenApprovals,
  onFilterTag,
}) => {
  const totalActionItems = activeIncidentsCount + (costAtRisk !== '$0' ? 1 : 0) + (proposedChangesCount > 0 ? 1 : 0);

  return (
    <section
      id="overview-summary-bar"
      className="w-full bg-[#FFFEFB] dark:bg-[#131826] rounded-xl p-4 sm:p-5 border border-[#D8D1C5] dark:border-[#242C40] shadow-2xs transition-colors duration-200"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        {/* Main Attention Title & Inline Tags */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-[#20242A] dark:text-[#E7EAF0] tracking-tight leading-snug">
              {totalActionItems > 0
                ? `${totalActionItems} items need your attention today`
                : 'All systems healthy — no items need attention today'}
            </h1>
          </div>

          {/* Inline Count Tags */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs sm:text-[13px] text-[#66707C] dark:text-[#9BA4B8] font-medium">
            {/* Tag 1: Incidents */}
            <button
              type="button"
              onClick={() => {
                if (onFilterTag) onFilterTag('incident');
                else onSelectDemo?.('network');
              }}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#F1EDE5] dark:bg-[#1B2233] hover:bg-[#E4DED2] dark:hover:bg-[#242C40] text-[#20242A] dark:text-[#E7EAF0] border border-[#D8D1C5] dark:border-[#242C40] transition-colors cursor-pointer text-xs"
              title="View Active Incidents"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F0576B] shrink-0"></span>
              <span className="font-semibold text-rose-700 dark:text-[#F0576B]">
                {activeIncidentsCount > 0 ? `${activeIncidentsCount} Critical Incident` : '0 Critical Incidents'}
              </span>
            </button>

            <span className="text-[#D8D1C5] dark:text-[#242C40] select-none">·</span>

            {/* Tag 2: Cost surge */}
            <button
              type="button"
              onClick={() => {
                if (onFilterTag) onFilterTag('cost');
                else onSelectDemo?.('cost');
              }}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#F1EDE5] dark:bg-[#1B2233] hover:bg-[#E4DED2] dark:hover:bg-[#242C40] text-[#20242A] dark:text-[#E7EAF0] border border-[#D8D1C5] dark:border-[#242C40] transition-colors cursor-pointer text-xs"
              title="View Cost Anomalies"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] shrink-0"></span>
              <span className="font-semibold text-amber-800 dark:text-[#F5A623]">
                {costAtRisk !== '$0' ? `${costAtRisk} cost surge` : 'No cost anomalies'}
              </span>
            </button>

            <span className="text-[#D8D1C5] dark:text-[#242C40] select-none">·</span>

            {/* Tag 3: Pending Approvals */}
            <button
              type="button"
              onClick={() => {
                if (onFilterTag) onFilterTag('approval');
                else if (onOpenApprovals) onOpenApprovals();
              }}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#F1EDE5] dark:bg-[#1B2233] hover:bg-[#E4DED2] dark:hover:bg-[#242C40] text-[#66707C] dark:text-[#8B93A8] border border-[#D8D1C5] dark:border-[#242C40] transition-colors cursor-pointer text-xs"
              title="Open Approval Queue"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B93A8] shrink-0"></span>
              <span className="font-medium text-[#66707C] dark:text-[#8B93A8]">
                {awaitingApprovalCount} Pending Approvals
              </span>
            </button>
          </div>
        </div>

        {/* Quick Primary Action to Open Approval Queue */}
        {onOpenApprovals && (
          <button
            type="button"
            id="btn-summary-open-queue"
            onClick={onOpenApprovals}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5B8CFF] hover:bg-[#4A7CEB] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer shrink-0 active:scale-[0.98]"
          >
            <span>Open Approval Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </section>
  );
};
