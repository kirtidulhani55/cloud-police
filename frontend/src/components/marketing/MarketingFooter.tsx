import React from 'react';
import { CloudPoliceIcon } from './CloudPoliceIcon';

interface MarketingFooterProps {
  onLaunchDemoConsole: () => void;
}

export const MarketingFooter: React.FC<MarketingFooterProps> = ({
  onLaunchDemoConsole,
}) => {
  return (
    <footer className="bg-[#F4FAF9] dark:bg-[#0F2024] border-t border-[#D4E4E1] dark:border-[#29484C] py-10 text-sm text-[#5F7779] dark:text-[#9FB5B3] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] flex items-center justify-center text-[#137D78] dark:text-[#35B3AA] shadow-2xs">
              <CloudPoliceIcon size={18} className="text-[#137D78] dark:text-[#35B3AA]" />
            </div>
            <div>
              <span className="font-bold text-[#18373A] dark:text-[#E4EFED] tracking-tight block text-base">
                Cloud Police
              </span>
              <span className="text-xs text-[#5F7779] dark:text-[#9FB5B3]">
                AI-Powered Multi-Cloud Governance
              </span>
            </div>
          </div>

          {/* Minimal Clean Links */}
          <nav
            className="flex items-center gap-6 text-sm text-[#5F7779] dark:text-[#9FB5B3]"
            aria-label="Footer Navigation"
          >
            <a
              href="#overview"
              className="hover:text-[#18373A] dark:hover:text-[#E4EFED] transition-colors focus:outline-none focus-visible:text-[#137D78] dark:focus-visible:text-[#35B3AA]"
            >
              Overview
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#18373A] dark:hover:text-[#E4EFED] transition-colors focus:outline-none focus-visible:text-[#137D78] dark:focus-visible:text-[#35B3AA]"
            >
              How It Works
            </a>
            <a
              href="#architecture"
              className="hover:text-[#18373A] dark:hover:text-[#E4EFED] transition-colors focus:outline-none focus-visible:text-[#137D78] dark:focus-visible:text-[#35B3AA]"
            >
              Architecture
            </a>
            <button
              onClick={onLaunchDemoConsole}
              className="hover:text-[#137D78] dark:hover:text-[#35B3AA] text-[#137D78] dark:text-[#35B3AA] font-medium transition-colors focus:outline-none focus-visible:underline cursor-pointer"
            >
              Open Console
            </button>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-[#D4E4E1] dark:border-[#29484C]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-[#5F7779] dark:text-[#9FB5B3] gap-4">
          <p>© {new Date().getFullYear()} Cloud Police. Human-in-the-loop multi-cloud governance.</p>
          <p className="font-mono text-[11px] text-[#5F7779] dark:text-[#9FB5B3]/80">
            Live Cloud Telemetry · ADK Agent Reasoning · Review-Gated Execution
          </p>
        </div>
      </div>
    </footer>
  );
};
