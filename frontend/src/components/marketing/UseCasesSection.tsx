import React from 'react';
import { ShieldAlert, TrendingDown, HelpCircle, CheckCheck, Lock } from 'lucide-react';

export const UseCasesSection: React.FC = () => {
  const useCases = [
    {
      title: 'Catch Cloud Misconfigurations',
      description:
        'Detect risky firewall rules, exposed resources, and access-control changes.',
      icon: ShieldAlert,
      iconColor: 'text-[#C8545E] dark:text-[#DD6B73]',
    },
    {
      title: 'Control Unexpected Cloud Spend',
      description:
        'Identify cost spikes, idle compute resources, and unusual daily spending.',
      icon: TrendingDown,
      iconColor: 'text-[#AD702F] dark:text-[#D5A45A]',
    },
    {
      title: 'Understand Infrastructure Failures',
      description:
        'Convert technical cloud logs into a plain-English root-cause explanation.',
      icon: HelpCircle,
      iconColor: 'text-[#4F7FA3] dark:text-[#6D9CC0]',
    },
    {
      title: 'Review Changes Safely',
      description:
        'Prepare remediation code while keeping execution under human control.',
      icon: CheckCheck,
      iconColor: 'text-[#2E8B75] dark:text-[#48B896]',
    },
  ];

  return (
    <section
      id="use-cases"
      className="py-20 bg-[#ECF5F3] dark:bg-[#13282D] border-t border-[#D4E4E1] dark:border-[#29484C] transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#137D78] dark:text-[#35B3AA]">
            Practical Applications
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
            Use Cases
          </h2>
          <p className="text-base text-[#5F7779] dark:text-[#9FB5B3]">
            Key operational scenarios where automated diagnosis and human review prevent costly cloud downtime.
          </p>
        </div>

        {/* Platform-Wide Principle Banner (Shown once, not repeated on every card) */}
        <div className="max-w-3xl mx-auto mb-10 p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] flex items-center justify-center gap-3 text-center text-xs sm:text-sm text-[#18373A] dark:text-[#E4EFED] shadow-2xs">
          <Lock className="w-4 h-4 text-[#137D78] dark:text-[#35B3AA] shrink-0" />
          <span>
            <strong className="font-semibold text-[#137D78] dark:text-[#35B3AA]">Platform-Wide Principle:</strong> Human-approved enforcement applies across every use case and remediation plan.
          </span>
        </div>

        {/* 4 Focused Use Case Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {useCases.map((uc) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.title}
                className="bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] rounded-2xl p-6 sm:p-8 flex items-start gap-5 hover:border-[#137D78]/50 dark:hover:border-[#35B3AA]/50 transition-colors shadow-2xs"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C] flex items-center justify-center shrink-0 shadow-2xs ${uc.iconColor}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#18373A] dark:text-[#E4EFED]">
                    {uc.title}
                  </h3>
                  <p className="text-sm text-[#5F7779] dark:text-[#9FB5B3] leading-relaxed">
                    {uc.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
