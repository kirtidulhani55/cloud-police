import React from 'react';

export interface CountTab<T extends string> {
  id: T;
  label: string;
  count: number;
}

interface CountTabsProps<T extends string> {
  tabs: CountTab<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  label: string;
}

export function CountTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  label,
}: CountTabsProps<T>) {
  return (
    <div
      className="flat-tabs"
      role="tablist"
      aria-label={label}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            data-active={isActive ? 'true' : 'false'}
            className="flat-tab cursor-pointer"
          >
            <span>{tab.label}</span>
            <span className="flat-tab-count">({tab.count})</span>
          </button>
        );
      })}
    </div>
  );
}
