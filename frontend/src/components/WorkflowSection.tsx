import React from 'react';
import { Search, Stethoscope, Lightbulb, UserCheck, ChevronRight } from 'lucide-react';

export const WorkflowSection: React.FC = () => {
  const steps = [
    {
      step: '1',
      title: 'Detect',
      icon: Search,
      summary:
        'Analyzes firewall logs, connectivity tests, cost records and proposed infrastructure changes stored in BigQuery.',
    },
    {
      step: '2',
      title: 'Diagnose',
      icon: Stethoscope,
      summary:
        'Pinpoints the exact root cause in plain English with multi-cloud telemetry and evidence verification.',
    },
    {
      step: '3',
      title: 'Recommend',
      icon: Lightbulb,
      summary:
        'Creates an evidence-based remediation proposal with validation steps and rollback guidance.',
    },
    {
      step: '4',
      title: 'Human Review',
      icon: UserCheck,
      summary:
        'Requires human operator approval before any cloud configuration or infrastructure change is modified.',
    },
  ];

  return (
    <section id="workflow-pipeline-section" className="bg-[#FFFEFB] dark:bg-[#131826] rounded-xl p-4 sm:p-5 border border-[#D8D1C5] dark:border-[#242C40] shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#20242A] dark:text-[#E7EAF0]">
            How Cloud Police Works
          </h2>
          <p className="text-xs text-[#66707C] dark:text-[#9BA4B8]">
            Four-step governance pipeline built on transparency, safety, and mandatory human authorization.
          </p>
        </div>
        <span className="text-[10px] font-bold text-[#16A085] dark:text-[#3DD68C] bg-[#16A085]/10 dark:bg-[#3DD68C]/15 border border-[#16A085]/20 dark:border-[#3DD68C]/30 px-2 py-0.5 rounded self-start sm:self-auto font-mono">
          Read-Only Guardrail Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 relative">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              id={`workflow-step-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-[#F1EDE5] dark:bg-[#1B2233] rounded-lg p-3 sm:p-3.5 border border-[#D8D1C5] dark:border-[#242C40] flex flex-col justify-between relative group hover:border-[#B8720A] dark:hover:border-[#E3A63E] transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#FFFEFB] dark:bg-[#131826] border border-[#D8D1C5] dark:border-[#242C40] flex items-center justify-center text-[#20242A] dark:text-[#E3A63E] shadow-2xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-[#66707C] dark:text-[#9BA4B8] font-mono">
                    Step 0{item.step}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-[#20242A] dark:text-[#E7EAF0]">
                    {item.title}
                  </span>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-[#66707C] dark:text-[#6B7387] hidden lg:inline-block group-hover:text-[#B8720A] dark:group-hover:text-[#E3A63E] transition-colors" />
                  )}
                </div>

                <p className="text-[11px] text-[#66707C] dark:text-[#9BA4B8] leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {index === 3 && (
                <div className="mt-2.5 pt-2 border-t border-[#16A085]/30 dark:border-[#3DD68C]/30 text-[10px] font-semibold text-[#16A085] dark:text-[#3DD68C] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A085] dark:bg-[#3DD68C]"></span>
                  <span>Human-in-the-Loop Enforced</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
