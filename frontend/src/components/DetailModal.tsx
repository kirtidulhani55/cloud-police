import React, { useState, useEffect, useRef } from 'react';
import {
  NetworkIncidentData,
  CostAnomalyData,
  ChangeInspectorData,
  DemonstrationType,
  ApprovalStatus,
} from '../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  HelpCircle,
  FileSearch,
} from 'lucide-react';
import {
  normalizeApprovalStatus,
  approvalStatusPresentation,
} from '../utils/approvalStatus';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface DetailModalProps {
  type: DemonstrationType | null;
  networkIncident: NetworkIncidentData;
  costAnomaly: CostAnomalyData;
  changeInspector: ChangeInspectorData;
  onClose: () => void;
  onApprovalChange: (type: DemonstrationType, newStatus: ApprovalStatus) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  type,
  networkIncident,
  costAnomaly,
  changeInspector,
  onClose,
  onApprovalChange,
}) => {
  const [techDetailsOpen, setTechDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogFocus(Boolean(type), dialogRef, onClose);

  useEffect(() => {
    setTechDetailsOpen(false);
    setCopied(false);
  }, [type]);

  if (!type) return null;

  let title = '';
  let providerName = '';
  let currentStatus: ApprovalStatus = 'PENDING';
  let confidenceScore = '';
  let confidenceReason = '';
  let whatHappened = '';
  let rootCause = '';
  let whyItMatters = '';
  let evidenceReviewed = '';
  let recommendedNextStep = '';
  let rawJsonData: Record<string, unknown> = {};
  let evidenceIdList: string[] = [];
  let primaryId = '';

  if (type === 'network') {
    title = networkIncident.title;
    providerName = 'Azure';
    currentStatus = networkIncident.status;
    confidenceScore = networkIncident.confidence;
    confidenceReason = networkIncident.confidenceReason;
    whatHappened = networkIncident.plainLanguage.whatHappened;
    rootCause = networkIncident.plainLanguage.rootCause;
    whyItMatters = networkIncident.plainLanguage.whyItMatters;
    evidenceReviewed = networkIncident.plainLanguage.evidenceReviewed;
    recommendedNextStep = networkIncident.plainLanguage.recommendedNextStep;
    rawJsonData = networkIncident.technicalDetails.rawTelemetry;
    primaryId = networkIncident.technicalDetails.incidentId;
    evidenceIdList = networkIncident.technicalDetails.evidenceIds;
  } else if (type === 'cost') {
    title = costAnomaly.title;
    providerName = 'AWS';
    currentStatus = costAnomaly.status;
    confidenceScore = costAnomaly.confidence;
    confidenceReason = costAnomaly.confidenceReason;
    whatHappened = costAnomaly.plainLanguage.whatHappened;
    rootCause = costAnomaly.plainLanguage.rootCause || 'The instance tier was increased without workload demand or scheduled shutdown.';
    whyItMatters = costAnomaly.plainLanguage.whyItMatters;
    evidenceReviewed = costAnomaly.plainLanguage.evidenceReviewed;
    recommendedNextStep = costAnomaly.plainLanguage.recommendedNextStep;
    rawJsonData = costAnomaly.technicalDetails.rawTelemetry;
    primaryId = costAnomaly.technicalDetails.anomalyId;
    evidenceIdList = costAnomaly.technicalDetails.evidenceIds;
  } else if (type === 'change') {
    title = changeInspector.title;
    providerName = 'Multi-Cloud';
    currentStatus = changeInspector.status;
    confidenceScore = changeInspector.confidence;
    confidenceReason = changeInspector.confidenceReason;
    whatHappened = changeInspector.plainLanguage.whatHappened;
    rootCause = changeInspector.plainLanguage.rootCause;
    whyItMatters = changeInspector.plainLanguage.whyItMatters;
    evidenceReviewed = changeInspector.plainLanguage.evidenceReviewed;
    recommendedNextStep = changeInspector.plainLanguage.recommendedNextStep;
    rawJsonData = changeInspector.technicalDetails.rawTelemetry;
    primaryId = changeInspector.technicalDetails.planId;
    evidenceIdList = changeInspector.technicalDetails.evidenceIds;
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(rawJsonData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizedStatus = normalizeApprovalStatus(currentStatus);
  const statusPresentation = approvalStatusPresentation(currentStatus);

  return (
    <div
      id="modal-case-file-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2024]/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        id="modal-case-file-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-file-dialog-title"
        tabIndex={-1}
        className="flat-detail-modal relative w-full max-w-4xl max-h-[90vh] bg-[#FFFFFF] dark:bg-[#183238] border border-[#EAE6DD] dark:border-[#29484C] shadow-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-[#FFFFFF] dark:bg-[#183238] border-b border-[#EAE6DD] dark:border-[#29484C]">
          <div className="flat-meta flex items-center gap-3">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#FFF4DF] dark:bg-[#13282D] text-[#2B2417] dark:text-[#E4EFED] border border-[#EAE6DD] dark:border-[#29484C]">
              {primaryId}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#FFF4DF] dark:bg-[#13282D] text-[#4F7FA3] dark:text-[#6D9CC0] border border-[#EAE6DD] dark:border-[#29484C]">
              {providerName}
            </span>
            {normalizedStatus === 'APPROVED' ? (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1 ${statusPresentation.pillClass}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {statusPresentation.label}
              </span>
            ) : normalizedStatus === 'REJECTED' ? (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1 ${statusPresentation.pillClass}`}>
                <XCircle className="w-3.5 h-3.5" />
                {statusPresentation.label}
              </span>
            ) : normalizedStatus === 'EVIDENCE_REQUESTED' ? (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1 ${statusPresentation.pillClass}`}>
                <FileSearch className="w-3.5 h-3.5" />
                {statusPresentation.label}
              </span>
            ) : (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1 font-mono ${statusPresentation.pillClass}`}>
                <Clock className="w-3.5 h-3.5" />
                {statusPresentation.label}
              </span>
            )}
          </div>

          <button
            type="button"
            data-dialog-initial-focus
            onClick={onClose}
            className="flat-text-action text-xs text-[#7B7468] dark:text-[#9FB5B3] cursor-pointer"
            aria-label="Close case details"
          >
            <span>Close</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-[#2B2417] dark:text-[#E4EFED]">
          <div>
            <h2 id="case-file-dialog-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#2B2417] dark:text-[#E4EFED]">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[#7B7468] dark:text-[#9FB5B3] mt-1">
              Confidence: <strong className="text-[#2E8B75] dark:text-[#48B896] font-mono">{confidenceScore}</strong> — {confidenceReason}
            </p>
          </div>

          {/* Core Findings */}
          <div className="flat-finding-list space-y-4">
            <div className="bg-[#FFF4DF] dark:bg-[#13282D] rounded-xl p-4 border border-[#EAE6DD] dark:border-[#29484C] space-y-1">
              <span className="text-xs font-bold text-[#2B2417] dark:text-[#E4EFED]">1. What Happened</span>
              <p className="text-xs sm:text-sm leading-relaxed">{whatHappened}</p>
            </div>

            <div className="bg-[#FFF4DF] dark:bg-[#13282D] rounded-xl p-4 border border-[#EAE6DD] dark:border-[#29484C] space-y-1">
              <span className="text-xs font-bold text-[#2B2417] dark:text-[#E4EFED]">2. Root Cause</span>
              <p className="text-xs sm:text-sm leading-relaxed">{rootCause}</p>
            </div>

            <div className="bg-[#C8545E]/10 rounded-xl p-4 border border-[#C8545E]/20 space-y-1 text-[#C8545E] dark:text-[#DD6B73]">
              <span className="text-xs font-bold">3. Business Impact</span>
              <p className="text-xs sm:text-sm leading-relaxed">{whyItMatters}</p>
            </div>

            <div className="bg-[#FFF4DF] dark:bg-[#13282D] rounded-xl p-4 border border-[#EAE6DD] dark:border-[#29484C] space-y-1">
              <span className="text-xs font-bold text-[#2B2417] dark:text-[#E4EFED]">4. Evidence Reviewed</span>
              <p className="text-xs sm:text-sm leading-relaxed">{evidenceReviewed}</p>
            </div>

            <div className="bg-[#2E8B75]/10 rounded-xl p-4 border border-[#2E8B75]/20 space-y-1 text-[#2B2417] dark:text-[#E4EFED]">
              <span className="text-xs font-bold text-[#2E8B75] dark:text-[#48B896]">5. Recommended Safe Next Step</span>
              <p className="text-xs sm:text-sm leading-relaxed">{recommendedNextStep}</p>
            </div>
          </div>

          {/* Technical Details Accordion */}
          <div className="flat-technical border-t border-[#EAE6DD] dark:border-[#29484C] overflow-hidden">
            <button
              onClick={() => setTechDetailsOpen(!techDetailsOpen)}
              className="flat-text-action w-full py-3 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2B2417] dark:text-[#E4EFED]">
                <HelpCircle className="w-4 h-4 text-[#7B7468] dark:text-[#9FB5B3]" />
                <span>Technical Details & Telemetry JSON</span>
              </div>
              {techDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {techDetailsOpen && (
              <div className="p-4 bg-[#0F2024] text-[#E4EFED] space-y-3 border-t border-[#29484C]">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[#9FB5B3] flex items-center gap-1.5">
                    <FileSearch className="w-3.5 h-3.5 text-[#35B3AA]" />
                    <span>Evidence Records</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {evidenceIdList.map((ev) => (
                      <span key={ev} className="px-2 py-0.5 rounded bg-[#183238] border border-[#29484C] text-[11px] font-mono text-[#35B3AA]">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <pre className="p-3 bg-[#0B171A] rounded-lg text-[10px] font-mono overflow-x-auto max-h-48 border border-[#29484C]">
                    {JSON.stringify(rawJsonData, null, 2)}
                  </pre>
                  <button
                    onClick={handleCopyJson}
                    className="absolute top-2 right-2 p-1 bg-[#183238] hover:bg-[#29484C] text-[#E4EFED] rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer border border-[#29484C]"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#2E8B75]" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between p-4 bg-[#FFFFFF] dark:bg-[#183238] border-t border-[#EAE6DD] dark:border-[#29484C]">
          <span className="text-xs text-[#7B7468] dark:text-[#9FB5B3]">
            Operator authorization required.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#B8720A] hover:bg-[#9A5E05] dark:bg-[#35B3AA] dark:hover:bg-[#48C7BD] text-white dark:text-[#0F2024] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Case File
          </button>
        </div>
      </div>
    </div>
  );
};
