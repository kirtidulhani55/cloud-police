import React, { useEffect, useState } from 'react';
import { Menu, X, ShieldCheck, Sun, Moon } from 'lucide-react';
import { CloudPoliceIcon } from './CloudPoliceIcon';
import { ThemeMode } from '../../types';

interface MarketingNavProps {
  onOpenLogin: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const NAV_LINKS = [
  { label: 'Overview', href: '#overview', id: 'overview' },
  { label: 'How It Works', href: '#how-it-works', id: 'how-it-works' },
  { label: 'Capabilities', href: '#capabilities', id: 'capabilities' },
  { label: 'About the Developer', href: '#about-developer', id: 'about-developer' },
];

export const MarketingNav: React.FC<MarketingNavProps> = ({
  onOpenLogin,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const sections = NAV_LINKS.map((link) => document.getElementById(link.id)).filter(
      (section): section is HTMLElement => Boolean(section)
    );

    const updateActiveSection = () => {
      const navigationLine = 96;
      let currentSection = sections[0]?.id || 'overview';

      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= navigationLine) {
          currentSection = section.id;
        }
      });

      setActiveSection(currentSection);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FFFFFF]/90 dark:bg-[#0F2024]/90 backdrop-blur-md border-b border-[#D4E4E1] dark:border-[#29484C] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <a
          href="#overview"
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#137D78] dark:focus-visible:ring-[#35B3AA] rounded-lg p-1"
          aria-label="Cloud Police - Home"
        >
          <div className="w-9 h-9 rounded-lg bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] flex items-center justify-center text-[#137D78] dark:text-[#35B3AA] group-hover:border-[#137D78]/50 dark:group-hover:border-[#35B3AA]/50 transition-colors shadow-2xs">
            <CloudPoliceIcon size={20} className="text-[#137D78] dark:text-[#35B3AA]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
              Cloud Police
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECF5F3] dark:bg-[#183238] text-[#137D78] dark:text-[#35B3AA] border border-[#D4E4E1] dark:border-[#29484C]">
              AI Governance
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-[#5F7779] dark:text-[#9FB5B3]"
          aria-label="Main Navigation"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              data-active={activeSection === link.id}
              onClick={() => setActiveSection(link.id)}
              className="marketing-nav-link focus:outline-none"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions: Theme Toggle & Primary Button */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Button placed immediately before "Open Live Console" */}
          <button
            id="marketing-theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] text-[#5F7779] dark:text-[#9FB5B3] hover:text-[#137D78] dark:hover:text-[#35B3AA] hover:border-[#137D78]/40 dark:hover:border-[#35B3AA]/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#137D78] dark:focus-visible:ring-[#35B3AA] cursor-pointer shadow-2xs"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#D5A45A] hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-[#137D78] hover:rotate-12 transition-transform" />
            )}
          </button>

          <button
            onClick={onOpenLogin}
            className="h-10 px-5 rounded-lg bg-[#137D78] hover:bg-[#0F6965] dark:bg-[#35B3AA] dark:hover:bg-[#48C7BD] text-white dark:text-[#0F2024] font-semibold text-sm transition-colors flex items-center gap-2 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#137D78] dark:focus-visible:ring-[#35B3AA] active:scale-[0.99] cursor-pointer"
            id="nav-sign-in-btn"
          >
            <span>Sign In</span>
          </button>
        </div>

        {/* Mobile Header Controls */}
        <div className="flex items-center md:hidden gap-2">
          {/* Mobile Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] text-[#5F7779] dark:text-[#9FB5B3] hover:text-[#137D78] dark:hover:text-[#35B3AA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#137D78] dark:focus-visible:ring-[#35B3AA]"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#D5A45A]" />
            ) : (
              <Moon className="w-4 h-4 text-[#137D78]" />
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-lg bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] text-[#18373A] dark:text-[#E4EFED] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#137D78] dark:focus-visible:ring-[#35B3AA]"
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#ECF5F3] dark:bg-[#13282D] border-b border-[#D4E4E1] dark:border-[#29484C] px-4 py-5 space-y-4 transition-colors duration-200">
          <div className="flex items-center justify-between px-3 py-1">
            <div className="flex items-center gap-2 text-xs text-[#5F7779] dark:text-[#9FB5B3] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#137D78] dark:text-[#35B3AA]" />
              <span>AI Multi-Cloud Governance</span>
            </div>
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 text-xs text-[#18373A] dark:text-[#E4EFED] px-2 py-1 rounded bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C]"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#D5A45A]" />
                  <span>Light Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#137D78]" />
                  <span>Dark Theme</span>
                </>
              )}
            </button>
          </div>

          <nav className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                data-active={activeSection === link.id}
                onClick={() => {
                  setActiveSection(link.id);
                  setMobileMenuOpen(false);
                }}
                className="marketing-nav-link self-start px-3 py-2 text-base font-medium text-[#18373A] dark:text-[#E4EFED]"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLogin();
              }}
              className="marketing-nav-link self-start px-3 py-2 text-base font-medium text-[#18373A] dark:text-[#E4EFED] cursor-pointer"
            >
              Sign In
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
