import React from 'react';

export interface WorkspaceTabItem {
  id: string;
  label: string;
  title?: string;
}

interface WorkspaceTabsProps {
  ariaLabel: string;
  parentLabel: string;
  parentContext?: string;
  activeTabId: string | null;
  tabs: WorkspaceTabItem[];
  onSelectParent: () => void;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  ariaLabel,
  parentLabel,
  parentContext,
  activeTabId,
  tabs,
  onSelectParent,
  onSelectTab,
  onCloseTab,
}) => {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="-mx-4 flex min-h-10 items-end gap-1.5 overflow-x-auto border-b border-[#EAE6DD] bg-[#FFF4DF] px-4 pt-1 dark:border-[#29484C] dark:bg-[#13282D] sm:-mx-6 sm:px-6"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTabId === null}
        onClick={onSelectParent}
        className={`-mb-px flex h-9 shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 px-3 text-xs font-semibold transition-colors ${
          activeTabId === null
            ? 'border-[#E3C68F] bg-white text-[#B8720A] shadow-[inset_0_2px_0_#B8720A] dark:border-[#3A5B5F] dark:bg-[#183238] dark:text-[#35B3AA]'
            : 'border-[#EAE6DD] bg-[#F3EEE6] text-[#7B7468] hover:bg-white hover:text-[#2B2417] dark:border-[#29484C] dark:bg-[#173036] dark:text-[#B2C5C3] dark:hover:bg-[#183238] dark:hover:text-[#E4EFED]'
        }`}
      >
        <span>{parentLabel}</span>
        {parentContext && (
          <>
            <span aria-hidden="true" className="text-[#91A5A4]">
              ›
            </span>
            <span>{parentContext}</span>
          </>
        )}
      </button>

      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;

        return (
          <div
            key={tab.id}
            className={`-mb-px flex h-9 shrink-0 items-center rounded-t-lg border border-b-0 transition-colors ${
              isActive
                ? 'border-[#E3C68F] bg-white text-[#B8720A] shadow-[inset_0_2px_0_#B8720A] dark:border-[#3A5B5F] dark:bg-[#183238] dark:text-[#35B3AA]'
                : 'border-[#EAE6DD] bg-[#F3EEE6] text-[#7B7468] hover:bg-white hover:text-[#2B2417] dark:border-[#29484C] dark:bg-[#173036] dark:text-[#B2C5C3] dark:hover:bg-[#183238] dark:hover:text-[#E4EFED]'
            }`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(tab.id)}
              className="h-full max-w-[240px] truncate pl-3 pr-1 text-left text-xs font-semibold"
              title={tab.title || tab.label}
            >
              {tab.label}
            </button>
            <button
              type="button"
              onClick={() => onCloseTab(tab.id)}
              className="mr-1.5 ml-0.5 flex h-6 w-6 items-center justify-center rounded-md text-[19px] font-semibold leading-none text-[#4F6769] transition-colors hover:bg-[#F3EEE6] hover:text-[#B3454F] dark:text-[#B2C5C3] dark:hover:bg-[#29484C] dark:hover:text-[#F08A91]"
              aria-label={`Close ${tab.label} tab`}
              title="Close tab"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
