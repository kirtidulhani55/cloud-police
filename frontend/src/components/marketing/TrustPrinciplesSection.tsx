import React from 'react';
import { UserCheck, FileCheck, RotateCcw } from 'lucide-react';

export const TrustPrinciplesSection: React.FC = () => {
  const principles = [
    {
      title: 'Human in Control',
      description:
        'Cloud Police prepares recommendations, but the final decision remains with the reviewer.',
      icon: UserCheck,
    },
    {
      title: 'Evidence Before Action',
      description:
        'Every diagnosis includes the events, resources, and infrastructure changes that support it.',
      icon: FileCheck,
    },
    {
      title: 'Clear Recovery Guidance',
      description:
        'Each remediation includes validation steps and a rollback plan.',
      icon: RotateCcw,
    },
  ];

  return (
    <section className="py-20 bg-[#ECF5F3] dark:bg-[#13282D] border-t border-[#D4E4E1] dark:border-[#29484C] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#137D78] dark:text-[#35B3AA]">
            Governance Standards
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
            Trust Principles
          </h2>
          <p className="text-base text-[#5F7779] dark:text-[#9FB5B3]">
            Engineered around strict human review boundaries and evidence-backed transparency.
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <div
                key={principle.title}
                className="bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-[#137D78]/50 dark:hover:border-[#35B3AA]/50 transition-colors shadow-2xs"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C] flex items-center justify-center text-[#137D78] dark:text-[#35B3AA] shadow-2xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#18373A] dark:text-[#E4EFED]">
                    {principle.title}
                  </h3>
                  <p className="text-sm text-[#5F7779] dark:text-[#9FB5B3] leading-relaxed">
                    {principle.description}
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
