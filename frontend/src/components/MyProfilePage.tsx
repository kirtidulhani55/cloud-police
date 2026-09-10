import React, { useCallback, useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  CurrentUserProfile,
  loadCurrentUserProfile,
  ReviewerSession,
} from '../services/authService';

interface MyProfilePageProps {
  session: ReviewerSession;
}

const formatDate = (value?: number) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Not available';

export const MyProfilePage: React.FC<MyProfilePageProps> = ({ session }) => {
  const [profile, setProfile] = useState<CurrentUserProfile>({
    localId: session.localId,
    displayName: session.displayName || session.email,
    email: session.email,
    role: session.role,
    emailVerified: false,
    disabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      setProfile(await loadCurrentUserProfile());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Your profile could not be loaded.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const details = [
    {
      label: 'Account status',
      value: profile.disabled ? 'Disabled' : 'Active',
      icon: CheckCircle2,
    },
    { label: 'Cloud Police role', value: profile.role, icon: ShieldCheck },
    { label: 'Last sign-in', value: formatDate(profile.lastLoginAt), icon: Clock3 },
    { label: 'Account created', value: formatDate(profile.createdAt), icon: CalendarDays },
  ];

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-[#EAE6DD] pb-5 dark:border-[#29484C] sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B8720A] dark:text-[#35B3AA]">
            <CircleUserRound className="h-4 w-4" /> Account
          </div>
          <h1 className="text-2xl font-bold text-[#2B2417] dark:text-[#E4EFED]">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-[#7B7468] dark:text-[#B2C5C3]">
            Your verified Identity Platform account and Cloud Police access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshProfile()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#C8DCDA] bg-white px-3 py-2 text-sm font-semibold text-[#B8720A] transition-colors hover:bg-[#FFF4DF] disabled:cursor-wait disabled:opacity-60 dark:border-[#29484C] dark:bg-[#183238] dark:text-[#35B3AA] dark:hover:bg-[#1D3B41]"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {errorMessage && (
        <div className="rounded-xl border border-[#C8545E]/30 bg-[#C8545E]/10 px-4 py-3 text-sm text-[#B3454F] dark:text-[#F08A91]">
          {errorMessage}
        </div>
      )}

      <div className="rounded-2xl border border-[#EAE6DD] bg-white p-5 shadow-2xs dark:border-[#29484C] dark:bg-[#183238] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#B8720A] text-2xl font-bold uppercase text-white dark:bg-[#35B3AA] dark:text-[#0F2024]">
            {profile.displayName.trim().charAt(0) || profile.email.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-[#2B2417] dark:text-[#E4EFED]">
              {profile.displayName}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-[#7B7468] dark:text-[#B2C5C3]">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </div>
          </div>
          <span className="self-start rounded-full border border-[#BFD9D5] bg-[#FFF4DF] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#B8720A] dark:border-[#31565A] dark:bg-[#13282D] dark:text-[#35B3AA] sm:self-center">
            {profile.role}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {details.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-[#EAE6DD] bg-white p-4 dark:border-[#29484C] dark:bg-[#183238]"
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-[#FFF4DF] p-2 text-[#B8720A] dark:bg-[#13282D] dark:text-[#35B3AA]">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-medium text-[#718789] dark:text-[#9FB5B3]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#2B2417] dark:text-[#E4EFED]">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#718789] dark:text-[#9FB5B3]">
        Profile identity and role are managed securely through Identity Platform and Cloud Police administration.
      </p>
    </section>
  );
};
