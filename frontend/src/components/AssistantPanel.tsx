import React, { FormEvent, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clipboard,
  Cloud,
  Database,
  ExternalLink,
  FileCheck2,
  MessageSquare,
  Network,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  ChangeInspectorData,
  CostAnomalyData,
  NetworkIncidentData,
} from '../types';
import { CloudPoliceLogo } from './CloudPoliceLogo';
import { useDialogFocus } from '../hooks/useDialogFocus';
import {
  answerFollowUp,
  AssistantCase,
  AssistantCategory,
  AssistantDestination,
  buildAssistantCases,
  findAssistantCase,
  FollowUpAnswer,
  formatCheckedTime,
  getFollowUps,
  matchFollowUp,
} from './assistant/assistantModel';

interface AssistantPanelProps {
  networkIncidents: NetworkIncidentData[];
  costAnomalies: CostAnomalyData[];
  changeInspector: ChangeInspectorData;
  connectionStatus: 'loading' | 'live' | 'fallback';
  onNavigate?: (destination: AssistantDestination) => void;
}

interface FollowUpExchange {
  question: string;
  answer: FollowUpAnswer;
}

const CATEGORY_OPTIONS: Array<{
  id: AssistantCategory;
  label: string;
  icon: React.ElementType;
}> = [
  { id: 'incident', label: 'Incidents', icon: Network },
  { id: 'cost', label: 'Costs', icon: TrendingUp },
  { id: 'change', label: 'Changes', icon: FileCheck2 },
];

const riskClasses: Record<string, string> = {
  CRITICAL:
    'bg-[#C8545E]/12 text-[#B3454F] border-[#C8545E]/30 dark:text-[#F08A91]',
  HIGH: 'bg-[#B8720A]/12 text-[#985D21] border-[#B8720A]/30 dark:text-[#D5A45A]',
  MEDIUM:
    'bg-[#B8720A]/12 text-[#8A6719] border-[#B8720A]/30 dark:text-[#E8BD5C]',
  LOW: 'bg-[#B8720A]/10 text-[#B8720A] border-[#B8720A]/25 dark:text-[#35B3AA]',
  SAFE: 'bg-[#2E8B75]/10 text-[#23705F] border-[#2E8B75]/25 dark:text-[#48B896]',
};

const destinationLabel: Record<AssistantDestination, string> = {
  incidents: 'Open Incidents',
  cost: 'Open Cost Intelligence',
  changes: 'Open Change Inspector',
  approvals: 'Open Reviewer Approvals',
  evidence: 'Open Evidence',
};

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  networkIncidents,
  costAnomalies,
  changeInspector,
  connectionStatus,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [category, setCategory] = useState<AssistantCategory>('incident');
  const [activeCase, setActiveCase] = useState<AssistantCase | null>(null);
  const [activeQuestion, setActiveQuestion] = useState('');
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState('');
  const [followUps, setFollowUps] = useState<FollowUpExchange[]>([]);
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useDialogFocus(isOpen, panelRef, () => setIsOpen(false));

  const cases = useMemo(
    () => buildAssistantCases(networkIncidents, costAnomalies, changeInspector),
    [networkIncidents, costAnomalies, changeInspector]
  );
  const visibleCases = cases.filter((item) => item.category === category);
  const latestChecked = cases
    .map((item) => item.lastChecked)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  const startInvestigation = (item: AssistantCase, question = item.question) => {
    if (connectionStatus !== 'live') {
      setNotice(
        connectionStatus === 'loading'
          ? 'Cloud Police is still loading the latest evidence. Please try again shortly.'
          : 'Live evidence is unavailable. Sample answers are disabled.'
      );
      return;
    }

    setActiveCase(item);
    setActiveQuestion(question);
    setFollowUps([]);
    setNotice('');
    setFeedback(null);
    setTechnicalOpen(false);
    setShowHelp(false);
  };

  const askFollowUp = (question: string, followUpId: string) => {
    if (!activeCase) return;
    setFollowUps((current) => [
      ...current,
      { question, answer: answerFollowUp(activeCase, followUpId) },
    ]);
    setNotice('');
  };

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput('');

    const normalized = question.toLowerCase();
    if (normalized === 'help' || normalized.includes('what can you do')) {
      setShowHelp(true);
      setNotice('');
      return;
    }

    if (activeCase) {
      const matchedFollowUp = matchFollowUp(activeCase, question);
      if (matchedFollowUp) {
        askFollowUp(question, matchedFollowUp.id);
        return;
      }
    }

    const matchedCase = findAssistantCase(cases, question);
    if (matchedCase) {
      startInvestigation(matchedCase, question);
      return;
    }

    setNotice(
      'I can only answer from current Cloud Police incidents, cost anomalies and proposed infrastructure changes. Choose a suggested question or include a case ID or resource name.'
    );
  };

  const reset = () => {
    setActiveCase(null);
    setActiveQuestion('');
    setFollowUps([]);
    setNotice('');
    setFeedback(null);
    setTechnicalOpen(false);
    setShowHelp(false);
  };

  const navigate = (destination: AssistantDestination) => {
    onNavigate?.(destination);
    setIsOpen(false);
  };

  const copyTelemetry = async () => {
    if (!activeCase) return;
    await navigator.clipboard.writeText(
      JSON.stringify(activeCase.rawTelemetry, null, 2)
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group fixed bottom-6 right-5 z-40 flex h-12 w-12 items-center justify-center gap-2 overflow-hidden rounded-full border border-[#B8720A]/30 bg-[#B8720A] text-white shadow-lg transition-all hover:w-[172px] hover:bg-[#9A5E05] hover:px-3.5 dark:border-[#35B3AA]/30 dark:bg-[#35B3AA] dark:text-[#0F2024] dark:hover:bg-[#48C5BB]"
        aria-label="Ask Cloud Police"
      >
        <CloudPoliceLogo
          size={23}
          className="h-6 w-6 shrink-0 brightness-0 invert dark:brightness-100 dark:invert-0"
        />
        <span className="max-w-0 whitespace-nowrap text-sm font-semibold opacity-0 transition-all group-hover:max-w-[125px] group-hover:opacity-100">
          Ask Cloud Police
        </span>
      </button>

      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-50 cursor-default bg-[#0F2024]/45 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
          aria-label="Close assistant"
        />
      )}

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal={isOpen ? 'true' : undefined}
        aria-hidden={!isOpen}
        inert={!isOpen}
        tabIndex={-1}
        className={`fixed inset-y-0 right-0 z-[60] flex w-full flex-col border-l border-[#EAE6DD] bg-[#FAF7F2] text-[#2B2417] shadow-2xl transition-transform duration-300 dark:border-[#29484C] dark:bg-[#0F2024] dark:text-[#E4EFED] sm:w-[520px] lg:w-[560px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-labelledby="cloud-police-assistant-title"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[#EAE6DD] bg-white px-5 py-3.5 dark:border-[#29484C] dark:bg-[#183238]">
          <div className="flex min-w-0 items-center gap-3">
            <CloudPoliceLogo size={36} className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <h2
                id="cloud-police-assistant-title"
                className="truncate text-base font-bold"
              >
                Cloud Police Assistant
              </h2>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-[#B8720A] dark:text-[#35B3AA]">
                <ShieldCheck className="h-3.5 w-3.5" /> Evidence-grounded
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowHelp((current) => !current)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                showHelp
                  ? 'bg-[#F3E7D1] text-[#B8720A] dark:bg-[#1D3B41] dark:text-[#35B3AA]'
                  : 'text-[#7B7468] hover:bg-[#FFF4DF] hover:text-[#2B2417] dark:text-[#B2C5C3] dark:hover:bg-[#13282D] dark:hover:text-[#E4EFED]'
              }`}
              aria-label="Assistant help"
              title="Help"
            >
              <CircleHelp className="h-5 w-5" />
            </button>
            <button
              type="button"
              data-dialog-initial-focus
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B7468] transition-colors hover:bg-[#FFF4DF] hover:text-[#2B2417] dark:text-[#B2C5C3] dark:hover:bg-[#13282D] dark:hover:text-[#E4EFED]"
              aria-label="Close assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex shrink-0 items-center justify-between border-b border-[#EAE6DD] bg-[#FFF4DF] px-5 py-2 text-[11px] dark:border-[#29484C] dark:bg-[#13282D]">
          <span className="flex items-center gap-1.5 font-medium text-[#7B7468] dark:text-[#B2C5C3]">
            <Cloud className="h-3.5 w-3.5" /> {cases.length} evidence-backed cases
          </span>
          <span
            className={`font-semibold ${
              connectionStatus === 'live'
                ? 'text-[#2E8B75] dark:text-[#48B896]'
                : connectionStatus === 'loading'
                  ? 'text-[#B8720A] dark:text-[#D5A45A]'
                  : 'text-[#B3454F] dark:text-[#F08A91]'
            }`}
          >
            {connectionStatus === 'live'
              ? formatCheckedTime(latestChecked)
              : connectionStatus === 'loading'
                ? 'Loading evidence…'
                : 'Evidence unavailable'}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {showHelp ? (
            <section className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B8720A] dark:text-[#35B3AA]">
                    Help
                  </p>
                  <h3 className="mt-1 text-xl font-bold">How to use the assistant</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="text-xs font-semibold text-[#B8720A] hover:underline dark:text-[#35B3AA]"
                >
                  Done
                </button>
              </div>

              <div className="rounded-xl border border-[#EAE6DD] bg-white p-4 dark:border-[#29484C] dark:bg-[#183238]">
                <h4 className="text-sm font-semibold">What I can investigate</h4>
                <ul className="mt-3 space-y-2 text-sm text-[#7B7468] dark:text-[#B2C5C3]">
                  <li>• Network incidents, blocked ports and database connectivity</li>
                  <li>• Cost anomalies, utilization and monthly financial impact</li>
                  <li>• Terraform changes, risk, validation and rollback planning</li>
                </ul>
              </div>

              <div className="rounded-xl border border-[#EAE6DD] bg-white p-4 dark:border-[#29484C] dark:bg-[#183238]">
                <h4 className="text-sm font-semibold">Example questions</h4>
                <div className="mt-3 space-y-2">
                  {[
                    'Why is the GCP database unreachable?',
                    'Show the latest AWS cost anomaly',
                    'Is the proposed Terraform change safe?',
                  ].map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => {
                        setInput(question);
                        setShowHelp(false);
                        window.setTimeout(() => inputRef.current?.focus(), 0);
                      }}
                      className="flex w-full items-center justify-between rounded-lg bg-[#FFF4DF] px-3 py-2 text-left text-xs font-medium hover:bg-[#F3E7D1] dark:bg-[#13282D] dark:hover:bg-[#1D3B41]"
                    >
                      {question} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#B8720A]/20 bg-[#B8720A]/8 p-4 text-sm text-[#7B7468] dark:border-[#35B3AA]/20 dark:bg-[#35B3AA]/8 dark:text-[#B2C5C3]">
                <strong className="text-[#2B2417] dark:text-[#E4EFED]">Safety:</strong>{' '}
                Answers use current Cloud Police evidence. The assistant recommends actions but cannot approve or apply infrastructure changes.
              </div>
            </section>
          ) : !activeCase ? (
            <section className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#B8720A] dark:text-[#35B3AA]">
                  <Sparkles className="h-4 w-4" /> Guided investigation
                </div>
                <h3 className="mt-2 text-xl font-bold">What do you want to understand?</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#7B7468] dark:text-[#B2C5C3]">
                  Choose a live case or ask using its ID, resource or cloud provider.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Assistant categories">
                {CATEGORY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = option.id === category;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setCategory(option.id)}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors ${
                        selected
                          ? 'border-[#B8720A] bg-[#B8720A] text-white dark:border-[#35B3AA] dark:bg-[#35B3AA] dark:text-[#0F2024]'
                          : 'border-[#EAE6DD] bg-white text-[#7B7468] hover:border-[#B8720A] hover:text-[#B8720A] dark:border-[#29484C] dark:bg-[#183238] dark:text-[#B2C5C3] dark:hover:border-[#35B3AA] dark:hover:text-[#35B3AA]'
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                {visibleCases.length ? (
                  visibleCases.map((item) => (
                    <button
                      key={`${item.category}-${item.id}-${item.provider}`}
                      type="button"
                      onClick={() => startInvestigation(item)}
                      className="group w-full rounded-xl border border-[#EAE6DD] bg-white p-3.5 text-left transition-colors hover:border-[#B8720A] hover:bg-[#FCFAF7] dark:border-[#29484C] dark:bg-[#183238] dark:hover:border-[#35B3AA] dark:hover:bg-[#1D3B41]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#718789] dark:text-[#9FB5B3]">
                            <span>{item.id}</span><span>·</span><span>{item.provider}</span>
                            <span className={`rounded-full border px-1.5 py-0.5 ${riskClasses[item.risk] || riskClasses.MEDIUM}`}>
                              {item.risk} risk
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold leading-snug group-hover:text-[#B8720A] dark:group-hover:text-[#35B3AA]">
                            {item.question}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#718789] dark:text-[#9FB5B3]">
                            {item.resource}
                          </p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#718789] transition-transform group-hover:translate-x-0.5 group-hover:text-[#B8720A] dark:group-hover:text-[#35B3AA]" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-[#EAE6DD] p-5 text-center text-sm text-[#718789] dark:border-[#29484C] dark:text-[#9FB5B3]">
                    No {category} cases are available.
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B8720A] hover:underline dark:text-[#35B3AA]"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> New investigation
                </button>
                <span className="text-[11px] text-[#718789] dark:text-[#9FB5B3]">
                  {activeCase.id}
                </span>
              </div>

              <div className="ml-10 rounded-2xl rounded-tr-sm bg-[#F3E7D1] px-4 py-3 text-sm font-medium dark:bg-[#1D3B41]">
                {activeQuestion}
              </div>

              <article className="overflow-hidden rounded-2xl border border-[#EAE6DD] bg-white dark:border-[#29484C] dark:bg-[#183238]">
                <div className="border-b border-[#EAE6DD] p-4 dark:border-[#29484C]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B8720A] dark:text-[#35B3AA]">
                      AI analysis · {activeCase.specialist}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${riskClasses[activeCase.risk] || riskClasses.MEDIUM}`}>
                      {activeCase.risk} risk
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold leading-snug">{activeCase.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#718789] dark:text-[#9FB5B3]">
                    <span>{activeCase.confidence} confidence</span><span>·</span>
                    <span>{formatCheckedTime(activeCase.lastChecked)}</span><span>·</span>
                    <span>{activeCase.evidenceIds.length} evidence records</span>
                  </div>
                </div>

                <div className="divide-y divide-[#EAE6DD] dark:divide-[#29484C]">
                  {[
                    ['Summary', activeCase.summary],
                    ['Likely cause', activeCase.cause],
                    ['Business impact', activeCase.impact],
                    ['Recommended next step', activeCase.nextStep],
                  ].map(([label, value]) => (
                    <div key={label} className="p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider">{label}</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#7B7468] dark:text-[#B2C5C3]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#EAE6DD] bg-[#FFF4DF] p-4 dark:border-[#29484C] dark:bg-[#13282D]">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#B8720A] dark:text-[#35B3AA]" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Reviewer control</h4>
                      <p className="mt-1 text-xs leading-relaxed text-[#7B7468] dark:text-[#B2C5C3]">
                        {activeCase.reviewerStatus}
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              <div className="rounded-xl border border-[#EAE6DD] bg-white p-4 dark:border-[#29484C] dark:bg-[#183238]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Evidence used</h4>
                    <p className="mt-1 line-clamp-2 text-xs text-[#718789] dark:text-[#9FB5B3]">
                      {activeCase.evidenceSummary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('evidence')}
                    className="shrink-0 text-xs font-semibold text-[#B8720A] hover:underline dark:text-[#35B3AA]"
                  >
                    Open evidence
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {activeCase.evidenceIds.length ? (
                    activeCase.evidenceIds.map((id) => (
                      <span
                        key={id}
                        className="rounded-md border border-[#EAE6DD] bg-[#FAF7F2] px-2 py-1 font-mono text-[10px] text-[#B8720A] dark:border-[#29484C] dark:bg-[#0F2024] dark:text-[#35B3AA]"
                      >
                        {id}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#718789] dark:text-[#9FB5B3]">
                      No evidence IDs returned.
                    </span>
                  )}
                </div>
              </div>

              {followUps.map((exchange, index) => (
                <div key={`${exchange.question}-${index}`} className="space-y-2">
                  <div className="ml-12 rounded-xl rounded-tr-sm bg-[#F3E7D1] px-3 py-2.5 text-xs font-medium dark:bg-[#1D3B41]">
                    {exchange.question}
                  </div>
                  <div className="rounded-xl border border-[#EAE6DD] bg-white p-3.5 dark:border-[#29484C] dark:bg-[#183238]">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#B8720A] dark:text-[#35B3AA]">
                      <MessageSquare className="h-3.5 w-3.5" /> {exchange.answer.title}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#7B7468] dark:text-[#B2C5C3]">
                      {exchange.answer.body}
                    </p>
                  </div>
                </div>
              ))}

              <div>
                <h4 className="text-xs font-semibold text-[#7B7468] dark:text-[#B2C5C3]">
                  Ask a follow-up
                </h4>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {getFollowUps(activeCase.category).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => askFollowUp(option.label, option.id)}
                      className="rounded-lg border border-[#EAE6DD] bg-white px-3 py-2.5 text-left text-xs font-medium transition-colors hover:border-[#B8720A] hover:bg-[#FFF4DF] hover:text-[#B8720A] dark:border-[#29484C] dark:bg-[#183238] dark:hover:border-[#35B3AA] dark:hover:bg-[#1D3B41] dark:hover:text-[#35B3AA]"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#EAE6DD] bg-white dark:border-[#29484C] dark:bg-[#183238]">
                <button
                  type="button"
                  onClick={() => setTechnicalOpen((current) => !current)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-[#B8720A] dark:text-[#35B3AA]" /> Technical details
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${technicalOpen ? 'rotate-180' : ''}`} />
                </button>
                {technicalOpen && (
                  <div className="border-t border-[#29484C] bg-[#0F2024] p-4 text-[#E4EFED]">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#B2C5C3]">Saved telemetry</span>
                      <button
                        type="button"
                        onClick={() => void copyTelemetry()}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#35B3AA]"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                        {copied ? 'Copied' : 'Copy JSON'}
                      </button>
                    </div>
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed">
                      {JSON.stringify(activeCase.rawTelemetry, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE6DD] pt-4 dark:border-[#29484C]">
                <button
                  type="button"
                  onClick={() => navigate(activeCase.destination)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#B8720A] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#9A5E05] dark:bg-[#35B3AA] dark:text-[#0F2024] dark:hover:bg-[#48C5BB]"
                >
                  {destinationLabel[activeCase.destination]} <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-1 text-xs text-[#718789] dark:text-[#9FB5B3]">
                  <span className="mr-1">Helpful?</span>
                  <button
                    type="button"
                    onClick={() => setFeedback('up')}
                    className={`rounded-md p-1.5 ${feedback === 'up' ? 'bg-[#F3E7D1] text-[#B8720A] dark:bg-[#1D3B41] dark:text-[#35B3AA]' : 'hover:bg-[#FFF4DF] dark:hover:bg-[#13282D]'}`}
                    aria-label="Helpful answer"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedback('down')}
                    className={`rounded-md p-1.5 ${feedback === 'down' ? 'bg-[#C8545E]/10 text-[#B3454F] dark:text-[#F08A91]' : 'hover:bg-[#FFF4DF] dark:hover:bg-[#13282D]'}`}
                    aria-label="Not helpful answer"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {notice && (
            <div className="mt-4 rounded-xl border border-[#B8720A]/30 bg-[#B8720A]/10 px-4 py-3 text-sm leading-relaxed text-[#8B5726] dark:text-[#D5A45A]">
              {notice}
            </div>
          )}
        </div>

        <form
          onSubmit={submitQuestion}
          className="shrink-0 border-t border-[#EAE6DD] bg-white px-4 py-3 dark:border-[#29484C] dark:bg-[#183238]"
        >
          <div className="flex items-center gap-2 rounded-xl border border-[#C8DCDA] bg-[#FCFAF7] p-1.5 focus-within:border-[#B8720A] focus-within:ring-2 focus-within:ring-[#B8720A]/10 dark:border-[#31565A] dark:bg-[#13282D] dark:focus-within:border-[#35B3AA]">
            <Search className="ml-2 h-4 w-4 shrink-0 text-[#718789] dark:text-[#9FB5B3]" />
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                activeCase
                  ? `Ask a follow-up about ${activeCase.id}`
                  : 'Ask about a case ID, resource, cost or change'
              }
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-[#8A9B9D] dark:placeholder:text-[#789092]"
              aria-label="Ask Cloud Police"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#B8720A] text-white transition-colors hover:bg-[#9A5E05] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#35B3AA] dark:text-[#0F2024]"
              aria-label="Send question"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-[#718789] dark:text-[#9FB5B3]">
            Recommendations only · Authorized reviewers control every decision
          </p>
        </form>
      </aside>
    </>
  );
};
