import React from 'react';
import { MarketingNav } from './marketing/MarketingNav';
import { MarketingHero } from './marketing/MarketingHero';
import { HowItWorksSection } from './marketing/HowItWorksSection';
import { CapabilitiesSection } from './marketing/CapabilitiesSection';
import { AboutDeveloperSection } from './marketing/AboutDeveloperSection';
import { ThemeMode } from '../types';
import { PublicFooter, PublicPageId } from './marketing/PublicFooter';

interface MarketingSiteProps {
  onOpenLogin: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onNavigate: (page: PublicPageId) => void;
}

export const MarketingSite: React.FC<MarketingSiteProps> = ({
  onOpenLogin,
  theme,
  onToggleTheme,
  onNavigate,
}) => {
  return (
    <div className="marketing-site min-h-screen bg-[#EEF2F1] dark:bg-[#0F2024] text-[#2B2417] dark:text-[#E4EFED] selection:bg-[#B8720A]/25 dark:selection:bg-[#35B3AA]/30 selection:text-[#B8720A] dark:selection:text-white flex flex-col font-sans transition-colors duration-200">
      {/* 1. Sticky Header with Sun/Moon Theme Toggle */}
      <MarketingNav
        onOpenLogin={onOpenLogin}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      {/* 2. Hero Section with Real Azure Incident Review Interface */}
      <MarketingHero
        onOpenLogin={onOpenLogin}
      />

      {/* 3. How It Works (4-Step Horizontal Workflow) */}
      <HowItWorksSection />

      {/* 4. Capabilities (4 Clean Capability Cards) */}
      <CapabilitiesSection />

      {/* 5. Public developer introduction */}
      <AboutDeveloperSection />

      <PublicFooter onNavigate={onNavigate} onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
    </div>
  );
};
