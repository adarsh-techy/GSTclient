import React, { useMemo, useState } from 'react';
import { useReconResults, useRunRecon } from '../../hooks/useInvoices';
import { usePeriod, formatPeriod } from '../../hooks/usePeriod';
import { PeriodSelector } from '../../components';
import { ExportButton } from '../../components';
import { apiErrorMessage } from '../../api';
import { PageError, PageLoading } from '../../components';
import { useToast } from '../../components';
import { GstinTag } from '../../components';
import type { ReconRowResponse, ReconStatus } from '../../types/api';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

type TabFilter = 'all' | ReconStatus;

const TABS: { key: TabFilter; label: string; noun: string }[] = [
  { key: 'all', label: 'All Records', noun: 'records' },
  { key: 'Matched', label: 'Matched', noun: 'matched records' },
  { key: 'Mismatch', label: 'Mismatch', noun: 'mismatches' },
  { key: 'Missing', label: 'Missing in Books', noun: 'missing records' },
  { key: 'NotIn2B', label: 'Not in GSTR-2B', noun: 'unfiled invoices' },
];

function ReconStatusBadge({ status }: { status: ReconStatus }) {
  const styles: Record<ReconStatus, { bg: string; text: string; border: string; label: string }> = {
    Matched: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-800',
      label: 'Matched',
    },
    Mismatch: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-800',
      label: 'Mismatch',
    },
    Missing: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-300 dark:border-rose-800',
      label: 'Missing in Books',
    },
    NotIn2B: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-300 dark:border-purple-800',
      label: 'Not in 2B',
    },
  };

  const s = styles[status] || styles.Matched;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
}

function SectionBadge({ section }: { section: string }) {
  const isImpg = section === 'IMPG';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
        isImpg
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300 dark:border-blue-800'
      }`}
    >
      {section}
    </span>
  );
}

function ReconKpiCard({
  label,
  value,
  subtitle,
  icon,
  accent = 'cyan',
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: 'cyan' | 'blue' | 'indigo' | 'emerald' | 'purple' | 'amber' | 'rose';
}) {
  const accentStyles = {
    cyan: {
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/60 text-[#00b4d8]',
      valColor: 'text-slate-900 dark:text-white',
      borderHover: 'hover:border-cyan-300 dark:hover:border-cyan-700',
    },
    blue: {
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      valColor: 'text-slate-900 dark:text-white',
      borderHover: 'hover:border-blue-300 dark:hover:border-blue-700',
    },
    indigo: {
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
      valColor: 'text-indigo-600 dark:text-indigo-400',
      borderHover: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    },
    emerald: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      valColor: 'text-emerald-600 dark:text-emerald-400',
      borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    },
    purple: {
      iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
      valColor: 'text-purple-600 dark:text-purple-400',
      borderHover: 'hover:border-purple-300 dark:hover:border-purple-700',
    },
    amber: {
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      valColor: 'text-amber-600 dark:text-amber-400',
      borderHover: 'hover:border-amber-300 dark:hover:border-amber-700',
    },
    rose: {
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
      valColor: 'text-rose-600 dark:text-rose-400',
      borderHover: 'hover:border-rose-300 dark:hover:border-rose-700',
    },
  }[accent];

  return (
    <div
      className={`p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between gap-2.5 transition-all duration-200 hover:shadow-md ${accentStyles.borderHover}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${accentStyles.iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className={`text-xl sm:text-2xl font-black tracking-tight font-mono truncate ${accentStyles.valColor}`}>
          {value}
        </div>
        {subtitle && (
          <div className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export function Recon() {
  const { period, setPeriod, options } = usePeriod();
  const { data, isPending, fetchStatus, isError, error, refetch } = useReconResults(period);
  const runMutation = useRunRecon(period);
  const toast = useToast();

  const [tab, setTab] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleRun = () => {
    if (runMutation.isPending) return;
    runMutation.mutate(undefined, {
      onSuccess: (result) => {
        toast.show(`Reconciliation complete — ${result.rowsProcessed} records audited.`, 'success');
        refetch();
      },
      onError: (err) => {
        toast.show(`Run failed: ${apiErrorMessage(err)}`, 'error');
      },
    });
  };

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const summary = data?.summary ?? { matched: 0, mismatch: 0, missing: 0, notIn2B: 0, total: 0 };
  const matchRate = summary.total > 0 ? Math.round((summary.matched / summary.total) * 100) : 0;

  const counts: Record<TabFilter, number> = {
    all: rows.length,
    Matched: summary.matched,
    Mismatch: summary.mismatch,
    Missing: summary.missing,
    NotIn2B: summary.notIn2B,
  };

  const filteredByTab = useMemo(() => {
    if (tab === 'all') return rows;
    return rows.filter((r) => r.status === tab);
  }, [rows, tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredByTab;
    return filteredByTab.filter(
      (r) =>
        r.invoiceNo.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q) ||
        (r.supplierGSTIN ?? '').toLowerCase().includes(q) ||
        (r.aiRemarks ?? '').toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.section.toLowerCase().includes(q),
    );
  }, [filteredByTab, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (a, r) => ({
        gstR2BAmount: a.gstR2BAmount + r.gstR2BAmount,
        booksAmount: a.booksAmount + r.booksAmount,
        difference: a.difference + r.difference,
      }),
      { gstR2BAmount: 0, booksAmount: 0, difference: 0 },
    );
  }, [filtered]);

  const currentTabDef = TABS.find((t) => t.key === tab) ?? TABS[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.show(`Copied ${text} to clipboard`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Reconciliation
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Cross-audit Purchase Books against GSTN auto-drafted GSTR-2B for <span className="font-bold text-slate-800 dark:text-slate-200">{formatPeriod(period)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportButton kind="recon" period={period} />
          <PeriodSelector value={period} onChange={setPeriod} options={options} />
          <button
            type="button"
            onClick={handleRun}
            disabled={runMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {runMutation.isPending ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Auditing Invoices…</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Run Recon</span>
              </>
            )}
          </button>
        </div>
      </header>

      {isError ? (
        <PageError error={error} what="Reconciliation Results" onRetry={() => void refetch()} />
      ) : isPending ? (
        <PageLoading label={`Auditing & Loading Reconciliation ${formatPeriod(period)}…`} paused={fetchStatus === 'paused'} />
      ) : !data ? null : (
        <>
          
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <ReconKpiCard
              label="Match Rate"
              value={`${matchRate}%`}
              subtitle={`${summary.matched} of ${summary.total} records`}
              accent="emerald"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              }
            />

            <ReconKpiCard
              label="Matched Invoices"
              value={summary.matched}
              subtitle="100% value & tax match"
              accent="cyan"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
            />

            <ReconKpiCard
              label="Value Mismatches"
              value={summary.mismatch}
              subtitle="Amount / tax discrepancy"
              accent="amber"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
            />

            <ReconKpiCard
              label="Missing in Books"
              value={summary.missing}
              subtitle="Present in 2B, not in ERP"
              accent="rose"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              }
            />

            <ReconKpiCard
              label="Not in GSTR-2B"
              value={summary.notIn2B}
              subtitle="Supplier haven't filed yet"
              accent="purple"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              }
            />
          </section>

          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => {
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setTab(t.key);
                    setSearch('');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e6f7fa] dark:bg-cyan-950/60 text-[#0096c7] dark:text-cyan-300 font-bold border border-cyan-400/30 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium'
                  }`}
                >
                  <span>{t.label}</span>
                  {counts[t.key] > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-[#00b4d8] text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {counts[t.key]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            
            <div className="relative min-w-[240px] sm:min-w-[320px] max-w-md">
              <input
                type="text"
                placeholder="Search supplier, GSTIN, invoice #, AI remarks…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs font-medium pl-8 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#00b4d8] shadow-2xs transition-all"
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#00b4d8] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No reconciliation records found for {formatPeriod(period)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                Click "Run Recon" to compare purchase register records against the GSTR-2B statement and identify matched invoices, mismatches, or missing entries.
              </p>
              <button
                type="button"
                onClick={handleRun}
                disabled={runMutation.isPending}
                className="mt-2 px-4 py-2 rounded-xl bg-[#00b4d8] hover:bg-[#0096c7] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                {runMutation.isPending ? 'Auditing…' : 'Run Reconciliation Now'}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No {currentTabDef.noun} found matching your search
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Clear the search query to view all {filteredByTab.length} records in this category.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              
              <div className="flex items-center justify-end px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Showing <span className="text-slate-900 dark:text-white font-bold mx-1">{filtered.length}</span> of {filteredByTab.length} {currentTabDef.noun}
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm">
                <div className="overflow-x-auto max-h-[620px]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Audit Status</th>
                        <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Section</th>
                        <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Supplier Name</th>
                        <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Supplier GSTIN</th>
                        <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Invoice #</th>
                        <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">GSTR-2B Amount</th>
                        <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Books Amount</th>
                        <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Difference</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">AI Audit Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filtered.map((r: ReconRowResponse) => {
                        const isCopied = copiedId === r.reconId;
                        const hasDiff = Math.abs(r.difference) > 1;

                        return (
                          <tr key={r.reconId} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                            <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                              <ReconStatusBadge status={r.status} />
                            </td>
                            <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                              <SectionBadge section={r.section} />
                            </td>
                            <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                              {r.supplierName || '—'}
                            </td>
                            <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                              <GstinTag value={r.supplierGSTIN} />
                            </td>
                            <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{r.invoiceNo}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(r.invoiceNo, r.reconId)}
                                  className="text-slate-400 hover:text-[#00b4d8] transition-colors p-0.5 cursor-pointer"
                                  title="Copy invoice number"
                                >
                                  {isCopied ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  ) : (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-800 dark:text-slate-200">
                              {r.gstR2BAmount ? inr.format(r.gstR2BAmount) : '—'}
                            </td>
                            <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-800 dark:text-slate-200">
                              {r.booksAmount ? inr.format(r.booksAmount) : '—'}
                            </td>
                            <td
                              className={`py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono font-bold whitespace-nowrap ${
                                hasDiff ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {r.difference !== 0 ? inr.format(r.difference) : '₹0.00'}
                            </td>
                            <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 text-xs">
                              {r.aiRemarks ? (
                                <div className="flex items-center gap-1.5">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-500 shrink-0">
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                  </svg>
                                  <span>{r.aiRemarks}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="sticky bottom-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
                        <td colSpan={5} className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200">
                          TOTAL ({filtered.length} {currentTabDef.noun.toUpperCase()})
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono font-bold">
                          {inr.format(totals.gstR2BAmount)}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono font-bold">
                          {inr.format(totals.booksAmount)}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {inr.format(totals.difference)}
                        </td>
                        <td className="py-3 px-3.5"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { Recon as ReconciliationPage, Recon as default };
