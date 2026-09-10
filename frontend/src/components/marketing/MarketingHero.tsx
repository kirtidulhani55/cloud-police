import React from 'react';
import { CloudPoliceLogo } from '../CloudPoliceLogo';

interface MarketingHeroProps {
  onOpenLogin: () => void;
}

export const MarketingHero: React.FC<MarketingHeroProps> = ({ onOpenLogin }) => {
  return (
    <section
      id="overview"
      className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-[#F8FAFC] transition-colors duration-200 dark:bg-[#0B1120]"
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-20 text-center sm:px-8 sm:py-24">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-4">
            <CloudPoliceLogo size={58} className="h-[58px] w-[58px] shrink-0" />
            <div className="text-left">
              <p className="text-3xl font-bold tracking-tight text-[#172033] dark:text-[#E5E7EB] sm:text-4xl">
                Cloud Police
              </p>
              <p className="mt-2 text-sm font-semibold tracking-wide text-[#0F766E] dark:text-[#5EEAD4] sm:text-base">
                AI-Powered Multi-Cloud Governance
              </p>
            </div>
          </div>

          <h1 className="mt-10 max-w-4xl font-sans text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-[#172033] dark:text-[#F8FAFC] sm:text-6xl lg:text-7xl">
            Your clouds.
            <span className="block text-[#0F766E] dark:text-[#5EEAD4]">Under watch.</span>
          </h1>

          <p className="mt-7 w-full max-w-3xl text-left text-base leading-relaxed text-[#526174] dark:text-[#AAB6C5] sm:text-xl">
            Cloud Police detects incidents, cost spikes, and risky changes across your
            clouds. It explains the cause, recommends a safe next step, and keeps every
            decision under authorized human control.
          </p>

          <button
            type="button"
            onClick={onOpenLogin}
            className="mt-9 h-12 cursor-pointer rounded-lg bg-[#0F766E] px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#0B625C] dark:bg-[#2DD4BF] dark:text-[#0B1120] dark:hover:bg-[#5EEAD4]"
          >
            Sign In
          </button>

          <div className="mt-12 flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-[#DCE3EA] pt-5 text-xs font-medium text-[#64748B] dark:border-[#263244] dark:text-[#94A3B8]">
            <span>Multi-cloud monitoring</span>
            <span>Evidence-based diagnosis</span>
            <span>Authorized human decisions</span>
          </div>
        </div>
      </div>
    </section>
  );
};
