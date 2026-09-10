import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  KeyRound,
  MailCheck,
  MonitorCheck,
  ShieldCheck,
} from 'lucide-react';
import {
  changeCurrentUserPassword,
  CurrentUserProfile,
  loadCurrentUserProfile,
  ReviewerSession,
  sendCurrentUserVerificationEmail,
} from '../services/authService';

interface SecurityPageProps {
  session: ReviewerSession;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ session }) => {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      setProfile(await loadCurrentUserProfile());
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Security details could not be loaded.',
      });
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const sendVerification = async () => {
    setIsWorking(true);
    setMessage(null);
    try {
      await sendCurrentUserVerificationEmail();
      setMessage({
        kind: 'success',
        text: `Verification email sent to ${session.email}.`,
      });
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Verification email could not be sent.',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ kind: 'error', text: 'Use at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ kind: 'error', text: 'The passwords do not match.' });
      return;
    }

    setIsWorking(true);
    try {
      await changeCurrentUserPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ kind: 'success', text: 'Your password was changed securely.' });
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Your password could not be changed.',
      });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5">
      <header className="border-b border-[#EAE6DD] pb-5 dark:border-[#29484C]">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B8720A] dark:text-[#35B3AA]">
          <ShieldCheck className="h-4 w-4" /> Account
        </div>
        <h1 className="text-2xl font-bold text-[#2B2417] dark:text-[#E4EFED]">
          Security
        </h1>
        <p className="mt-1 text-sm text-[#7B7468] dark:text-[#B2C5C3]">
          Protect your account and review your current sign-in session.
        </p>
      </header>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.kind === 'success'
              ? 'border-[#2E8B75]/30 bg-[#2E8B75]/10 text-[#23705F] dark:text-[#62CBAA]'
              : 'border-[#C8545E]/30 bg-[#C8545E]/10 text-[#B3454F] dark:text-[#F08A91]'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#EAE6DD] bg-white p-5 dark:border-[#29484C] dark:bg-[#183238]">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-[#FFF4DF] p-2 text-[#B8720A] dark:bg-[#13282D] dark:text-[#35B3AA]">
              <MailCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-[#2B2417] dark:text-[#E4EFED]">
                Email verification
              </h2>
              <p className="mt-1 truncate text-sm text-[#7B7468] dark:text-[#B2C5C3]">
                {session.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  profile?.emailVerified
                    ? 'text-[#2E8B75] dark:text-[#48B896]'
                    : 'text-[#B8720A] dark:text-[#D5A45A]'
                }`}>
                  <CheckCircle2 className="h-4 w-4" />
                  {profile?.emailVerified ? 'Verified' : 'Not verified'}
                </span>
                {!profile?.emailVerified && (
                  <button
                    type="button"
                    onClick={() => void sendVerification()}
                    disabled={isWorking}
                    className="text-xs font-semibold text-[#B8720A] underline-offset-4 hover:underline disabled:opacity-50 dark:text-[#35B3AA]"
                  >
                    Send verification email
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#EAE6DD] bg-white p-5 dark:border-[#29484C] dark:bg-[#183238]">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-[#FFF4DF] p-2 text-[#B8720A] dark:bg-[#13282D] dark:text-[#35B3AA]">
              <MonitorCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-[#2B2417] dark:text-[#E4EFED]">
                Current session
              </h2>
              <p className="mt-1 text-sm text-[#7B7468] dark:text-[#B2C5C3]">
                This browser · Signed in
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-[#718789] dark:text-[#9FB5B3]">
                <Clock3 className="h-4 w-4" /> Token refreshes securely while active
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={changePassword}
        className="rounded-2xl border border-[#EAE6DD] bg-white p-5 dark:border-[#29484C] dark:bg-[#183238]"
      >
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-[#FFF4DF] p-2 text-[#B8720A] dark:bg-[#13282D] dark:text-[#35B3AA]">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-[#2B2417] dark:text-[#E4EFED]">
              Change password
            </h2>
            <p className="mt-1 text-xs text-[#718789] dark:text-[#9FB5B3]">
              Use at least 8 characters. Cloud Police never stores your password.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#2B2417] dark:text-[#E4EFED]">
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="account-input mt-2"
              placeholder="At least 8 characters"
            />
          </label>
          <label className="text-xs font-semibold text-[#2B2417] dark:text-[#E4EFED]">
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="account-input mt-2"
              placeholder="Repeat new password"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isWorking || !newPassword || !confirmPassword}
            className="rounded-lg bg-[#B8720A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#9A5E05] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#35B3AA] dark:text-[#0F2024]"
          >
            Change password
          </button>
        </div>
      </form>

    </section>
  );
};
