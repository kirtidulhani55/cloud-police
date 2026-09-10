import React from 'react';
import { Shield, Lock, Compass, Users, CheckCircle2 } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-[#0B0E14] border-b border-[#242C40] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Mission Statement and Founder Perspective */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131826] border border-[#242C40] text-xs font-mono text-[#E3A63E] font-semibold">
              OUR MISSION & PHILOSOPHY
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              AI on the Beat.{' '}
              <span className="text-[#8B93A8]">Humans in the Command Center.</span>
            </h2>

            {/* Mission Statement (1-2 sentences) */}
            <p className="text-base sm:text-lg text-[#E7EAF0] leading-relaxed font-medium">
              We believe giving autonomous AI write-access to live cloud infrastructure without human approval is an existential operational risk. Cloud Police is built on a non-negotiable principle: <span className="text-[#E3A63E]">AI synthesizes intelligence, but only verified humans authorize execution.</span>
            </p>

            {/* Founder Note */}
            <div className="p-5 rounded-xl bg-[#131826] border border-[#242C40] text-sm text-[#8B93A8] leading-relaxed space-y-3">
              <p>
                "After spending a decade managing massive multi-cloud estates at scale, we saw security teams drowning in 10,000 daily alerts while engineers dreaded black-box automation tools that accidentally took down databases on Friday afternoons. We built Cloud Police so platform engineers can enjoy frictionless AI diagnostics with total peace of mind."
              </p>
              <div className="pt-2 border-t border-[#242C40] flex items-center justify-between text-xs font-mono">
                <span className="text-white font-semibold">— The Cloud Police Founding Team</span>
                <span className="text-[#E3A63E]">San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Non-Negotiable Core Values */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="p-5 rounded-xl bg-[#131826] border border-[#242C40] flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#E3A63E]/15 border border-[#E3A63E]/30 flex items-center justify-center text-[#E3A63E] shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Zero Autonomous Writes</h3>
                <p className="text-xs text-[#8B93A8] leading-relaxed mt-1">
                  Our telemetry connector is strictly read-only. Remediation scripts are staged for dual-signature human authorization.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#131826] border border-[#242C40] flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#5B8CFF]/15 border border-[#5B8CFF]/30 flex items-center justify-center text-[#5B8CFF] shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Transparent Explanations</h3>
                <p className="text-xs text-[#8B93A8] leading-relaxed mt-1">
                  No black-box hallucinated answers. Every recommendation includes exact JSON diffs, blast-radius metrics, and rollback recipes.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#131826] border border-[#242C40] flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#3DD68C]/15 border border-[#3DD68C]/30 flex items-center justify-center text-[#3DD68C] shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cross-Team Collaboration</h3>
                <p className="text-xs text-[#8B93A8] leading-relaxed mt-1">
                  Unifies Security, FinOps, and SRE workflows into a shared queue with Slack, Teams, and Webhooks integrations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
