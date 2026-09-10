import React, { useState } from 'react';
import {
  ChangeInspectorData,
  CostAnomalyData,
  DemonstrationType,
  NetworkIncidentData,
  SearchCategoryFilter,
} from '../types';
import { approvalStatusPresentation } from '../utils/approvalStatus';

interface DemonstrationCardsProps {
  networkIncident: NetworkIncidentData;
  costAnomaly: CostAnomalyData;
  changeInspector: ChangeInspectorData;
  onOpenDetail: (type: DemonstrationType) => void;
  onOpenIncidentPage?: () => void;
  searchQuery?: string;
  selectedCategory?: SearchCategoryFilter;
  selectedCloudProvider?: string | null;
  onResetFilter?: () => void;
}

type CaseTab = 'network' | 'cost' | 'change';

const CaseMeta: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overview-meta flex flex-wrap items-center gap-2 text-xs">
    {children}
  </div>
);

export const DemonstrationCards: React.FC<DemonstrationCardsProps> = ({
  networkIncident,
  costAnomaly,
  changeInspector,
  onOpenDetail,
  onOpenIncidentPage,
}) => {
  const [activeCaseTab, setActiveCaseTab] = useState<CaseTab>('network');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const selectCase = (caseTab: CaseTab) => {
    setActiveCaseTab(caseTab);
    setShowTechnicalDetails(false);
  };

  const highRiskChanges = changeInspector.changes.filter(
    (change) => change.riskLevel === 'CRITICAL' || change.riskLevel === 'HIGH'
  ).length;
  const safeChanges = changeInspector.changes.length - highRiskChanges;
  const networkStatusPresentation = approvalStatusPresentation(networkIncident.status);
  const costStatusPresentation = approvalStatusPresentation(costAnomaly.status);
  const changeStatusPresentation = approvalStatusPresentation(changeInspector.status);

  return (
    <section id="overview-priority-case" className="space-y-4">
      <div className="overview-priority-header flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <h2 className="text-xl font-bold text-[#2B2417] dark:text-[#E4EFED]">
          Needs Your Attention
        </h2>

        <div className="overview-case-tabs flex items-center gap-5 overflow-x-auto" aria-label="Case type">
          {([
            ['network', 'Incident'],
            ['cost', 'Cost Anomaly'],
            ['change', 'Change Plan'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              data-active={activeCaseTab === id}
              onClick={() => selectCase(id)}
              className="overview-case-tab text-xs cursor-pointer whitespace-nowrap"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeCaseTab === 'network' && (
        <div className="overview-case-body space-y-3 animate-fade-in">
          <CaseMeta>
            <span className="font-mono">{networkIncident.id}</span>
            <span>{networkIncident.provider}</span>
            <span className="text-[#C8545E] dark:text-[#DD6B73]">
              {networkIncident.severity} Risk
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${networkStatusPresentation.pillClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${networkStatusPresentation.dotClass}`} aria-hidden="true" />
              {networkStatusPresentation.label}
            </span>
          </CaseMeta>

          <h3 className="text-lg font-bold text-[#2B2417] dark:text-[#E4EFED]">
            {networkIncident.title}
          </h3>

          <p className="text-sm leading-relaxed text-[#2B2417] dark:text-[#E4EFED]">
            <strong className="font-semibold">Root cause: </strong>
            {networkIncident.plainLanguage.rootCause}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="overview-text-action text-xs cursor-pointer"
            >
              {showTechnicalDetails ? 'Hide technical details' : 'View technical details'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenIncidentPage) onOpenIncidentPage();
                else onOpenDetail('network');
              }}
              className="overview-text-action text-xs font-semibold cursor-pointer"
            >
              View incident
            </button>
          </div>

          {showTechnicalDetails && (
            <dl className="overview-technical-details grid sm:grid-cols-2 gap-x-8 text-xs animate-fade-in">
              <div><dt>Confidence</dt><dd>{networkIncident.confidence}</dd></div>
              <div><dt>Blocked rule</dt><dd>{networkIncident.blockingComponent}</dd></div>
              <div><dt>Resource</dt><dd>{networkIncident.affectedResource}</dd></div>
              <div><dt>Evidence</dt><dd>{networkIncident.technicalDetails.evidenceIds.length} records</dd></div>
            </dl>
          )}

        </div>
      )}

      {activeCaseTab === 'cost' && (
        <div className="overview-case-body space-y-3 animate-fade-in">
          <CaseMeta>
            <span className="font-mono">{costAnomaly.id}</span>
            <span>{costAnomaly.provider}</span>
            <span className="text-[#B8720A] dark:text-[#D5A45A]">High Cost Surge</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${costStatusPresentation.pillClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${costStatusPresentation.dotClass}`} aria-hidden="true" />
              {costStatusPresentation.label}
            </span>
          </CaseMeta>

          <h3 className="text-lg font-bold text-[#2B2417] dark:text-[#E4EFED]">
            {costAnomaly.title}
          </h3>

          <p className="text-sm leading-relaxed text-[#2B2417] dark:text-[#E4EFED]">
            {costAnomaly.simpleSummary}
          </p>

          <dl className="overview-inline-metrics grid grid-cols-2 sm:grid-cols-4 text-xs">
            <div><dt>Baseline</dt><dd>{costAnomaly.metrics.previousDailyCost}</dd></div>
            <div><dt>Current</dt><dd>{costAnomaly.metrics.newDailyCost}</dd></div>
            <div><dt>Increase</dt><dd>{costAnomaly.metrics.percentageIncrease}</dd></div>
            <div><dt>Monthly impact</dt><dd>{costAnomaly.metrics.monthlyExtraCost}</dd></div>
          </dl>

          <button
            type="button"
            onClick={() => onOpenDetail('cost')}
            className="overview-text-action text-xs font-semibold cursor-pointer"
          >
            View analysis
          </button>
        </div>
      )}

      {activeCaseTab === 'change' && (
        <div className="overview-case-body space-y-3 animate-fade-in">
          <CaseMeta>
            <span className="font-mono">{changeInspector.id}</span>
            <span>Multi-Cloud</span>
            <span className="text-[#B8720A] dark:text-[#D5A45A]">{highRiskChanges} high risk</span>
            <span className="text-[#2E8B75] dark:text-[#48B896]">{safeChanges} safe</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${changeStatusPresentation.pillClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${changeStatusPresentation.dotClass}`} aria-hidden="true" />
              {changeStatusPresentation.label}
            </span>
          </CaseMeta>

          <h3 className="text-lg font-bold text-[#2B2417] dark:text-[#E4EFED]">
            {changeInspector.title}
          </h3>

          <p className="text-sm leading-relaxed text-[#2B2417] dark:text-[#E4EFED]">
            {changeInspector.simpleSummary}
          </p>

          <button
            type="button"
            onClick={() => onOpenDetail('change')}
            className="overview-text-action text-xs font-semibold cursor-pointer"
          >
            Inspect plan
          </button>
        </div>
      )}
    </section>
  );
};
