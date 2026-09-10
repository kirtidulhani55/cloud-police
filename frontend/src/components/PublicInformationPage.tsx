import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Mail, ShieldAlert, Wrench } from 'lucide-react';
import {
  loadReviewerSession,
  sendCurrentUserVerificationEmail,
  sendPasswordResetEmail,
} from '../services/authService';
import { PublicFooter, PublicPageId } from './marketing/PublicFooter';
import { CloudPoliceIcon } from './marketing/CloudPoliceIcon';

interface Props {
  page: PublicPageId;
  onHome: () => void;
  onLogin: () => void;
  onNavigate: (page: PublicPageId) => void;
}

const Section: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-lg font-bold text-[#18373A] dark:text-[#E4EFED]">{title}</h2>
    <div className="space-y-2 text-sm leading-7 text-[#5F7779] dark:text-[#B2C5C3]">{children}</div>
  </section>
);

const legalContent: Partial<Record<PublicPageId, { title: string; intro: string; body: React.ReactNode }>> = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'How Cloud Police handles personal information and project telemetry.',
    body: <>
      <Section title="Who operates this project"><p>Cloud Police is a Patchamomma project created by Kirti Dulhani in Maharashtra, India. Privacy and grievance enquiries can be sent to <a className="text-[#137D78] underline" href="mailto:cloudpolice.support@gmail.com">cloudpolice.support@gmail.com</a>.</p></Section>
      <Section title="Information processed"><p>Cloud Police processes account email, display name, assigned role, sign-in metadata, reviewer decisions, timestamps and security audit records. The governance console also processes cloud-provider, resource, incident, cost, change and evidence identifiers required to show and review cases.</p><p>Do not submit passwords, private database contents, secret keys or unrelated personal information into comments or evidence fields.</p></Section>
      <Section title="Why it is used"><p>Information is used to authenticate authorized reviewers, enforce role-based access, display monitoring results, record accountable decisions, secure the service and respond to support requests. It is not used for behavioural advertising.</p></Section>
      <Section title="Storage and service providers"><p>The project uses Google Cloud services, including Identity Platform, Cloud Run and BigQuery. Authentication data and project records may therefore be processed by Google Cloud under its applicable service terms. Browser session storage keeps the signed-in session; local storage keeps theme and interface preferences.</p></Section>
      <Section title="Retention and security"><p>Records are retained only for project operation, security, audit and demonstration needs, and should be removed or anonymised when no longer necessary. Access controls, authenticated APIs and transport encryption are used, but no online system can promise absolute security.</p></Section>
      <Section title="Your choices and rights"><p>You may request access, correction or deletion of your personal information, withdraw optional consent, or raise a grievance by emailing the support address. Some security or decision records may need to be retained where necessary to preserve audit integrity or meet legal obligations.</p></Section>
      <Section title="Updates"><p>This policy may change when the project’s features or data practices change. Material changes should be shown with a revised effective date.</p></Section>
    </>,
  },
  terms: {
    title: 'Terms of Use',
    intro: 'Rules for accessing and using the Cloud Police project.',
    body: <>
      <Section title="Project scope"><p>Cloud Police is a Patchamomma technology project by Kirti Dulhani. It is not currently offered as a paid commercial service. The project environment uses synthetic cloud telemetry alongside real application-generated authentication and review records.</p></Section>
      <Section title="Authorized use"><p>Use the console only with an account and permissions assigned to you. Do not attempt to bypass access controls, impersonate another reviewer, introduce malicious content, probe unrelated systems or connect cloud resources you are not authorized to manage.</p></Section>
      <Section title="AI recommendations"><p>Incident diagnoses, cost estimates and remediation drafts are decision-support outputs. They may be incomplete or incorrect. An authorized person must verify evidence, security impact, cost impact, dependencies, rollback steps and the exact infrastructure plan before acting.</p></Section>
      <Section title="No automatic infrastructure authority"><p>An approval recorded in Cloud Police does not itself guarantee that an infrastructure change is safe, completed or successful. Users remain responsible for their own cloud accounts and operational decisions.</p></Section>
      <Section title="Availability and warranties"><p>The project is provided for demonstration and evaluation without an uptime, savings, detection or outcome guarantee. Access may be modified, suspended or withdrawn for security, maintenance or program reasons.</p></Section>
      <Section title="Intellectual property"><p>The Cloud Police name, interface and original project materials belong to Kirti Dulhani unless otherwise stated. Third-party product and cloud-provider names remain the property of their respective owners.</p></Section>
      <Section title="Law and contact"><p>These terms are governed by applicable laws of India. Questions can be sent to <a className="text-[#137D78] underline" href="mailto:cloudpolice.support@gmail.com">cloudpolice.support@gmail.com</a>.</p></Section>
    </>,
  },
  cookies: {
    title: 'Cookie & Storage Policy',
    intro: 'The browser storage used by Cloud Police and why it is necessary.',
    body: <>
      <Section title="Current position"><p>Cloud Police does not intentionally use advertising cookies, cross-site behavioural tracking or analytics cookies. It therefore does not currently display an optional-cookie consent banner.</p></Section>
      <Section title="Essential session storage"><p>A signed-in reviewer session is stored in the browser’s session storage so protected requests can be authenticated. It is cleared when the user signs out and is designed to end with the browser session.</p></Section>
      <Section title="Preference storage"><p>Local storage remembers the selected light or dark theme, sidebar state and interface preferences. These values support requested functionality and do not contain advertising identifiers.</p></Section>
      <Section title="Your controls"><p>You can clear website data using your browser settings. Clearing it may sign you out and reset interface preferences. If optional analytics or advertising technology is introduced later, Cloud Police should provide a genuine preference control before activating it.</p></Section>
    </>,
  },
  accessibility: {
    title: 'Accessibility',
    intro: 'Our approach to making Cloud Police usable by more people.',
    body: <>
      <Section title="Accessibility approach"><p>Cloud Police is designed with semantic headings, labelled controls, visible keyboard focus, keyboard-operable forms, descriptive button labels, status text that does not rely only on colour, and light/dark contrast considerations.</p></Section>
      <Section title="Known limitations"><p>This is an evolving project and has not been independently certified as fully conforming to a specific accessibility standard. Some dense governance tables, code evidence and third-party authentication messages may require further testing with assistive technology.</p></Section>
      <Section title="Report a problem"><p>If you cannot access content or complete an action, email <a className="text-[#137D78] underline" href="mailto:cloudpolice.support@gmail.com?subject=Cloud%20Police%20accessibility%20issue">cloudpolice.support@gmail.com</a>. Include the page, action, browser and assistive technology used, but do not include passwords or secret cloud data.</p></Section>
    </>,
  },
  support: {
    title: 'Help & Support',
    intro: 'Get help with access, data, monitoring or reviewer actions.',
    body: <>
      <Section title="Contact"><p>Email <a className="text-[#137D78] underline" href="mailto:cloudpolice.support@gmail.com">cloudpolice.support@gmail.com</a>. Describe the page, case ID and visible error. Never send a password, API key, access token or private cloud credential.</p></Section>
      <Section title="Account access"><p>Accounts are created and assigned roles by the Cloud Police administrator. Use Password Reset if you forgot your password. Use Email Verification after signing in if your account email remains unverified.</p></Section>
      <Section title="Privacy and grievances"><p>Use the same email with the subject “Privacy request” or “Grievance”. State what you are requesting and the account email concerned. Identity may need to be verified before account information is disclosed or changed.</p></Section>
    </>,
  },
};

export const PublicInformationPage: React.FC<Props> = ({ page, onHome, onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const content = legalContent[page];
  const reviewerSession = loadReviewerSession();
  const maskedReviewerEmail = reviewerSession?.email.replace(
    /^(.)([^@]*)(@.*)$/,
    (_match, first: string, middle: string, domain: string) =>
      `${first}${middle ? '•'.repeat(Math.min(middle.length, 5)) : ''}${domain}`
  );

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await sendPasswordResetEmail(email); setMessage('If this email belongs to an account, a password-reset link has been sent.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The reset email could not be sent.'); }
    finally { setBusy(false); }
  };

  const verifyEmail = async () => {
    setBusy(true); setError(''); setMessage('');
    try { await sendCurrentUserVerificationEmail(); setVerificationSent(true); setMessage('Verification email sent. Check your inbox and spam folder.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The verification email could not be sent.'); }
    finally { setBusy(false); }
  };

  const statePages: Partial<Record<PublicPageId, { icon: React.ReactNode; title: string; message: string }>> = {
    'not-found': { icon: <ShieldAlert className="h-8 w-8" />, title: 'Page not found', message: 'The address may be incorrect or the page may have moved.' },
    'access-denied': { icon: <ShieldAlert className="h-8 w-8" />, title: 'Access denied', message: 'Your account does not have permission to open this page. Contact the administrator if you believe this is incorrect.' },
    maintenance: { icon: <Wrench className="h-8 w-8" />, title: 'Maintenance in progress', message: 'Cloud Police is temporarily unavailable while maintenance is completed. Please try again later.' },
  };
  const statePage = statePages[page];

  return <div className="min-h-screen bg-[#EEF2F1] text-[#18373A] dark:bg-[#0F2024] dark:text-[#E4EFED]">
    <header className="border-b border-[#D4E4E1] bg-white/90 px-5 py-4 dark:border-[#29484C] dark:bg-[#183238]/90 sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <button type="button" onClick={onHome} className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137D78]">
          <CloudPoliceIcon size={30} className="text-[#137D78] dark:text-[#35B3AA]" /><span className="font-bold">Cloud Police</span>
        </button>
        <button type="button" onClick={onHome} className="inline-flex items-center gap-2 text-sm font-semibold text-[#5F7779] hover:text-[#137D78] dark:text-[#9FB5B3] dark:hover:text-[#35B3AA]"><ArrowLeft className="h-4 w-4" /> Back to site</button>
      </div>
    </header>

    <main className="mx-auto min-h-[60vh] max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      {content && <article className="rounded-2xl border border-[#D4E4E1] bg-white p-6 shadow-sm dark:border-[#29484C] dark:bg-[#183238] sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#137D78] dark:text-[#35B3AA]">Cloud Police</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{content.title}</h1>
        <p className="mt-3 text-[#5F7779] dark:text-[#B2C5C3]">{content.intro}</p>
        <p className="mt-2 text-xs text-[#718789] dark:text-[#9FB5B3]">Effective: 9 September 2026</p>
        <div className="mt-8 space-y-7 border-t border-[#D4E4E1] pt-8 dark:border-[#29484C]">{content.body}</div>
      </article>}

      {page === 'password-reset' && <article className="mx-auto max-w-lg rounded-2xl border border-[#D4E4E1] bg-white p-7 shadow-sm dark:border-[#29484C] dark:bg-[#183238]">
        <Mail className="h-8 w-8 text-[#137D78] dark:text-[#35B3AA]" /><h1 className="mt-4 text-3xl font-bold">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-[#5F7779] dark:text-[#B2C5C3]">Enter your authorized account email. For privacy, the response will not reveal whether an account exists.</p>
        <form onSubmit={resetPassword} className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold">Work email</span><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="account-input w-full" /></label>
          {error && <p role="alert" className="text-sm text-[#C8545E]">{error}</p>}{message && <p role="status" className="text-sm text-[#216B5A] dark:text-[#72D0B3]">{message}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-[#137D78] px-4 py-3 font-semibold text-white hover:bg-[#0F6965] disabled:opacity-60">{busy ? 'Sending…' : 'Send password-reset email'}</button>
        </form>
      </article>}

      {page === 'email-verification' && <article className="mx-auto max-w-lg rounded-2xl border border-[#D4E4E1] bg-white p-7 shadow-sm dark:border-[#29484C] dark:bg-[#183238]">
        <CheckCircle2 className="h-8 w-8 text-[#137D78] dark:text-[#35B3AA]" /><h1 className="mt-4 text-3xl font-bold">Verify your email</h1>
        <p className="mt-3 text-sm leading-6 text-[#5F7779] dark:text-[#B2C5C3]">{reviewerSession ? <>The verification link will be sent to the email on your signed-in account: <strong className="text-[#18373A] dark:text-[#E4EFED]">{maskedReviewerEmail}</strong>.</> : 'Sign in first so Cloud Police can send a verification link to the correct account.'}</p>
        {error && <p role="alert" className="mt-4 text-sm text-[#C8545E]">{error}</p>}{message && <p role="status" className="mt-4 text-sm text-[#216B5A] dark:text-[#72D0B3]">{message}</p>}
        <button type="button" disabled={busy || verificationSent} onClick={reviewerSession ? verifyEmail : onLogin} className="mt-6 w-full rounded-lg bg-[#137D78] px-4 py-3 font-semibold text-white hover:bg-[#0F6965] disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Sending…' : verificationSent ? 'Verification email sent' : reviewerSession ? 'Send verification email' : 'Sign in to continue'}</button>
      </article>}

      {statePage && <article className="mx-auto max-w-xl rounded-2xl border border-[#D4E4E1] bg-white p-8 text-center shadow-sm dark:border-[#29484C] dark:bg-[#183238]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ECF5F3] text-[#137D78] dark:bg-[#13282D] dark:text-[#35B3AA]">{statePage.icon}</div><h1 className="mt-5 text-3xl font-bold">{statePage.title}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#5F7779] dark:text-[#B2C5C3]">{statePage.message}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3"><button type="button" onClick={onHome} className="rounded-lg bg-[#137D78] px-5 py-2.5 font-semibold text-white hover:bg-[#0F6965]">Return to home</button>{page === 'access-denied' && <a href="mailto:cloudpolice.support@gmail.com?subject=Cloud%20Police%20access%20request" className="rounded-lg border border-[#D4E4E1] px-5 py-2.5 font-semibold dark:border-[#29484C]">Contact administrator</a>}</div>
      </article>}
    </main>
    <PublicFooter onNavigate={onNavigate} onHome={onHome} />
  </div>;
};
