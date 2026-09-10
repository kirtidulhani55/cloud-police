import React, { useState } from 'react';
import { Activity, ChevronDown, Radio } from 'lucide-react';
import {
  ChangeInspectorData,
  CostAnomalyData,
  NetworkIncidentData,
} from '../types';

interface AgentActivityStreamProps {
  onSelectEvent?: (eventId: string) => void;
  defaultExpanded?: boolean;
  networkIncident: NetworkIncidentData;
  costAnomaly: CostAnomalyData;
  changeInspector: ChangeInspectorData;
}

export const AgentActivityStream: React.FC<AgentActivityStreamProps> = ({
  onSelectEvent,
  defaultExpanded = false,
  networkIncident,
  costAnomaly,
  changeInspector,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const events = [
    {
      id: 'EVT-101',
      category: 'Policy Guardrail',
      time: '14m ago',
      badgeColor: 'bg-[#C8545E]/10 text-[#C8545E] dark:text-[#DD6B73]',
      description: networkIncident.simpleSummary,
      evidenceRef: networkIncident.technicalDetails.evidenceIds[0] || networkIncident.id,
    },
    {
      id: 'EVT-102',
      category: 'FinOps Intelligence',
      time: '32m ago',
      badgeColor: 'bg-[#B8720A]/10 text-[#B8720A] dark:text-[#D5A45A]',
      description: costAnomaly.simpleSummary,
      evidenceRef: costAnomaly.technicalDetails.evidenceIds[0] || costAnomaly.id,
    },
    {
      id: 'EVT-103',
      category: 'Pre-Flight Scanner',
      time: '1h ago',
      badgeColor: 'bg-[#2E8B75]/10 text-[#2E8B75] dark:text-[#48B896]',
      description: changeInspector.simpleSummary,
      evidenceRef: changeInspector.technicalDetails.evidenceIds[0] || changeInspector.id,
    },
  ];

  return (
    <div
      id="agent-activity-stream-panel"
      className="bg-[#FFFFFF] dark:bg-[#183238] rounded-xl border border-[#EAE6DD] dark:border-[#29484C] shadow-2xs overflow-hidden transition-all duration-200"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#FFF4DF] dark:hover:bg-[#13282D] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#B8720A] dark:text-[#35B3AA]" />
          <h3 className="text-sm font-bold text-[#2B2417] dark:text-[#E4EFED]">
            Agent Activity
          </h3>
          <span className="text-[10px] font-medium text-[#2E8B75] dark:text-[#48B896] flex items-center gap-1 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E8B75] dark:bg-[#48B896] animate-pulse" />
            Live
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7B7468] dark:text-[#9FB5B3]">
            {isExpanded ? 'Hide' : '3 events'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#7B7468] dark:text-[#9FB5B3] transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 sm:p-5 pt-0 space-y-2.5 border-t border-[#EAE6DD] dark:border-[#29484C] animate-fade-in">
          {events.map((evt) => (
            <div
              key={evt.id}
              onClick={() => onSelectEvent?.(evt.id)}
              className="p-3 rounded-lg bg-[#FFF4DF] dark:bg-[#13282D] border border-[#EAE6DD] dark:border-[#29484C] space-y-1.5 hover:border-[#B8720A] dark:hover:border-[#35B3AA] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs">
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${evt.badgeColor}`}>
                  {evt.category}
                </span>
                <span className="text-[#7B7468] dark:text-[#9FB5B3] font-mono text-[10px]">{evt.time}</span>
              </div>
              <p className="text-[#2B2417] dark:text-[#E4EFED] text-xs font-medium leading-relaxed">
                {evt.description}
              </p>
              <div className="flex items-center justify-between text-[10px] text-[#7B7468] dark:text-[#9FB5B3] font-mono pt-1">
                <span>Ref: {evt.evidenceRef}</span>
                <span className="text-[#2E8B75] dark:text-[#48B896]">Audit verified</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
