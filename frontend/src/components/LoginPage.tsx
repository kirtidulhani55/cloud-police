import React, { useState } from 'react';
import {
  ReviewerSession,
  sendPasswordResetEmail,
  signInReviewer,
} from '../services/authService';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { CloudPoliceIcon } from './marketing/CloudPoliceIcon';
import { PublicPageId } from './marketing/PublicFooter';

interface LoginPageProps {
  onBack: () => void;
  onSignedIn: (session: ReviewerSession) => void;
  onNavigate: (page: PublicPageId) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onBack,
  onSignedIn,
  onNavigate,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const session = await signInReviewer(email, password);
      onSignedIn(session);
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'Sign-in could not be completed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim();

    setError('');
    setMessage('');

    if (!normalizedEmail) {
      setError('Enter your work email first.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Enter a valid work email address.');
      return;
    }

    setIsResettingPassword(true);

    try {
      await sendPasswordResetEmail(normalizedEmail);
      setMessage(
        'If this email belongs to an account, a password-reset link has been sent.'
      );
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : 'The password-reset email could not be sent.'
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EEF2F1] dark:bg-[#0F2024] text-[#2B2417] dark:text-[#E4EFED] flex flex-col">
      <header className="h-18 border-b border-[#EAE6DD] dark:border-[#29484C] flex items-center justify-between px-5 sm:px-8 bg-[#FFFFFF]/90 dark:bg-[#183238]/90">
        <div className="flex items-center gap-3 font-bold text-lg">
          <CloudPoliceIcon
            size={32}
            className="text-[#B8720A] dark:text-[#35B3AA]"
          />
          <span>Cloud Police</span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#7B7468] dark:text-[#B2C5C3] hover:text-[#B8720A] dark:hover:text-[#35B3AA] transition-colors cursor-pointer"
          aria-label="Back to public site"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to site</span>
        </button>
      </header>

      <section className="w-full max-w-lg mx-auto px-5 py-12 sm:py-16 flex-1 flex items-start sm:items-center">
        <div className="w-full bg-[#FFFFFF] dark:bg-[#183238] border border-[#EAE6DD] dark:border-[#29484C] rounded-2xl p-6 sm:p-9 shadow-sm">
          <div className="pb-6 border-b border-[#EAE6DD] dark:border-[#29484C]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B8720A] dark:text-[#35B3AA]">
            Protected access
          </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Sign in to Cloud Police</h1>
            <p className="mt-2 text-base leading-relaxed text-[#7B7468] dark:text-[#9FB5B3]">
              Use an account provided by the Cloud Police administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="pt-7 space-y-6">
            <label className="block">
              <span className="block text-sm font-semibold mb-2">Work email</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="auth-line-input w-full h-12 px-3 text-base bg-[#FCFAF7] dark:bg-[#13282D] border border-[#EAE6DD] dark:border-[#29484C] rounded-lg focus:outline-none focus:border-[#B8720A] dark:focus:border-[#35B3AA]"
              />
            </label>

            <label className="block">
              <span className="flex items-center justify-between gap-4 mb-2">
                <span className="text-sm font-semibold">Password</span>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isSubmitting || isResettingPassword}
                  className="text-sm font-semibold text-[#B8720A] dark:text-[#35B3AA] hover:underline disabled:opacity-60 cursor-pointer"
                >
                  {isResettingPassword ? 'Sending…' : 'Forgot password?'}
                </button>
              </span>
              <span className="relative block">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="auth-line-input w-full h-12 pl-3 pr-12 text-base bg-[#FCFAF7] dark:bg-[#13282D] border border-[#EAE6DD] dark:border-[#29484C] rounded-lg focus:outline-none focus:border-[#B8720A] dark:focus:border-[#35B3AA]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-[#7B7468] dark:text-[#9FB5B3] hover:text-[#B8720A] dark:hover:text-[#35B3AA] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </span>
            </label>

            {error && (
              <p role="alert" className="text-sm text-[#C8545E] dark:text-[#DD6B73]">
                {error}
              </p>
            )}

            {message && (
              <p role="status" className="text-sm leading-relaxed text-[#B8720A] dark:text-[#48B896]">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isResettingPassword}
              className="w-full h-12 rounded-lg bg-[#B8720A] hover:bg-[#9A5E05] dark:bg-[#35B3AA] dark:hover:bg-[#48C7BD] text-white dark:text-[#0F2024] text-base font-semibold disabled:opacity-60 cursor-pointer transition-colors"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#7B7468] dark:text-[#9FB5B3]">
            Accounts are created and managed by a Cloud Police administrator.
          </p>
          <p className="mt-3 text-center text-xs leading-5 text-[#7B7468] dark:text-[#9FB5B3]">
            By signing in, you agree to the{' '}
            <button type="button" className="font-semibold text-[#137D78] hover:underline dark:text-[#35B3AA]" onClick={() => onNavigate('terms')}>Terms of Use</button>{' '}
            and acknowledge the{' '}
            <button type="button" className="font-semibold text-[#137D78] hover:underline dark:text-[#35B3AA]" onClick={() => onNavigate('privacy')}>Privacy Policy</button>.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
            <button type="button" className="text-[#5F7779] hover:text-[#137D78] hover:underline dark:text-[#9FB5B3]" onClick={() => onNavigate('password-reset')}>Password reset</button>
            <button type="button" className="text-[#5F7779] hover:text-[#137D78] hover:underline dark:text-[#9FB5B3]" onClick={() => onNavigate('email-verification')}>Email verification</button>
            <button type="button" className="text-[#5F7779] hover:text-[#137D78] hover:underline dark:text-[#9FB5B3]" onClick={() => onNavigate('support')}>Support</button>
          </div>
        </div>
      </section>
    </main>
  );
};
