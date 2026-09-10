import React from 'react';
import {
  ChangeInspectorData,
  CostAnomalyData,
  NetworkIncidentData,
} from '../types';

interface RiskDistributionProps {
  onSelectCategory?: (category: 'critical' | 'high' | 'safe') => void;
  networkIncident: NetworkIncidentData;
  costAnomaly: CostAnomalyData;
  changeInspector: ChangeInspectorData;
}

export const RiskDistribution: React.FC<RiskDistributionProps> = ({
  onSelectCategory,
  networkIncident,
  costAnomaly,
  changeInspector,
}) => {
  const lowestRiskChange =
    changeInspector.changes.find(
      (change) => change.riskLevel === 'LOW' || change.riskLevel === 'SAFE'
    ) || changeInspector.changes[0];

  const risks = [
    {
      id: 'critical' as const,
      label: networkIncident.title,
      color: 'bg-[#C8545E] dark:bg-[#DD6B73]',
    },
    {
      id: 'high' as const,
      label: costAnomaly.title,
      color: 'bg-[#B8720A] dark:bg-[#D5A45A]',
    },
    {
      id: 'safe' as const,
      label: lowestRiskChange?.action || 'Proposed Change',
      color: 'bg-[#2E8B75] dark:bg-[#48B896]',
    },
  ];

  return (
    <aside id="risk-distribution-panel" className="space-y-2">
      <div className="flex items-center justify-between border-b border-[#EAE6DD] dark:border-[#29484C] pb-2">
        <h3 className="text-sm font-bold text-[#2B2417] dark:text-[#E4EFED]">Risk Summary</h3>
        <span className="text-xs text-[#7B7468] dark:text-[#B2C5C3]">{risks.length}</span>
      </div>

      <div>
        {risks.map((risk) => (
          <button
            key={risk.id}
            type="button"
            onClick={() => onSelectCategory?.(risk.id)}
            className="overview-risk-row w-full flex items-center gap-2.5 text-left cursor-pointer"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${risk.color}`} />
            <span className="overview-risk-title min-w-0 truncate text-xs font-medium text-[#2B2417] dark:text-[#E4EFED]">
              {risk.label}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
};
