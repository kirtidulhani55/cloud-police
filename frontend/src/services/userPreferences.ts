import { ThemeMode } from '../types';

const PREFERENCES_STORAGE_KEY = 'cloud_police_user_preferences_v1';

export type DefaultCloud = 'ALL' | 'GCP' | 'AWS' | 'Azure';
export type RefreshIntervalMinutes = 1 | 5 | 10 | 15;
export type ListSize = 10 | 25 | 50;

export interface UserPreferences {
  theme: ThemeMode;
  defaultCloud: DefaultCloud;
  refreshIntervalMinutes: RefreshIntervalMinutes;
  listSize: ListSize;
}

const defaultTheme = (): ThemeMode => {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }

  return 'light';
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: defaultTheme(),
  defaultCloud: 'ALL',
  refreshIntervalMinutes: 5,
  listSize: 25,
};

export const loadUserPreferences = (): UserPreferences => {
  try {
    const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!saved) return DEFAULT_USER_PREFERENCES;

    const value = JSON.parse(saved) as Partial<UserPreferences>;

    return {
      theme: value.theme === 'dark' ? 'dark' : 'light',
      defaultCloud: ['ALL', 'GCP', 'AWS', 'Azure'].includes(
        value.defaultCloud || ''
      )
        ? (value.defaultCloud as DefaultCloud)
        : 'ALL',
      refreshIntervalMinutes: [1, 5, 10, 15].includes(
        Number(value.refreshIntervalMinutes)
      )
        ? (Number(value.refreshIntervalMinutes) as RefreshIntervalMinutes)
        : 5,
      listSize: [10, 25, 50].includes(Number(value.listSize))
        ? (Number(value.listSize) as ListSize)
        : 25,
    };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
};

export const saveUserPreferences = (preferences: UserPreferences) => {
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
};
