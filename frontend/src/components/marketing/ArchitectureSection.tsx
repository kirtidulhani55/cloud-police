import React from 'react';
import {
  ArrowRight,
  Database,
  Bot,
  Sparkles,
  LayoutDashboard,
  UserCheck,
  Search,
  DollarSign,
  FileCode,
  Network,
  Cpu,
} from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  const pipelineSteps = [
    {
      title: 'Cloud & Terraform Data',
      desc: 'Telemetry, audit logs, plan outputs',
      icon: Network,
    },
    {
      title: 'BigQuery & Cloud Storage',
      desc: 'Normalized telemetry & evidence lake',
      icon: Database,
    },
    {
      title: 'Google ADK Multi-Agent System',
      desc: 'Specialized diagnostic agents',
      icon: Bot,
    },
    {
      title: 'Gemini Analysis',
      desc: 'Root-cause reasoning & synthesis',
      icon: Sparkles,
    },
    {
      title: 'Cloud Police Dashboard',
      desc: 'Structured findings & diffs',
      icon: LayoutDashboard,
    },
    {
      title: 'Human Review & Approval',
      desc: 'Final reviewer decision gate',
      icon: UserCheck,
    },
  ];

  const agents = [
    {
      name: 'Diagnosis Agent',
      role: 'Investigates incident signals, firewall logs, and connectivity failures.',
      icon: Search,
    },
    {
      name: 'Cost Agent',
      role: 'Tracks daily cloud spending anomalies against baseline utilization.',
      icon: DollarSign,
    },
    {
      name: 'Remediation Agent',
      role: 'Drafts safe Terraform code, validation tests, and rollback plans.',
      icon: FileCode,
    },
    {
      name: 'Root Orchestrator',
      role: 'Coordinates sub-agents and combines results into a unified review packet.',
      icon: Cpu,
    },
  ];

  const technologies = [
    { name: 'Google Cloud', type: 'Cloud Platform' },
    { name: 'BigQuery', type: 'Telemetry Lake' },
    { name: 'Cloud Storage', type: 'Object Store' },
    { name: 'Google ADK', type: 'Multi-Agent Framework' },
    { name: 'Gemini', type: 'LLM Reasoning' },
    { name: 'Terraform', type: 'Infrastructure as Code' },
    { name: 'Python', type: 'Agent Runtime' },
  ];

  return (
    <section id="architecture" className="py-20 bg-[#F4FAF9] dark:bg-[#0F2024] border-t border-[#D4E4E1] dark:border-[#29484C] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#137D78] dark:text-[#35B3AA]">
            System Design
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18373A] dark:text-[#E4EFED]">
            Platform Architecture
          </h2>
          <p className="text-base text-[#5F7779] dark:text-[#9FB5B3]">
            How data flows from multi-cloud environments through Google ADK multi-agent reasoning into human review.
          </p>
        </div>

        {/* 1. End-to-End Pipeline Data Flow */}
        <div className="bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#D4E4E1] dark:border-[#29484C] pb-4">
            <h3 className="text-base font-semibold text-[#18373A] dark:text-[#E4EFED]">
              End-to-End Data Pipeline
            </h3>
            <span className="text-xs font-mono text-[#137D78] dark:text-[#35B3AA]">
              Continuous Read-Only Ingestion
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C] rounded-xl p-4 flex flex-col justify-between relative group hover:border-[#137D78]/50 dark:hover:border-[#35B3AA]/50 transition-colors shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] flex items-center justify-center text-[#137D78] dark:text-[#35B3AA] shadow-2xs">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-[#5F7779] dark:text-[#9FB5B3]">
                        0{idx + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#18373A] dark:text-[#E4EFED] leading-snug">
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-[#5F7779] dark:text-[#9FB5B3] mt-1 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  {idx < pipelineSteps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-[#D4E4E1] dark:text-[#29484C]">
                      <ArrowRight className="w-4 h-4 text-[#137D78] dark:text-[#35B3AA]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Google ADK Multi-Agent System Breakdown */}
        <div className="space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold text-[#18373A] dark:text-[#E4EFED]">
              Google ADK Multi-Agent System
            </h3>
            <p className="text-sm text-[#5F7779] dark:text-[#9FB5B3] mt-2 leading-relaxed">
              The agents work together: one investigates incidents, one checks cloud spending, one prepares the remediation, and the root orchestrator combines the results for human review.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.name}
                  className="bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] rounded-2xl p-6 flex flex-col justify-between hover:border-[#137D78]/50 dark:hover:border-[#35B3AA]/50 transition-colors shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C] flex items-center justify-center text-[#137D78] dark:text-[#35B3AA] shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-[#18373A] dark:text-[#E4EFED]">
                      {agent.name}
                    </h4>
                    <p className="text-xs text-[#5F7779] dark:text-[#9FB5B3] leading-relaxed">
                      {agent.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Technology Stack Badges */}
        <div className="bg-[#ECF5F3] dark:bg-[#13282D] border border-[#D4E4E1] dark:border-[#29484C] rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-semibold text-[#18373A] dark:text-[#E4EFED]">
                Technology Foundation
              </h3>
              <p className="text-xs text-[#5F7779] dark:text-[#9FB5B3]">
                Technologies used across telemetry collection, agent coordination, and plan generation.
              </p>
            </div>
            <span className="text-xs font-mono text-[#137D78] dark:text-[#35B3AA]">Production Stack</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {technologies.map((tech) => (
              <div
                key={tech.name}
                className="px-3.5 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#183238] border border-[#D4E4E1] dark:border-[#29484C] flex items-center gap-2 text-xs text-[#18373A] dark:text-[#E4EFED] shadow-2xs"
              >
                <div className="w-2 h-2 rounded-full bg-[#137D78] dark:bg-[#35B3AA]" />
                <span className="font-semibold">{tech.name}</span>
                <span className="text-[#5F7779] dark:text-[#9FB5B3] font-mono text-[11px]">({tech.type})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
