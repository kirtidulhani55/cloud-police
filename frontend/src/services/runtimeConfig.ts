export type PublicRuntimeConfigKey =
  | 'VITE_IDENTITY_PLATFORM_API_KEY'
  | 'VITE_CLOUD_POLICE_API_URL'
  | 'VITE_CLOUD_POLICE_APPROVAL_API_URL';

declare global {
  interface Window {
    __CLOUD_POLICE_CONFIG__?: Partial<
      Record<PublicRuntimeConfigKey, string>
    >;
  }
}

export function publicRuntimeConfig(
  key: PublicRuntimeConfigKey,
  fallback = ''
): string {
  const runtimeValue = window.__CLOUD_POLICE_CONFIG__?.[key];
  const buildValue = import.meta.env[key];
  const value = runtimeValue || buildValue || fallback;
  return typeof value === 'string' ? value.trim() : fallback;
}

