import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  FileCheck2,
  Network,
  Server,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  Cloud,
  CheckCircle2,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { GLOBAL_SEARCH_ITEMS, SearchItem } from '../data/searchData';
import { SearchCategoryFilter, ThemeMode } from '../types';
import { CloudPoliceLogo } from './CloudPoliceLogo';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: SearchCategoryFilter;
  onCategoryChange: (cat: SearchCategoryFilter) => void;
  selectedCloudProvider: string | null;
  onCloudProviderChange: (provider: string | null) => void;
  onSelectSearchItem: (item: SearchItem) => void;
  onResetSearch: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSignOut: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCloudProvider,
  onCloudProviderChange,
  onSelectSearchItem,
  onResetSearch,
  theme,
  onToggleTheme,
  onSignOut,
  onToggleMobileSidebar,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCloudsDropdownOpen, setIsCloudsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const cloudsMenuRef = useRef<HTMLDivElement>(null);

  // Detect platform for keyboard shortcuts (⌘K vs Ctrl K)
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const isApple = /Mac|iPod|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
      setIsMac(isApple);
    }
  }, []);

  // Global Keyboard shortcut: Press ⌘K, Ctrl+K or / to focus search bar
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
        setIsMobileSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsMobileSearchOpen(false);
        setIsCloudsDropdownOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        cloudsMenuRef.current &&
        !cloudsMenuRef.current.contains(e.target as Node)
      ) {
        setIsCloudsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items in real time
  const filteredItems = GLOBAL_SEARCH_ITEMS.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }

    if (
      selectedCloudProvider &&
      selectedCloudProvider !== 'ALL' &&
      item.provider !== selectedCloudProvider &&
      item.provider !== 'Multi-Cloud'
    ) {
      return false;
    }

    if (!searchQuery.trim()) {
      return true;
    }

    const q = searchQuery.toLowerCase().trim();
    const titleMatch = item.title.toLowerCase().includes(q);
    const descMatch = item.description.toLowerCase().includes(q);
    const idMatch = item.id.toLowerCase().includes(q);
    const providerMatch = item.provider.toLowerCase().includes(q);
    const policyCodeMatch = item.policyCode?.toLowerCase().includes(q) || false;
    const resourceTypeMatch = item.resourceType?.toLowerCase().includes(q) || false;
    const tagMatch = item.tags.some((tag) => tag.toLowerCase().includes(q));

    return (
      titleMatch ||
      descMatch ||
      idMatch ||
      providerMatch ||
      policyCodeMatch ||
      resourceTypeMatch ||
      tagMatch
    );
  });

  const countAll = GLOBAL_SEARCH_ITEMS.length;
  const countIncidents = GLOBAL_SEARCH_ITEMS.filter((i) => i.category === 'INCIDENT').length;
  const countResources = GLOBAL_SEARCH_ITEMS.filter((i) => i.category === 'RESOURCE').length;
  const countPolicies = GLOBAL_SEARCH_ITEMS.filter((i) => i.category === 'POLICY').length;

  const handleSelectItem = (item: SearchItem) => {
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
    onSelectSearchItem(item);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span
          key={idx}
          className="bg-[#B8720A]/20 dark:bg-[#35B3AA]/25 text-[#B8720A] dark:text-[#35B3AA] font-bold px-0.5 rounded"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <header className="w-full bg-[#FCFAF7] dark:bg-[#13272C] border-b border-[#EAE6DD] dark:border-[#29484C] sticky top-0 z-30 transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto h-14 px-4 sm:px-6 lg:px-7 flex items-center justify-between gap-3 sm:gap-4">
        {/* 1. LEFT: Brand */}
        <div id="header-brand-area" className="flex items-center gap-3 shrink-0 select-none">
          {/* Mobile Sidebar Hamburger */}
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              id="btn-mobile-sidebar-toggle"
              className="lg:hidden p-1.5 rounded-lg bg-[#FFF4DF] dark:bg-[#183238] border border-[#EAE6DD] dark:border-[#29484C] text-[#2B2417] dark:text-[#E4EFED] hover:bg-[#F3E7D1] dark:hover:bg-[#1D3B41] transition-colors cursor-pointer"
              title="Toggle Sidebar Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="shrink-0 flex items-center justify-center">
              <CloudPoliceLogo size={32} className="w-[32px] h-[32px]" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[#2B2417] dark:text-[#E4EFED] tracking-tight leading-none text-base sm:text-lg font-bold">
                  Cloud Police
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.2 rounded-full bg-[#FFF4DF] dark:bg-[#183238] text-[#B8720A] dark:text-[#35B3AA] border border-[#EAE6DD] dark:border-[#29484C]">
                  Copilot
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CENTER: Clean Compact Global Search */}
        <div
          className="hidden md:flex flex-1 max-w-sm relative items-center justify-center my-auto"
          ref={searchContainerRef}
        >
          <div className="relative flex items-center h-8.5 w-full">
            <div className="absolute left-2.5 text-[#7B7468] dark:text-[#B2C5C3] pointer-events-none flex items-center justify-center">
              <Search className="w-3.5 h-3.5" />
            </div>

            <input
              ref={searchInputRef}
              id="global-search-input"
              type="text"
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsDropdownOpen(true);
              }}
              placeholder="Search incidents, policies, resources..."
              className="w-full h-8.5 pl-8.5 pr-14 bg-transparent text-[#2B2417] dark:text-[#E4EFED] placeholder-[#7B7468] dark:placeholder-[#B2C5C3] text-xs rounded-none border-0 border-b border-[#EAE6DD] dark:border-[#29484C] focus:border-[#B8720A] dark:focus:border-[#35B3AA] outline-none transition-colors"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={onResetSearch}
                  className="p-1 text-[#7B7468] dark:text-[#B2C5C3] hover:text-[#2B2417] dark:hover:text-[#E4EFED] rounded transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#7B7468] dark:text-[#B2C5C3] bg-[#FFF4DF] dark:bg-[#13282D] border border-[#EAE6DD] dark:border-[#29484C] rounded select-none">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </div>
          </div>

          {/* Search Dropdown */}
          {isDropdownOpen && (
            <div
              id="search-results-dropdown"
              className="absolute top-full left-0 right-0 mt-2 bg-[#FFFFFF] dark:bg-[#183238] border border-[#EAE6DD] dark:border-[#29484C] rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in"
            >
              {/* Category Pills */}
              <div className="p-2 bg-[#FFF4DF] dark:bg-[#13282D] border-b border-[#EAE6DD] dark:border-[#29484C] flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => onCategoryChange('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === 'ALL'
                      ? 'bg-[#B8720A] dark:bg-[#35B3AA] text-white dark:text-[#0F2024] font-semibold'
                      : 'text-[#7B7468] dark:text-[#B2C5C3] hover:bg-[#FFFFFF] dark:hover:bg-[#183238] hover:text-[#2B2417] dark:hover:text-[#E4EFED]'
                  }`}
                >
                  All ({countAll})
                </button>
                <button
                  type="button"
                  onClick={() => onCategoryChange('INCIDENT')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === 'INCIDENT'
                      ? 'bg-[#B8720A] dark:bg-[#35B3AA] text-white dark:text-[#0F2024] font-semibold'
                      : 'text-[#7B7468] dark:text-[#B2C5C3] hover:bg-[#FFFFFF] dark:hover:bg-[#183238] hover:text-[#2B2417] dark:hover:text-[#E4EFED]'
                  }`}
                >
                  Incidents ({countIncidents})
                </button>
                <button
                  type="button"
                  onClick={() => onCategoryChange('RESOURCE')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === 'RESOURCE'
                      ? 'bg-[#B8720A] dark:bg-[#35B3AA] text-white dark:text-[#0F2024] font-semibold'
                      : 'text-[#7B7468] dark:text-[#B2C5C3] hover:bg-[#FFFFFF] dark:hover:bg-[#183238] hover:text-[#2B2417] dark:hover:text-[#E4EFED]'
                  }`}
                >
                  Resources ({countResources})
                </button>
                <button
                  type="button"
                  onClick={() => onCategoryChange('POLICY')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === 'POLICY'
                      ? 'bg-[#B8720A] dark:bg-[#35B3AA] text-white dark:text-[#0F2024] font-semibold'
                      : 'text-[#7B7468] dark:text-[#B2C5C3] hover:bg-[#FFFFFF] dark:hover:bg-[#183238] hover:text-[#2B2417] dark:hover:text-[#E4EFED]'
                  }`}
                >
                  Policies ({countPolicies})
                </button>
              </div>

              {/* Items List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-[#EAE6DD] dark:divide-[#29484C]">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className="p-3 hover:bg-[#FFF4DF] dark:hover:bg-[#13282D] transition-colors cursor-pointer flex items-start gap-3 group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#FFF4DF] dark:bg-[#13282D] border border-[#EAE6DD] dark:border-[#29484C] text-[#B8720A] dark:text-[#35B3AA] flex items-center justify-center shrink-0 mt-0.5">
                        {item.category === 'INCIDENT' && <Network className="w-3.5 h-3.5" />}
                        {item.category === 'RESOURCE' && <Server className="w-3.5 h-3.5" />}
                        {item.category === 'POLICY' && <FileCheck2 className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#FFF4DF] dark:bg-[#13282D] border border-[#EAE6DD] dark:border-[#29484C] text-[#7B7468] dark:text-[#B2C5C3]">
                            {item.provider}
                          </span>
                          <span className="text-xs font-semibold text-[#2B2417] dark:text-[#E4EFED] group-hover:text-[#B8720A] dark:group-hover:text-[#35B3AA] truncate transition-colors">
                            {highlightMatch(item.title, searchQuery)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7B7468] dark:text-[#B2C5C3] line-clamp-1">
                          {highlightMatch(item.description, searchQuery)}
                        </p>
                      </div>
                      <span className="text-xs text-[#2B2417] dark:text-[#35B3AA] font-medium group-hover:underline shrink-0 self-center flex items-center gap-0.5">
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-[#7B7468] dark:text-[#B2C5C3]">
                    No results found for "{searchQuery}".
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. RIGHT: global cloud scope, theme and sign-out controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => {
              setIsMobileSearchOpen(!isMobileSearchOpen);
              setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
            }}
            className="md:hidden p-2 rounded-lg bg-[#FFFFFF] dark:bg-[#183238] border border-[#EAE6DD] dark:border-[#29484C] text-[#2B2417] dark:text-[#E4EFED]"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Global scope: this choice follows the user across every console page. */}
          <div className="relative" ref={cloudsMenuRef}>
            <button
              onClick={() => setIsCloudsDropdownOpen(!isCloudsDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FFFFFF] dark:bg-[#183238] hover:bg-[#FFF4DF] dark:hover:bg-[#13282D] text-[#2B2417] dark:text-[#E4EFED] border border-[#EAE6DD] dark:border-[#29484C] rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
              title="Choose the cloud data shown across the console"
            >
              <span className="w-2 h-2 rounded-full bg-[#2E8B75] dark:bg-[#48B896] shrink-0" />
              <span className="whitespace-nowrap">
                {selectedCloudProvider ? `Viewing: ${selectedCloudProvider}` : 'Viewing: All Clouds'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#7B7468] dark:text-[#B2C5C3]" />
            </button>

            {/* Clouds Popover */}
            {isCloudsDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-[#FFFFFF] dark:bg-[#183238] rounded-xl shadow-xl border border-[#EAE6DD] dark:border-[#29484C] z-50 space-y-2 animate-fade-in text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#EAE6DD] dark:border-[#29484C]">
                  <span className="font-semibold text-[#2B2417] dark:text-[#E4EFED]">Cloud data scope</span>
                  <span className="text-[10px] text-[#2E8B75] dark:text-[#48B896] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Read-Only
                  </span>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onCloudProviderChange(null);
                      setIsCloudsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left cursor-pointer ${
                      selectedCloudProvider === null
                        ? 'bg-[#FFF4DF] dark:bg-[#13282D] text-[#B8720A] dark:text-[#35B3AA] font-semibold'
                        : 'hover:bg-[#FFF4DF] dark:hover:bg-[#13282D] text-[#2B2417] dark:text-[#E4EFED]'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-xs">All Clouds</p>
                      <p className="text-[10px] text-[#7B7468] dark:text-[#B2C5C3]">AWS, Azure and GCP</p>
                    </div>
                    <span className="text-[10px] text-[#7B7468] dark:text-[#B2C5C3]">
                      {selectedCloudProvider === null ? 'Active' : 'View'}
                    </span>
                  </button>
                  {[
                    { id: 'Azure', name: 'Microsoft Azure', region: 'East US', status: 'Live Telemetry' },
                    { id: 'AWS', name: 'Amazon Web Services', region: 'us-east-1', status: 'Live Telemetry' },
                    { id: 'GCP', name: 'Google Cloud Platform', region: 'us-central1', status: 'Live Telemetry' },
                  ].map((cloud) => (
                    <button
                      key={cloud.id}
                      onClick={() => {
                        onCloudProviderChange(selectedCloudProvider === cloud.id ? null : cloud.id);
                        setIsCloudsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left cursor-pointer ${
                        selectedCloudProvider === cloud.id
                          ? 'bg-[#FFF4DF] dark:bg-[#13282D] text-[#B8720A] dark:text-[#35B3AA] font-semibold'
                          : 'hover:bg-[#FFF4DF] dark:hover:bg-[#13282D] text-[#2B2417] dark:text-[#E4EFED]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E8B75] dark:bg-[#48B896]" />
                        <div>
                          <p className="font-medium text-xs">{cloud.name}</p>
                          <p className="text-[10px] text-[#7B7468] dark:text-[#B2C5C3]">{cloud.region}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#7B7468] dark:text-[#B2C5C3]">
                        {selectedCloudProvider === cloud.id ? 'Active' : 'View'}
                      </span>
                    </button>
                  ))}
                </div>

                {selectedCloudProvider && (
                  <button
                    onClick={() => {
                      onCloudProviderChange(null);
                      setIsCloudsDropdownOpen(false);
                    }}
                    className="w-full mt-1 text-center py-1 text-[11px] text-[#B8720A] dark:text-[#35B3AA] hover:underline font-medium"
                  >
                    Reset Cloud Filter
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle (Sun/Moon icon button) */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFFFFF] dark:bg-[#183238] hover:bg-[#FFF4DF] dark:hover:bg-[#13282D] text-[#2B2417] dark:text-[#E4EFED] border border-[#EAE6DD] dark:border-[#29484C] transition-colors cursor-pointer shadow-2xs"
            aria-label={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-[#2B2417]" />
            ) : (
              <Sun className="w-4 h-4 text-[#E4EFED]" />
            )}
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#EAE6DD] bg-white px-2.5 text-xs font-semibold text-[#B3454F] shadow-2xs transition-colors hover:border-[#C8545E]/40 hover:bg-[#C8545E]/10 dark:border-[#29484C] dark:bg-[#183238] dark:text-[#F08A91]"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Expandable */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-[#EAE6DD] dark:border-[#29484C] bg-[#FCFAF7] dark:bg-[#13272C]">
          <div className="relative flex items-center h-9 w-full">
            <div className="absolute left-3 text-[#7B7468] dark:text-[#B2C5C3] pointer-events-none flex items-center justify-center">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsDropdownOpen(true);
              }}
              placeholder="Search incidents, resources, changes..."
              className="w-full h-9 pl-9 pr-10 bg-[#FFFFFF] dark:bg-[#183238] text-[#2B2417] dark:text-[#E4EFED] placeholder-[#7B7468] dark:placeholder-[#B2C5C3] text-xs rounded-lg border border-[#EAE6DD] dark:border-[#29484C] focus:border-[#B8720A] dark:focus:border-[#35B3AA] outline-none"
            />
            {searchQuery && (
              <button
                onClick={onResetSearch}
                className="absolute right-3 p-1 text-[#7B7468] dark:text-[#B2C5C3]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
