import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePeriod, formatPeriod } from '../../hooks/usePeriod';
import { PeriodSelector } from '../../components';
import { GstOtpDialog } from '../../components';
import { PageError, PageLoading } from '../../components';
import { useToast } from '../../components';
import { fetchGstr2b, getGstr2b } from '../../api';
import { getGstSession } from '../../api';
import { apiError, type ApiError } from '../../api';
import { GstnErrorPanel } from '../../components';
import { GstinTag } from '../../components';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

type TabKey = 'all' | 'b2b' | 'cdnr' | 'impg' | 'isd';

const TABS: { key: TabKey; label: string; placeholder: string; noun: string }[] = [
  { key: 'all', label: 'All Records', placeholder: 'supplier / GSTIN / invoice #', noun: 'records' },
  { key: 'b2b', label: 'B2B Invoices', placeholder: 'supplier / GSTIN / invoice #', noun: 'invoices' },
  { key: 'cdnr', label: 'Credit / Debit Notes', placeholder: 'supplier / note #', noun: 'notes' },
  { key: 'impg', label: 'Import of Goods (IMPG)', placeholder: 'port / Bill of Entry #', noun: 'imports' },
  { key: 'isd', label: 'ISD Credit', placeholder: 'ISD supplier / invoice #', noun: 'ISD credits' },
];

function Gstr2bSectionTag({ type }: { type: string }) {
  const styles: Record<string, string> = {
    B2B: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    B2BA: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    CDNR: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    CDNRA: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    IMPG: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    ISD: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  };
  const cls = styles[type] || 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${cls}`}>
      {type}
    </span>
  );
}

function Gstr2bKpiCard({
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
  accent?: 'cyan' | 'blue' | 'indigo' | 'emerald' | 'purple' | 'amber';
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

export function Gstr2b() {
  const { period, setPeriod, options } = usePeriod();
  const qc = useQueryClient();
  const toast = useToast();
  const query = useQuery({
    queryKey: ['gstr2b', period],
    queryFn: () => getGstr2b(period),
    enabled: Boolean(period),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const sessionQuery = useQuery({
    queryKey: ['gst-session'],
    queryFn: getGstSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [fetchError, setFetchError] = useState<ApiError | null>(null);

  const fetchMut = useMutation({
    mutationFn: () => fetchGstr2b(period),
    onSuccess: (data) => {
      toast.show(
        data.recordsFetched > 0
          ? `GSTR-2B fetched (${data.recordsFetched} records) and reconciled successfully.`
          : 'GSTR-2B fetched — GSTN returned 0 records for this period.',
        'success',
      );
      qc.setQueryData(['gstr2b', period], data);
      qc.invalidateQueries({ queryKey: ['recon'] });
      qc.invalidateQueries({ queryKey: ['gst-summary'] });
    },
    onError: (err) => {
      const data = (err as { response?: { data?: { error?: string; code?: string; reason?: string } } }).response?.data;
      if (data?.code === 'NOT_CONNECTED') {
        if (data.reason === 'no_session') {
          toast.show('Connect to GSTN first — opening OTP dialog…', 'error');
          setOtpOpen(true);
        } else {
          toast.show(data.error ?? 'GST API is not configured. Add credentials in Settings → GST API.', 'error');
        }
        return;
      }
      const parsed = apiError(err);
      setFetchError(parsed);
      if (parsed.action === 'reauthenticate') setOtpOpen(true);
      toast.show(`Fetch failed: ${parsed.message}`, 'error');
    },
    onMutate: () => setFetchError(null),
  });

  const records = useMemo(() => query.data?.records ?? [], [query.data]);

  const bySection = useMemo(() => {
    return {
      all: records,
      b2b: records.filter((r) => !['IMPG', 'CDNR', 'CDNRA', 'ISD'].includes(r.recordType)),
      cdnr: records.filter((r) => r.recordType === 'CDNR' || r.recordType === 'CDNRA'),
      impg: records.filter((r) => r.recordType === 'IMPG'),
      isd: records.filter((r) => r.recordType === 'ISD'),
    };
  }, [records]);

  const counts: Record<TabKey, number> = {
    all: records.length,
    b2b: bySection.b2b.length,
    cdnr: bySection.cdnr.length,
    impg: bySection.impg.length,
    isd: bySection.isd.length,
  };

  const currentTabDef = TABS.find((t) => t.key === tab) ?? TABS[0];
  const activeRecords = bySection[tab] ?? records;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeRecords;
    return activeRecords.filter(
      (r) =>
        r.invoiceNo.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q) ||
        (r.supplierGSTIN ?? '').toLowerCase().includes(q) ||
        r.recordType.toLowerCase().includes(q),
    );
  }, [activeRecords, search]);

  const globalTotals = useMemo(() => {
    return records.reduce(
      (a, r) => ({
        taxable: a.taxable + r.taxableAmount,
        igst: a.igst + r.igstAmount,
        cgst: a.cgst + r.cgstAmount,
        sgst: a.sgst + r.sgstAmount,
        itc: a.itc + r.igstAmount + r.cgstAmount + r.sgstAmount,
      }),
      { taxable: 0, igst: 0, cgst: 0, sgst: 0, itc: 0 },
    );
  }, [records]);

  const filteredTotals = useMemo(() => {
    return filtered.reduce(
      (a, r) => ({
        taxable: a.taxable + r.taxableAmount,
        igst: a.igst + r.igstAmount,
        cgst: a.cgst + r.cgstAmount,
        sgst: a.sgst + r.sgstAmount,
        itc: a.itc + r.igstAmount + r.cgstAmount + r.sgstAmount,
      }),
      { taxable: 0, igst: 0, cgst: 0, sgst: 0, itc: 0 },
    );
  }, [filtered]);

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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">GSTR-2B</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Auto-drafted Input Tax Credit (ITC) statement for <span className="font-bold text-slate-800 dark:text-slate-200">{formatPeriod(period)}</span>
            {query.data && query.data.recordsFetched > 0 ? (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                Source: {query.data.source}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {sessionQuery.data?.configured ? (
            sessionQuery.data.hasSession ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                GSTN Connected ✓
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setOtpOpen(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#00b4d8] hover:text-[#00b4d8] transition-all cursor-pointer shadow-2xs"
              >
                Connect to GSTN (OTP)
              </button>
            )
          ) : null}

          <button
            type="button"
            disabled={fetchMut.isPending}
            onClick={() => fetchMut.mutate()}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {fetchMut.isPending ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Fetching from GSTN…</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>Fetch from GSTN</span>
              </>
            )}
          </button>
        </div>
      </header>

      {fetchError ? (
        <GstnErrorPanel
          error={fetchError}
          onAction={
            fetchError.action === 'reauthenticate' || fetchError.action === 'retry'
              ? (action: any) => {
                  setFetchError(null);
                  if (action === 'reauthenticate') setOtpOpen(true);
                  else fetchMut.mutate();
                }
              : undefined
          }
        />
      ) : null}

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Gstr2bKpiCard
          label="Total ITC Documents"
          value={records.length}
          subtitle={`${new Set(records.map((r) => r.supplierGSTIN)).size} unique suppliers`}
          accent="blue"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />

        <Gstr2bKpiCard
          label="Taxable / Assessable"
          value={inr.format(globalTotals.taxable)}
          subtitle="Net inward purchase base"
          accent="cyan"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <Gstr2bKpiCard
          label="Eligible IGST"
          value={inr.format(globalTotals.igst)}
          subtitle="Inter-state input credit"
          accent="indigo"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          }
        />

        <Gstr2bKpiCard
          label="Eligible CGST + SGST"
          value={inr.format(globalTotals.cgst + globalTotals.sgst)}
          subtitle={`${inr.format(globalTotals.cgst)} each (intra-state)`}
          accent="purple"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
        />

        <Gstr2bKpiCard
          label="Total ITC Available"
          value={inr.format(globalTotals.itc)}
          subtitle="Gross auto-drafted ITC"
          accent="emerald"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
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
            placeholder={`Search ${currentTabDef.placeholder}…`}
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

        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} options={options} />
        </div>
      </div>

      {query.isError ? (
        <PageError error={query.error} what={`GSTR-2B ${formatPeriod(period)}`} onRetry={() => void query.refetch()} />
      ) : query.isPending ? (
        <PageLoading label={`Loading GSTR-2B ${formatPeriod(period)}…`} paused={query.fetchStatus === 'paused'} />
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#00b4d8] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No GSTR-2B statement data for {formatPeriod(period)} yet
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            {sessionQuery.data?.configured && !sessionQuery.data.hasSession
              ? 'Connect your active GSTN session with OTP, then fetch the auto-drafted ITC statement directly from the government portal.'
              : 'Click "Fetch from GSTN" to pull the official auto-drafted ITC records for this period.'}
          </p>
          <div className="flex items-center gap-2.5 mt-2">
            {sessionQuery.data?.configured && !sessionQuery.data.hasSession ? (
              <button
                type="button"
                onClick={() => setOtpOpen(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#00b4d8] transition-all cursor-pointer"
              >
                Connect to GSTN (OTP)
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => fetchMut.mutate()}
              disabled={fetchMut.isPending}
              className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] transition-all cursor-pointer shadow-sm"
            >
              {fetchMut.isPending ? 'Fetching…' : 'Fetch from GSTN'}
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No {currentTabDef.noun} match your search filter
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Clear the search keyword to view all {activeRecords.length} records.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          
          <div className="flex items-center justify-end px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="text-slate-900 dark:text-white font-bold mx-1">{filtered.length}</span> of {activeRecords.length} {currentTabDef.noun}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm">
            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Type</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Supplier Name</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Supplier GSTIN</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Doc / BoE #</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Date</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Taxable Value</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">IGST</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">CGST</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">SGST</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">Total ITC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filtered.map((r) => {
                    const isImpg = r.recordType === 'IMPG';
                    const isCopied = copiedId === r.gstR2BId;
                    const docTotal = r.igstAmount + r.cgstAmount + r.sgstAmount;

                    return (
                      <tr key={r.gstR2BId} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                          <Gstr2bSectionTag type={r.recordType} />
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                          {isImpg ? (r.supplierName || 'Import from Overseas') : (r.supplierName || '—')}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                          {isImpg ? (
                            <span className="text-slate-400 font-mono text-[11px]">— (Customs)</span>
                          ) : (
                            <GstinTag value={r.supplierGSTIN} />
                          )}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{r.invoiceNo}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(r.invoiceNo, r.gstR2BId)}
                              className="text-slate-400 hover:text-[#00b4d8] transition-colors p-0.5 cursor-pointer"
                              title="Copy document number"
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
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {r.invoiceDate.slice(0, 10)}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-800 dark:text-slate-200">
                          {inr.format(r.taxableAmount)}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-cyan-600 dark:text-cyan-400">
                          {r.igstAmount ? inr.format(r.igstAmount) : '—'}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-500 dark:text-slate-400">
                          {r.cgstAmount ? inr.format(r.cgstAmount) : '—'}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-500 dark:text-slate-400">
                          {r.sgstAmount ? inr.format(r.sgstAmount) : '—'}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {inr.format(docTotal)}
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
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono">
                      {inr.format(filteredTotals.taxable)}
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-cyan-600 dark:text-cyan-400">
                      {inr.format(filteredTotals.igst)}
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-500 dark:text-slate-400">
                      {inr.format(filteredTotals.cgst)}
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-500 dark:text-slate-400">
                      {inr.format(filteredTotals.sgst)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {inr.format(filteredTotals.itc)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {otpOpen ? (
        <GstOtpDialog
          onClose={() => setOtpOpen(false)}
          onConnected={() => {
            setOtpOpen(false);
            qc.invalidateQueries({ queryKey: ['gst-session'] });
          }}
        />
      ) : null}
    </div>
  );
}

export { Gstr2b as Gstr2bItcPage, Gstr2b as default };
