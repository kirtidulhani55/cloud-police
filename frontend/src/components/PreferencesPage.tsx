import React, { useEffect, useState } from 'react';
import { Cloud, List, RefreshCw, Save, SlidersHorizontal, SunMoon } from 'lucide-react';
import {
  DefaultCloud,
  ListSize,
  RefreshIntervalMinutes,
  UserPreferences,
} from '../services/userPreferences';

interface PreferencesPageProps {
  preferences: UserPreferences;
  onSave: (preferences: UserPreferences) => void;
}

export const PreferencesPage: React.FC<PreferencesPageProps> = ({
  preferences,
  onSave,
}) => {
  const [draft, setDraft] = useState(preferences);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => setDraft(preferences), [preferences]);

  const save = () => {
    onSave(draft);
    setSavedMessage(true);
    window.setTimeout(() => setSavedMessage(false), 2500);
  };

  const rows = [
    {
      label: 'Theme',
      description: 'Choose the console appearance.',
      icon: SunMoon,
      control: (
        <select
          value={draft.theme}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              theme: event.target.value as UserPreferences['theme'],
            }))
          }
          className="account-select"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      ),
    },
    {
      label: 'Default cloud',
      description: 'Select the cloud scope shown after sign-in.',
      icon: Cloud,
      control: (
        <select
          value={draft.defaultCloud}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              defaultCloud: event.target.value as DefaultCloud,
            }))
          }
          className="account-select"
        >
          <option value="ALL">All clouds</option>
          <option value="GCP">Google Cloud</option>
          <option value="AWS">AWS</option>
          <option value="Azure">Azure</option>
        </select>
      ),
    },
    {
      label: 'Data refresh',
      description: 'How often the console checks for updated findings.',
      icon: RefreshCw,
      control: (
        <select
          value={draft.refreshIntervalMinutes}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              refreshIntervalMinutes: Number(
                event.target.value
              ) as RefreshIntervalMinutes,
            }))
          }
          className="account-select"
        >
          <option value={1}>Every minute</option>
          <option value={5}>Every 5 minutes</option>
          <option value={10}>Every 10 minutes</option>
          <option value={15}>Every 15 minutes</option>
        </select>
      ),
    },
    {
      label: 'List size',
      description: 'Maximum records displayed in each console list.',
      icon: List,
      control: (
        <select
          value={draft.listSize}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              listSize: Number(event.target.value) as ListSize,
            }))
          }
          className="account-select"
        >
          <option value={10}>10 records</option>
          <option value={25}>25 records</option>
          <option value={50}>50 records</option>
        </select>
      ),
    },
  ];

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5">
      <header className="border-b border-[#EAE6DD] pb-5 dark:border-[#29484C]">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B8720A] dark:text-[#35B3AA]">
          <SlidersHorizontal className="h-4 w-4" /> Account
        </div>
        <h1 className="text-2xl font-bold text-[#2B2417] dark:text-[#E4EFED]">
          Preferences
        </h1>
        <p className="mt-1 text-sm text-[#7B7468] dark:text-[#B2C5C3]">
          Personalize how the Cloud Police console behaves for you.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-[#EAE6DD] bg-white shadow-2xs dark:border-[#29484C] dark:bg-[#183238]">
        {rows.map((row, index) => {
          const Icon = row.icon;
          return (
            <div
              key={row.label}
              className={`grid gap-4 p-5 sm:grid-cols-[1fr_220px] sm:items-center ${
                index ? 'border-t border-[#EAE6DD] dark:border-[#29484C]' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-[#FFF4DF] p-2 text-[#B8720A] dark:bg-[#13282D] dark:text-[#35B3AA]">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-[#2B2417] dark:text-[#E4EFED]">
                    {row.label}
                  </h2>
                  <p className="mt-1 text-xs text-[#718789] dark:text-[#9FB5B3]">
                    {row.description}
                  </p>
                </div>
              </div>
              {row.control}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3">
        {savedMessage && (
          <span className="text-sm font-medium text-[#2E8B75] dark:text-[#48B896]">
            Preferences saved.
          </span>
        )}
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-2 rounded-lg bg-[#B8720A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#9A5E05] dark:bg-[#35B3AA] dark:text-[#0F2024] dark:hover:bg-[#48C5BB]"
        >
          <Save className="h-4 w-4" /> Save preferences
        </button>
      </div>
    </section>
  );
};
