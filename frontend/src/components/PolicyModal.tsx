import React, { useRef } from 'react';
import { SearchItem } from '../data/searchData';
import { X, ShieldCheck, FileCheck, CheckCircle2, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { DemonstrationType } from '../types';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface PolicyModalProps {
  policy: SearchItem | null;
  onClose: () => void;
  onOpenInvestigation?: (type: DemonstrationType) => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  policy,
  onClose,
  onOpenInvestigation,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(Boolean(policy), dialogRef, onClose);

  if (!policy) return null;

  const providerColor =
    policy.provider === 'Azure'
      ? 'bg-blue-500/15 text-blue-700 dark:text-[#5B8CFF] border-blue-500/30 dark:border-[#5B8CFF]/30'
      : policy.provider === 'AWS'
      ? 'bg-amber-500/15 text-amber-800 dark:text-[#F5A623] border-amber-500/30 dark:border-[#F5A623]/30'
      : policy.provider === 'GCP'
      ? 'bg-emerald-500/15 text-emerald-800 dark:text-[#3DD68C] border-emerald-500/30 dark:border-[#3DD68C]/30'
      : 'bg-[#F1EDE5] dark:bg-[#1B2233] text-[#20242A] dark:text-[#E7EAF0] border-[#D8D1C5] dark:border-[#242C40]';

  return (
    <div
      id="policy-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        id="policy-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-dialog-title"
        tabIndex={-1}
        className="bg-[#FFFEFB] dark:bg-[#131826] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#D8D1C5] dark:border-[#242C40] overflow-hidden my-8 flex flex-col max-h-[90vh] text-[#20242A] dark:text-[#E7EAF0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D8D1C5] dark:border-[#242C40] flex items-center justify-between bg-[#F1EDE5] dark:bg-[#1B2233]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#B8720A]/20 dark:bg-[#E3A63E]/20 text-[#20242A] dark:text-[#E3A63E] border border-[#B8720A]/40 dark:border-[#E3A63E]/40">
                Governance Policy Definition
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${providerColor}`}>
                {policy.provider}
              </span>
            </div>
            <h3 id="policy-dialog-title" className="text-xl font-bold text-[#20242A] dark:text-[#E7EAF0] tracking-tight">
              {policy.title}
            </h3>
          </div>

          <button
            type="button"
            data-dialog-initial-focus
            id="btn-close-policy-modal"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-xl text-[#66707C] dark:text-[#9BA4B8] hover:text-[#20242A] dark:hover:text-[#E7EAF0] hover:bg-[#E4DED2] dark:hover:bg-[#131826] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7 space-y-5 overflow-y-auto text-[#20242A] dark:text-[#E7EAF0] text-sm">
          {/* Policy Code Banner */}
          {policy.policyCode && (
            <div className="p-3.5 bg-[#0B0E14] rounded-xl text-[#9BA4B8] flex items-center justify-between font-mono text-xs border border-[#242C40]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#3DD68C] shrink-0" />
                <span className="text-[#9BA4B8]">Rule Identifier:</span>
                <span className="text-[#3DD68C] font-semibold">{policy.policyCode}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#1B2233] text-[#E7EAF0] text-[10px] uppercase font-sans font-bold border border-[#242C40]">
                {policy.statusBadge || 'Active'}
              </span>
            </div>
          )}

          {/* Description */}
          <div className="bg-[#F1EDE5] dark:bg-[#1B2233] rounded-xl p-4 border border-[#D8D1C5] dark:border-[#242C40] space-y-2">
            <h4 className="text-xs font-bold text-[#20242A] dark:text-[#E7EAF0] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#16A085] dark:text-[#3DD68C]" />
              Policy Statement & Guardrail
            </h4>
            <p className="text-[#20242A] dark:text-[#E7EAF0] text-sm sm:text-base leading-relaxed">
              {policy.description}
            </p>
          </div>

          {/* Enforcement Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 bg-[#FFFEFB] dark:bg-[#131826] border border-[#D8D1C5] dark:border-[#242C40] rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#66707C] dark:text-[#9BA4B8]">
                <Lock className="w-3.5 h-3.5 text-[#16A085] dark:text-[#3DD68C]" />
                <span>Enforcement Mode</span>
              </div>
              <div className="text-sm font-bold text-[#20242A] dark:text-[#E7EAF0]">
                Human Approval Required (Read-Only AI)
              </div>
              <p className="text-xs text-[#66707C] dark:text-[#9BA4B8]">
                Remediations remain advisory until approved by an engineer.
              </p>
            </div>

            <div className="p-3.5 bg-[#FFFEFB] dark:bg-[#131826] border border-[#D8D1C5] dark:border-[#242C40] rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#66707C] dark:text-[#9BA4B8]">
                <Sparkles className="w-3.5 h-3.5 text-[#B8720A] dark:text-[#E3A63E]" />
                <span>Evidence Grounding</span>
              </div>
              <div className="text-sm font-bold text-[#20242A] dark:text-[#E7EAF0]">
                BigQuery Telemetry Cross-Reference
              </div>
              <p className="text-xs text-[#66707C] dark:text-[#9BA4B8]">
                Audit logs, rate cards, and change sets are cross-referenced against current evidence records.
              </p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="text-xs font-semibold text-[#66707C] dark:text-[#9BA4B8] mb-2">Relevant Scope Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {policy.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-[#F1EDE5] dark:bg-[#1B2233] border border-[#D8D1C5] dark:border-[#242C40] text-[#66707C] dark:text-[#9BA4B8] text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F1EDE5] dark:bg-[#1B2233] border-t border-[#D8D1C5] dark:border-[#242C40] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#66707C] dark:text-[#9BA4B8]">
            <CheckCircle2 className="w-4 h-4 text-[#16A085] dark:text-[#3DD68C] shrink-0" />
            <span>Policy status: Enforced across active clouds</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {policy.targetModal && onOpenInvestigation && (
              <button
                id="btn-policy-view-case"
                onClick={() => {
                  onClose();
                  onOpenInvestigation(policy.targetModal!);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8720A] dark:bg-[#E3A63E] hover:bg-[#D49B22] dark:hover:bg-[#CC902B] text-[#20242A] dark:text-[#0B0E14] text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs border border-amber-400 dark:border-[#E3A63E]"
              >
                <span>Inspect Related Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#FFFEFB] dark:bg-[#1B2233] border border-[#D8D1C5] dark:border-[#242C40] hover:bg-[#E4DED2] dark:hover:bg-[#242C40] text-[#20242A] dark:text-[#E7EAF0] text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
