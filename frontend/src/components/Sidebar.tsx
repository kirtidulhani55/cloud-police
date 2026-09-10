import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  TrendingUp,
  FileCheck2,
  UserCheck,
  UsersRound,
  Database,
  ChevronRight,
  ChevronLeft,
  CircleUserRound,
  SlidersHorizontal,
  ShieldCheck,
  LogOut,
  ChevronUp,
  X,
  CircleHelp,
} from 'lucide-react';
import { SidebarNavId } from '../types';

interface SidebarProps {
  activeNav: SidebarNavId;
  onSelectNav: (nav: SidebarNavId) => void;
  activeIncidentsCount: number;
  costAtRisk: string;
  proposedChangesCount: number;
  awaitingApprovalCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isAdmin: boolean;
  currentUserName: string;
  currentUserEmail: string;
  currentUserRole: string;
  onSelectAccountAction: (action: 'profile' | 'preferences' | 'security') => void;
  onSignOut: () => void;
  onOpenHelp: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  activeIncidentsCount,
  awaitingApprovalCount,
  isCollapsed,
  onToggleCollapse,
  isAdmin,
  currentUserName,
  currentUserEmail,
  currentUserRole,
  onSelectAccountAction,
  onSignOut,
  onOpenHelp,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 6 Clean Navigation Items
  const navItems: {
    id: SidebarNavId;
    label: string;
    icon: React.ElementType;
    attentionBadge?: string;
    badgeType?: 'critical' | 'warning';
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: ShieldAlert,
      attentionBadge: activeIncidentsCount > 0 ? `${activeIncidentsCount}` : undefined,
      badgeType: 'critical',
    },
    {
      id: 'cost',
      label: 'Cost Intelligence',
      icon: TrendingUp,
    },
    {
      id: 'changes',
      label: 'Change Inspector',
      icon: FileCheck2,
    },
    {
      id: 'approvals',
      label: 'Reviewer Approvals',
      icon: UserCheck,
      attentionBadge: awaitingApprovalCount > 0 ? `${awaitingApprovalCount}` : undefined,
      badgeType: 'warning',
    },
    {
      id: 'evidence',
      label: 'Evidence',
      icon: Database,
    },
  ];

  // Map aliases
  const normalizedActive =
    activeNav === 'home'
      ? 'overview'
      : activeNav === 'history_evidence'
      ? 'evidence'
      : activeNav;

  const accountItems: {
    id: 'profile' | 'preferences' | 'security';
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: 'profile', label: 'My Profile', icon: CircleUserRound },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  const sidebarContent = (
    <div className="console-sidebar-surface flex flex-col h-full w-full bg-[#EEF2F1] dark:bg-[#111F2B] text-[#2B2417] dark:text-[#E4EFED] transition-colors duration-200">
      {/* Top Navigation Section */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-3">
        {/* Header / Collapse Toggle */}
        <div className="flex items-center justify-between px-2 pt-1 pb-1">
          {!isCollapsed ? (
            <span className="text-[11px] font-semibold text-[#7B7468] dark:text-[#B2C5C3] uppercase tracking-wider select-none">
              Console
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-[#7B7468] dark:text-[#B2C5C3] mx-auto uppercase">
              CP
            </span>
          )}

          {/* Desktop Collapse / Expand Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            id="sidebar-toggle-btn"
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md bg-[#FFFFFF] dark:bg-[#183238] hover:bg-[#F3E7D1] dark:hover:bg-[#1D3B41] text-[#7B7468] dark:text-[#B2C5C3] border border-[#EAE6DD] dark:border-[#29484C] transition-colors cursor-pointer shadow-2xs ml-auto"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-[#B8720A] dark:text-[#35B3AA]" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md bg-[#FFFFFF] dark:bg-[#183238] text-[#7B7468] dark:text-[#B2C5C3] border border-[#EAE6DD] dark:border-[#29484C]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1" aria-label="Console Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = normalizedActive === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectNav(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                title={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer select-none text-left relative ${
                  isSelected
                    ? 'bg-[#FFFFFF] dark:bg-[#183238] text-[#B8720A] dark:text-[#35B3AA] font-semibold shadow-2xs border-l-2 border-[#B8720A] dark:border-[#35B3AA]'
                    : 'text-[#7B7468] dark:text-[#B2C5C3] hover:text-[#2B2417] dark:hover:text-[#E4EFED] hover:bg-[#FFFFFF]/60 dark:hover:bg-[#183238]/60 font-medium'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isSelected
                      ? 'text-[#B8720A] dark:text-[#35B3AA]'
                      : 'text-[#7B7468] dark:text-[#B2C5C3]'
                  }`}
                />

                {!isCollapsed && (
                  <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                  </span>
                )}

                {/* Attention Badges (Only shown for items requiring attention) */}
                {!isCollapsed && item.attentionBadge && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      item.badgeType === 'critical'
                        ? 'bg-[#C8545E]/15 text-[#C8545E] dark:text-[#DD6B73]'
                        : 'bg-[#B8720A]/15 text-[#B8720A] dark:text-[#D5A45A]'
                    }`}
                  >
                    {item.attentionBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Account and personal controls stay anchored at the bottom. */}
      <div className="mt-auto shrink-0 space-y-2 border-t border-[#EAE6DD] p-3 dark:border-[#29484C]">
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              onSelectNav('admin_users');
              if (onCloseMobile) onCloseMobile();
            }}
            title="User Management"
            className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-all ${
              normalizedActive === 'admin_users'
                ? 'border-l-2 border-[#B8720A] bg-white font-semibold text-[#B8720A] shadow-2xs dark:border-[#35B3AA] dark:bg-[#183238] dark:text-[#35B3AA]'
                : 'font-medium text-[#7B7468] hover:bg-white/60 hover:text-[#2B2417] dark:text-[#B2C5C3] dark:hover:bg-[#183238]/60 dark:hover:text-[#E4EFED]'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <UsersRound className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="truncate">User Management</span>}
          </button>
        )}

        <div ref={accountMenuRef} className="relative">
          {isAccountMenuOpen && (
            <nav
              className={`absolute z-40 space-y-1 rounded-xl border border-[#EAE6DD] bg-white p-1.5 shadow-xl dark:border-[#29484C] dark:bg-[#183238] ${
                isCollapsed
                  ? 'bottom-0 left-full ml-2 w-52'
                  : 'bottom-full left-0 mb-2 w-full'
              }`}
              aria-label="Account settings"
            >
              {accountItems.map((item) => {
                const Icon = item.icon;
                const isSelected = normalizedActive === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onSelectAccountAction(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#FFF4DF] text-[#B8720A] dark:bg-[#13282D] dark:text-[#35B3AA]'
                        : 'text-[#7B7468] hover:bg-[#FFF4DF] hover:text-[#2B2417] dark:text-[#B2C5C3] dark:hover:bg-[#13282D] dark:hover:text-[#E4EFED]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="my-1 border-t border-[#EAE6DD] dark:border-[#29484C]" />

              <button
                type="button"
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  onOpenHelp();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#7B7468] transition-colors hover:bg-[#FFF4DF] hover:text-[#2B2417] dark:text-[#B2C5C3] dark:hover:bg-[#13282D] dark:hover:text-[#E4EFED]"
              >
                <CircleHelp className="h-4 w-4 shrink-0" />
                <span>Help &amp; Legal</span>
              </button>

              <div className="my-1 border-t border-[#EAE6DD] dark:border-[#29484C]" />

              <button
                type="button"
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  onSignOut();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#B3454F] transition-colors hover:bg-[#C8545E]/10 dark:text-[#F08A91]"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sign out</span>
              </button>
            </nav>
          )}

          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((current) => !current)}
            className={`flex w-full items-center gap-2.5 rounded-lg border border-[#EAE6DD] bg-white/75 p-2 text-left transition-colors hover:bg-white dark:border-[#29484C] dark:bg-[#183238]/75 dark:hover:bg-[#183238] ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={`${currentUserName} · ${currentUserRole}`}
            aria-expanded={isAccountMenuOpen}
            aria-haspopup="menu"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8720A] text-xs font-bold uppercase text-white dark:bg-[#35B3AA] dark:text-[#0F2024]">
              {currentUserName.trim().charAt(0) || currentUserEmail.charAt(0)}
            </div>
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-[#2B2417] dark:text-[#E4EFED]">
                    {currentUserName}
                  </div>
                  <div className="truncate text-[10px] font-medium uppercase tracking-wider text-[#B8720A] dark:text-[#35B3AA]">
                    {currentUserRole}
                  </div>
                </div>
                <ChevronUp
                  className={`h-4 w-4 shrink-0 text-[#7B7468] transition-transform dark:text-[#B2C5C3] ${
                    isAccountMenuOpen ? '' : 'rotate-180'
                  }`}
                />
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (236px <-> 64px) */}
      <aside
        id="desktop-sidebar"
        className={`hidden lg:block shrink-0 h-[calc(100vh-56px)] sticky top-14 border-r border-[#EAE6DD] dark:border-[#29484C] transition-all duration-200 z-20 ${
          isCollapsed ? 'w-16' : 'w-[236px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0F2024]/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-[260px] max-w-[80vw] h-full shadow-2xl border-r border-[#EAE6DD] dark:border-[#29484C] z-10 animate-slide-in-right">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
