import React from 'react';
import {
  ShieldAlert,
  Activity,
  Database,
  CheckCircle2,
  Lock,
  X,
  Radio,
  Sparkles,
} from 'lucide-react';

interface InsightsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InsightsDrawer: React.FC<InsightsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FFFEFB] dark:bg-[#131826] text-[#20242A] dark:text-[#E7EAF0] shadow-2xl border-l border-[#D8D1C5] dark:border-[#242C40] flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#D8D1C5] dark:border-[#242C40] flex items-center justify-between bg-[#F1EDE5] dark:bg-[#1B2233]">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#5B8CFF]/15 text-[#5B8CFF] border border-[#5B8CFF]/30 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#20242A] dark:text-[#E7EAF0]">
                  System Insights & Stream
                </h3>
                <p className="text-[11px] text-[#66707C] dark:text-[#9BA4B8]">
                  Telemetry, risk analysis & agent activity
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              id="btn-close-insights-drawer"
              className="p-1.5 rounded-lg text-[#66707C] dark:text-[#9BA4B8] hover:text-[#20242A] dark:hover:text-[#E7EAF0] hover:bg-[#E4DED2] dark:hover:bg-[#242C40] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body with Panels */}
          <div className="p-4 sm:p-5 space-y-4 flex-1">
            {/* Panel 1: Risk Distribution / Severity Breakdown */}
            <div className="bg-[#F6F3ED] dark:bg-[#1B2233] rounded-xl p-3 border border-[#D8D1C5] dark:border-[#242C40] space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#D8D1C5] dark:border-[#242C40]">
                <span className="text-xs font-bold text-[#20242A] dark:text-[#E7EAF0] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600 dark:text-[#F0576B]" />
                  Risk Distribution
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EDE8DE] dark:bg-[#131826] text-[#66707C] dark:text-[#9BA4B8] border border-[#D8D1C5] dark:border-[#242C40]">
                  3 Total Active
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#FFFEFB] dark:bg-[#131826] border border-[#D8D1C5] dark:border-[#242C40]">
                  <span className="flex items-center gap-2 text-[#20242A] dark:text-[#E7EAF0] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#F0576B]"></span>
                    Critical Severity (Port 1433)
                  </span>
                  <span className="text-xs font-bold text-red-600 dark:text-[#F0576B] px-1.5 py-0.5 rounded bg-red-500/10 dark:bg-[#F0576B]/15 border border-red-500/20 dark:border-[#F0576B]/30">
                    1 Case
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#FFFEFB] dark:bg-[#131826] border border-[#D8D1C5] dark:border-[#242C40]">
                  <span className="flex items-center gap-2 text-[#20242A] dark:text-[#E7EAF0] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#F5A623]"></span>
                    High Cost Anomaly (+$2.1k)
                  </span>
                  <span className="text-xs font-bold text-amber-700 dark:text-[#F5A623] px-1.5 py-0.5 rounded bg-amber-500/10 dark:bg-[#F5A623]/15 border border-amber-500/20 dark:border-[#F5A623]/30">
                    1 Case
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#FFFEFB] dark:bg-[#131826] border border-[#D8D1C5] dark:border-[#242C40]">
                  <span className="flex items-center gap-2 text-[#20242A] dark:text-[#E7EAF0] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#3DD68C]"></span>
                    Low-Risk Infrastructure Tag
                  </span>
                  <span className="text-xs font-bold text-[#16A085] dark:text-[#3DD68C] px-1.5 py-0.5 rounded bg-[#16A085]/10 dark:bg-[#3DD68C]/15 border border-[#16A085]/20 dark:border-[#3DD68C]/30">
                    1 Change
                  </span>
                </div>
              </div>
            </div>

            {/* Panel 2: Agent Activity Stream */}
            <div className="bg-[#F6F3ED] dark:bg-[#1B2233] rounded-xl p-3 border border-[#D8D1C5] dark:border-[#242C40] space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#D8D1C5] dark:border-[#242C40]">
                <span className="text-xs font-bold text-[#20242A] dark:text-[#E7EAF0] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#16A085] dark:text-[#3DD68C]" />
                  Agent Activity Stream
                </span>
                <span className="text-[10px] font-bold text-[#16A085] dark:text-[#3DD68C] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A085] dark:bg-[#3DD68C] animate-pulse"></span>
                  Live Telemetry
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-[#FFFEFB] dark:bg-[#131826] border border-[#D8D1C5] dark:border-[#242C40] space-y-1">
                  <div className="flex items-center justify-between text-[#66707C] dark:text-[#6B7387] text-[10px]">
                    <span className="font-semibold text-rose-700 dark:text-[#F0576B]">Policy Guardrail</span>
                    <span>14m ago</span>
                  </div>
                  <p className="text-[#20242A] dark:text-[#E7EAF0] font-medium leading-snug">
                    Default-Deny trigger detected on <span className="font-mono text-[#0078D4] dark:text-[#5B8CFF]">sqldb-prod-01</span>
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-[#FFFEFB] dark:bg-[#131826] border border-[#D8D1C5] dark:border-[#242C40] space-y-1">
                  <div className="flex items-center justify-between text-[#66707C] dark:text-[#6B7387] text-[10px]">
                    <span className="font-semibold text-amber-800 dark:text-[#F5A623]">FinOps Intelligence</span>
                    <span>32m ago</span>
                  </div>
                  <p className="text-[#20242A] dark:text-[#E7EAF0] font-medium leading-snug">
                    Over-provisioning alert flagged for PR-402 (AWS EC2 worker tier)
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-[#FFFEFB] dark:bg-[#131826] border border-[#D8D1C5] dark:border-[#242C40] space-y-1">
                  <div className="flex items-center justify-between text-[#66707C] dark:text-[#6B7387] text-[10px]">
                    <span className="font-semibold text-[#16A085] dark:text-[#3DD68C]">Pre-Flight Scanner</span>
                    <span>1h ago</span>
                  </div>
                  <p className="text-[#20242A] dark:text-[#E7EAF0] font-medium leading-snug">
                    Blast radius simulation completed for multi-cloud plan CHG-PLAN-8821
                  </p>
                </div>
              </div>
            </div>

            {/* Panel 3: Evidence Store Health */}
            <div className="bg-[#F6F3ED] dark:bg-[#1B2233] rounded-xl p-3 border border-[#D8D1C5] dark:border-[#242C40] space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#D8D1C5] dark:border-[#242C40]">
                <span className="text-xs font-bold text-[#20242A] dark:text-[#E7EAF0] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#16A085] dark:text-[#3DD68C]" />
                  Evidence Store Health
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#16A085]/15 dark:bg-[#3DD68C]/15 text-[#16A085] dark:text-[#3DD68C] border border-[#16A085]/30 dark:border-[#3DD68C]/30">
                  BigQuery
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#FFFEFB] dark:bg-[#131826] border border-[#D8D1C5] dark:border-[#242C40]">
                  <span className="text-[#66707C] dark:text-[#9BA4B8]">Sync Status</span>
                  <span className="text-[#16A085] dark:text-[#3DD68C] font-semibold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3 h-3" />
                    Synchronized (4 Tables)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#FFFEFB] dark:bg-[#131826] border border-[#D8D1C5] dark:border-[#242C40]">
                  <span className="text-[#66707C] dark:text-[#9BA4B8]">Guardrail Mode</span>
                  <span className="text-[#20242A] dark:text-[#E7EAF0] font-semibold flex items-center gap-1 text-[11px]">
                    <Lock className="w-3 h-3 text-[#16A085] dark:text-[#3DD68C]" />
                    Read-Only (No Write Access)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#FFFEFB] dark:bg-[#131826] border border-[#D8D1C5] dark:border-[#242C40]">
                  <span className="text-[#66707C] dark:text-[#9BA4B8]">Audit Immutability</span>
                  <span className="text-[#20242A] dark:text-[#E7EAF0] font-mono text-[10.5px]">
                    SHA256 Signed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#D8D1C5] dark:border-[#242C40] bg-[#F1EDE5] dark:bg-[#1B2233] text-center">
            <p className="text-[11px] text-[#66707C] dark:text-[#9BA4B8]">
              Automated telemetry stream · All evaluations enforce Human-in-the-Loop policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
