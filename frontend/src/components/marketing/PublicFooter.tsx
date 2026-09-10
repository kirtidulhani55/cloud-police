import React from 'react';

export type PublicPageId =
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'accessibility'
  | 'support'
  | 'password-reset'
  | 'email-verification'
  | 'access-denied'
  | 'maintenance'
  | 'not-found';

interface PublicFooterProps {
  onNavigate: (page: PublicPageId) => void;
  onHome: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onNavigate, onHome }) => {
  const linkClass =
    'w-fit text-left text-sm text-[#5F7779] underline-offset-4 hover:text-[#137D78] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137D78] dark:text-[#9FB5B3] dark:hover:text-[#35B3AA] dark:focus-visible:ring-[#35B3AA]';

  return (
    <footer className="border-t border-[#D4E4E1] bg-white px-5 py-10 dark:border-[#29484C] dark:bg-[#11191D] sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-[#18373A] dark:text-[#E4EFED]">Cloud Police</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-[#5F7779] dark:text-[#9FB5B3]">
            A Patchamomma project by Kirti Dulhani. AI-powered multi-cloud governance with authorized human decisions.
          </p>
        </div>
        <nav aria-label="Product links" className="flex flex-col gap-2">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#18373A] dark:text-[#E4EFED]">Product</p>
          <button type="button" className={linkClass} onClick={onHome}>Overview</button>
          <button type="button" className={linkClass} onClick={() => onNavigate('support')}>Help &amp; Support</button>
          <a className={linkClass} href="mailto:cloudpolice.support@gmail.com">Contact</a>
        </nav>
        <nav aria-label="Legal links" className="flex flex-col gap-2">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#18373A] dark:text-[#E4EFED]">Legal</p>
          <button type="button" className={linkClass} onClick={() => onNavigate('privacy')}>Privacy Policy</button>
          <button type="button" className={linkClass} onClick={() => onNavigate('terms')}>Terms of Use</button>
          <button type="button" className={linkClass} onClick={() => onNavigate('cookies')}>Cookie &amp; Storage Policy</button>
          <button type="button" className={linkClass} onClick={() => onNavigate('accessibility')}>Accessibility</button>
        </nav>
      </div>
      <div className="mx-auto mt-8 max-w-5xl border-t border-[#D4E4E1] pt-5 text-xs text-[#5F7779] dark:border-[#29484C] dark:text-[#9FB5B3]">
        © 2026 Kirti Dulhani. Cloud Police is a Patchamomma project, not a registered company or paid service.
      </div>
    </footer>
  );
};
