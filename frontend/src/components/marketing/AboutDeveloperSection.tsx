import React from 'react';

export const AboutDeveloperSection: React.FC = () => {
  return (
    <section
      id="about-developer"
      className="border-t border-[#DCE3EA] dark:border-[#263244] bg-white dark:bg-[#111827] px-5 py-20 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#0F766E] dark:text-[#5EEAD4]">
          About the Developer
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#172033] dark:text-[#F8FAFC] sm:text-4xl">
          Built by Kirti Dulhani
        </h2>
        <p className="mx-auto mt-6 w-full max-w-3xl text-left text-base leading-7 text-[#526174] dark:text-[#AAB6C5] sm:text-lg">
          Cloud Police was designed and developed by Kirti Dulhani for Patchamomma&nbsp;2026.
        </p>
        <p className="mx-auto mt-4 w-full max-w-3xl text-left text-base leading-7 text-[#526174] dark:text-[#AAB6C5] sm:text-lg">
          The project follows a safety-first principle: AI analyses evidence and recommends
          actions, while authorized people retain control over every decision.
        </p>
      </div>
    </section>
  );
};
