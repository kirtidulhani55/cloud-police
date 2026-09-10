import React from 'react';

export const CapabilitiesSection: React.FC = () => {
  const capabilities = [
    {
      id: 'diagnosis',
      title: 'Catch Cloud Misconfigurations',
      description:
        'Find risky firewall rules, exposed services, and access changes across connected clouds.',
      tag: 'Root-Cause Analysis',
    },
    {
      id: 'cost',
      title: 'Control Unexpected Cloud Spend',
      description:
        'Spot cost spikes, idle resources, and unusual spending against a normal baseline.',
      tag: 'Telemetry & Baselines',
    },
    {
      id: 'change',
      title: 'Understand Infrastructure Failures',
      description:
        'Connect cloud logs, tests, and Terraform history into a plain-English root cause.',
      tag: 'Infrastructure Audit',
    },
    {
      id: 'remediation',
      title: 'Review Changes Safely',
      description:
        'Prepare Terraform remediation, validation, and rollback steps for human approval.',
      tag: 'Review-Ready Code',
    },
  ];

  return (
    <section id="capabilities" className="py-20 bg-[#F4FAF9] dark:bg-[#0F2024] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#137D78] dark:text-[#35B3AA]">
            Core Platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
            What Cloud Police Handles
          </h2>
          <p className="text-base text-[#5F7779] dark:text-[#9FB5B3]">
            Practical multi-cloud intelligence designed to shorten incident resolution time while preserving human control.
          </p>
        </div>

        {/* 4 Clean Capability Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {capabilities.map((cap) => {
            return (
              <div
                key={cap.id}
                className="bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-[#137D78]/50 dark:hover:border-[#35B3AA]/50 transition-colors shadow-2xs"
              >
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-[#ECF5F3] dark:bg-[#13282D] text-[#5F7779] dark:text-[#9FB5B3] border border-[#D4E4E1] dark:border-[#29484C]">
                      {cap.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#18373A] dark:text-[#E4EFED] pt-1">
                    {cap.title}
                  </h3>

                  <p className="text-sm text-[#5F7779] dark:text-[#9FB5B3] leading-relaxed">
                    {cap.description}
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
