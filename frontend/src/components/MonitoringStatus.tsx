import React from 'react';
import { MonitoringStatus as MonitoringStatusData } from '../services/cloudPoliceApi';
import { InfoTooltip } from './InfoTooltip';


interface MonitoringStatusProps {
  connectionStatus: 'loading' | 'live' | 'fallback';
  monitoring: MonitoringStatusData | null;
}

const stateDetails = {
  HEALTHY: {
    label: 'Monitoring healthy',
    description: 'The latest successful scan is within the expected schedule.',
    dot: 'bg-[#2E8B75] dark:bg-[#48B896]',
    badge:
      'border-[#2E8B75]/35 bg-[#2E8B75]/10 text-[#216B5A] dark:border-[#48B896]/40 dark:bg-[#48B896]/10 dark:text-[#72D0B3]',
  },
  DELAYED: {
    label: 'Monitoring delayed',
    description: 'The next scan is later than expected. The last successful result remains available.',
    dot: 'bg-[#B8720A] dark:bg-[#D5A45A]',
    badge:
      'border-[#B8720A]/35 bg-[#B8720A]/10 text-[#8A541B] dark:border-[#D5A45A]/40 dark:bg-[#D5A45A]/10 dark:text-[#E5BB78]',
  },
  ATTENTION_REQUIRED: {
    label: 'Attention required',
    description: 'The latest run failed or the last successful scan is too old.',
    dot: 'bg-[#C8545E] dark:bg-[#DD6B73]',
    badge:
      'border-[#C8545E]/35 bg-[#C8545E]/10 text-[#A53C46] dark:border-[#DD6B73]/40 dark:bg-[#DD6B73]/10 dark:text-[#F08A91]',
  },
  UNKNOWN: {
    label: 'Status not available',
    description: 'Cloud Police is waiting for the first recorded monitor execution.',
    dot: 'bg-[#7B8794] dark:bg-[#9AA7B4]',
    badge:
      'border-[#7B8794]/30 bg-[#7B8794]/10 text-[#52606D] dark:border-[#9AA7B4]/35 dark:bg-[#9AA7B4]/10 dark:text-[#C3CDD6]',
  },
};

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return 'Not recorded yet';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded yet';

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function cloudLabel(value: string): string {
  return value.toUpperCase() === 'AZURE'
    ? 'Azure'
    : value.toUpperCase();
}

function nextRunLabel(lastSuccessful: string | null | undefined, intervalMinutes: number): string {
  if (!lastSuccessful) return 'Not scheduled yet';
  const nextRun = new Date(lastSuccessful).getTime() + intervalMinutes * 60_000;
  if (!Number.isFinite(nextRun)) return 'Not scheduled yet';
  const remainingMinutes = Math.ceil((nextRun - Date.now()) / 60_000);
  if (remainingMinutes <= 0) return 'Due now';
  return `In ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
}

export const MonitoringStatus: React.FC<MonitoringStatusProps> = ({
  connectionStatus,
  monitoring,
}) => {
  const state =
    connectionStatus === 'live' && monitoring
      ? monitoring.state
      : 'UNKNOWN';
  const details = stateDetails[state];
  const isLoading = connectionStatus === 'loading';
  const isUnavailable = connectionStatus === 'fallback';

  const label = isLoading
    ? 'Checking monitoring status'
    : isUnavailable
      ? 'Monitoring status unavailable'
      : details.label;
  const description = isLoading
    ? 'Loading the latest scheduled execution from Cloud Police.'
    : isUnavailable
      ? 'The dashboard API could not provide the latest monitor result.'
      : details.description;

  const cloudCoverage = monitoring?.clouds_checked.length
    ? monitoring.clouds_checked.map(cloudLabel).join(' · ')
    : 'AWS · Azure · GCP';
  const agents = ['Root Agent', 'Diagnosis', 'Cost', 'Change Inspector', 'Remediation'];
  const agentState = state === 'HEALTHY'
    ? 'Healthy'
    : state === 'DELAYED'
      ? 'Delayed'
      : state === 'ATTENTION_REQUIRED'
        ? 'Attention'
        : 'Unknown';
  const totalRuns = monitoring?.total_runs_24h || 0;
  const successfulRuns = monitoring?.successful_runs_24h || 0;

  return (
    <section
      id="overview-monitoring-status"
      aria-labelledby="monitoring-status-title"
      className="rounded-2xl border border-[#EAE6DD] bg-white p-4 shadow-sm dark:border-[#29484C] dark:bg-[#183238] sm:p-4"
    >
      <div className="flex flex-col gap-4 border-b border-[#EAE6DD] pb-5 dark:border-[#29484C] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B8720A] dark:text-[#35B3AA]">
            Scheduled protection
          </p>
          <h2
            id="monitoring-status-title"
            className="mt-1 text-xl font-bold text-[#2B2417] dark:text-[#E4EFED]"
          >
            <span className="inline-flex items-center gap-2">Monitoring Status <InfoTooltip text="Live health of the scheduled Cloud Police monitoring workflow, based on its recorded execution heartbeat." /></span>
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#7B7468] dark:text-[#B2C5C3]">
            {description}
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${details.badge}`}
          aria-live="polite"
        >
          <span className={`h-2.5 w-2.5 rounded-full ${details.dot}`} />
          {label}
        </div>
      </div>

      <dl className="grid grid-cols-1 divide-y divide-[#EAE6DD] dark:divide-[#29484C] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        <div className="py-4 sm:px-5 sm:first:pl-0">
          <dt className="text-xs font-semibold text-[#7B7468] dark:text-[#B2C5C3]">
            <span className="inline-flex items-center gap-1.5">Last successful scan <InfoTooltip text="The completion time of the most recent monitor run recorded with a successful status." /></span>
          </dt>
          <dd className="mt-1 text-sm font-bold text-[#2B2417] dark:text-[#E4EFED]">
            {formatTimestamp(monitoring?.last_successful_scan)}
          </dd>
        </div>

        <div className="py-4 sm:px-5">
          <dt className="text-xs font-semibold text-[#7B7468] dark:text-[#B2C5C3]">
            <span className="inline-flex items-center gap-1.5">Next run <InfoTooltip text="Calculated from the last successful scan and the configured five-minute monitoring schedule." /></span>
          </dt>
          <dd className="mt-1 text-sm font-bold text-[#2B2417] dark:text-[#E4EFED]">
            {nextRunLabel(monitoring?.last_successful_scan, monitoring?.schedule_minutes || 5)}
          </dd>
        </div>

        <div className="py-4 sm:px-5">
          <dt className="text-xs font-semibold text-[#7B7468] dark:text-[#B2C5C3]">
            <span className="inline-flex items-center gap-1.5">24h reliability <InfoTooltip text="Successful monitoring runs divided by all recorded runs during the last 24 hours. The schedule expects 288 runs per day; additional manual runs can make the recorded count higher than 288." /></span>
          </dt>
          <dd className="mt-1 text-sm font-bold text-[#2B2417] dark:text-[#E4EFED]">
            {totalRuns > 0 ? `${successfulRuns} / ${totalRuns} runs` : 'Not recorded yet'}
          </dd>
        </div>

        <div className="py-4 sm:px-5 sm:last:pr-0">
          <dt className="text-xs font-semibold text-[#7B7468] dark:text-[#B2C5C3]">
            <span className="inline-flex items-center gap-1.5">Cloud coverage <InfoTooltip text="Cloud providers included in the latest recorded monitoring execution." /></span>
          </dt>
          <dd className="mt-1 text-sm font-bold text-[#2B2417] dark:text-[#E4EFED]">
            {cloudCoverage}
          </dd>
        </div>
      </dl>

      <div className="border-t border-[#EAE6DD] py-4 dark:border-[#29484C]">
        <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#7B7468] dark:text-[#B2C5C3]">AI agents <InfoTooltip text="Agents participating in the monitoring workflow. Their displayed health follows the latest overall workflow heartbeat; it is not separate per-agent telemetry." /></p>
        <div className="flex flex-wrap gap-2">
          {agents.map((agent) => (
            <span key={agent} className="inline-flex items-center gap-1.5 rounded-full bg-[#F1EEE6] px-2.5 py-1 text-xs font-semibold text-[#40565A] dark:bg-[#262625] dark:text-[#AAA7A0]">
              <span className={`h-1.5 w-1.5 rounded-full ${details.dot}`} />
              {agent} · {agentState}
            </span>
          ))}
        </div>
      </div>

      <details className="flex flex-col gap-1 border-t border-[#EAE6DD] pt-4 text-xs text-[#7B7468] dark:border-[#29484C] dark:text-[#B2C5C3] sm:flex-row sm:items-center sm:justify-between">
        <summary className="cursor-pointer">View monitoring details</summary>
        <span>
          Job: <strong className="font-mono text-[#2B2417] dark:text-[#E4EFED]">{monitoring?.job_name || 'cloud-police-monitor-job'}</strong>
        </span>
        <span>Read-only status from the monitor heartbeat.</span>
      </details>
    </section>
  );
};
