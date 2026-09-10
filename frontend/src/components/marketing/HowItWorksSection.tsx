import React from 'react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Detect',
      description: 'Cloud and cost signals are collected and monitored.',
    },
    {
      number: '02',
      title: 'Diagnose',
      description: 'AI agents connect related events and explain the root cause.',
    },
    {
      number: '03',
      title: 'Draft',
      description: 'A safe Terraform remediation and validation plan are prepared.',
    },
    {
      number: '04',
      title: 'Review',
      description: 'A human reviewer approves, rejects, or requests changes.',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 bg-[#ECF5F3] dark:bg-[#13282D] border-y border-[#D4E4E1] dark:border-[#29484C] relative transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#137D78] dark:text-[#35B3AA]">
            Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
            How It Works
          </h2>
          <p className="text-base text-[#5F7779] dark:text-[#9FB5B3]">
            A structured, human-in-the-loop lifecycle from real-time signal detection to validated remediation.
          </p>
        </div>

        {/* Four-step workflow: staggered on desktop, simple and vertical on mobile. */}
        <div className="relative pb-0 md:pb-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:gap-8">
          {steps.map((step, idx) => {
            const isLowerStep = idx % 2 === 1;
            return (
              <div
                key={step.number}
                className={`relative z-10 group ${isLowerStep ? 'md:translate-y-10' : ''}`}
              >
                {/* Angled connector and arrow between desktop workflow steps. */}
                {idx < steps.length - 1 && (
                  <div
                    className={`hidden md:block absolute right-[-2rem] top-[5.5rem] h-px w-8 origin-left bg-[#9CCFC8] dark:bg-[#3F7F7A] ${
                      isLowerStep ? '-rotate-[35deg]' : 'rotate-[35deg]'
                    }`}
                    aria-hidden="true"
                  >
                    <span className="absolute -right-0.5 -top-[3px] h-2 w-2 rotate-45 border-r border-t border-[#137D78] dark:border-[#35B3AA]" />
                  </div>
                )}

                <div className="relative z-10 bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] rounded-2xl p-6 sm:p-7 flex flex-col h-full hover:border-[#137D78]/40 dark:hover:border-[#35B3AA]/40 transition-colors shadow-2xs">
                  {/* Step Number */}
                  <div className="flex items-center mb-6">
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ECF5F3] dark:bg-[#13282D] text-[#5F7779] dark:text-[#9FB5B3] border border-[#D4E4E1] dark:border-[#29484C]">
                      Step {step.number}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-[#18373A] dark:text-[#E4EFED] mb-2.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#5F7779] dark:text-[#9FB5B3] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
};
