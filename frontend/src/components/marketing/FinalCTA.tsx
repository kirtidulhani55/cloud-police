import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface FinalCTAProps {
  onLaunchDemoConsole: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onLaunchDemoConsole }) => {
  return (
    <section className="py-20 bg-[#F4FAF9] dark:bg-[#0F2024] border-t border-[#D4E4E1] dark:border-[#29484C] relative overflow-hidden transition-colors duration-200">
      {/* Subtle ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#137D78]/5 dark:bg-[#35B3AA]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C] text-xs font-medium text-[#137D78] dark:text-[#35B3AA] shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-[#137D78] dark:text-[#35B3AA]" />
          <span>Interactive Live Environment</span>
        </div>

        {/* Exact Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED] leading-tight">
          See the issue. Understand the cause. Review the fix.
        </h2>

        {/* Exact Supporting Text */}
        <p className="text-base sm:text-lg text-[#5F7779] dark:text-[#9FB5B3] max-w-2xl mx-auto leading-relaxed">
          Open the Cloud Police console to explore incident diagnosis, cost analysis,
          and human-reviewed remediation in one place.
        </p>

        {/* Primary Action Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={onLaunchDemoConsole}
            className="h-12 px-8 rounded-lg bg-[#137D78] hover:bg-[#0F6965] dark:bg-[#35B3AA] dark:hover:bg-[#48C7BD] text-white dark:text-[#0F2024] font-semibold text-base transition-colors flex items-center gap-2.5 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#137D78] dark:focus-visible:ring-[#35B3AA] active:scale-[0.99] cursor-pointer"
            id="final-open-console-btn"
          >
            <span>Open Cloud Police Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
