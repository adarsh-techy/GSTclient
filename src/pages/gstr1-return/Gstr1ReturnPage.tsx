import { useMemo, useState } from 'react';
import { useB2cs, useGstr1, useGstr1Tables, useInvoices } from '../../hooks/useInvoices';
import { usePeriod, formatPeriod } from '../../hooks/usePeriod';
import { PeriodSelector } from '../../components';
import { ExportButton } from '../../components';
import { GstnJsonButton } from '../../components';
import { FilingControl } from '../../components';
import { GstinTag } from '../../components';
import { PageError, PageLoading } from '../../components';
import type { CarolErpPeriod, Gstr1Section, Gstr1SummaryRow, InvoiceResponse } from '../../types/api';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

type TabKey = 'summary' | 'b2b' | 'export' | 'b2cl' | 'b2cs' | 'cdn' | 'tables';

const TABS: { key: TabKey; label: string; placeholder: string; exportSection?: string }[] = [
  { key: 'summary', label: 'Summary', placeholder: 'party name / GSTIN', exportSection: 'summary' },
  { key: 'b2b', label: 'B2B Invoices', placeholder: 'invoice # / party / GSTIN', exportSection: 'b2b' },
  { key: 'export', label: 'Export Invoices', placeholder: 'export invoice # / party', exportSection: 'export' },
  { key: 'b2cl', label: 'B2C Large', placeholder: 'invoice # / party / POS', exportSection: 'b2cl' },
  { key: 'b2cs', label: 'B2C Small', placeholder: 'supply type / POS / rate', exportSection: 'b2cs' },
  { key: 'cdn', label: 'Credit / Debit Notes', placeholder: 'note # / party / GSTIN', exportSection: 'cdn' },
  { key: 'tables', label: 'HSN / Docs', placeholder: 'HSN code / description / doc type', exportSection: 'tables' },
];

function SectionTag({ section }: { section: Gstr1Section }) {
  const styles: Record<string, string> = {
    B2B: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    Export: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    B2CL: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    B2CS: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    CDN: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  };
  const cls = styles[section] || 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${cls}`}>
      {section}
    </span>
  );
}

function Gstr1KpiCard({
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

function Gstr1ActionBar({
  search,
  setSearch,
  placeholder,
  period,
  setPeriod,
  options,
  exportSection,
  exportLabel,
}: {
  search: string;
  setSearch: (v: string) => void;
  placeholder: string;
  period: string;
  setPeriod: (v: string) => void;
  options: CarolErpPeriod[];
  exportSection?: string;
  exportLabel?: string;
}) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
      
      <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md flex-1">
        <input
          type="text"
          placeholder={`Search ${placeholder}…`}
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
        <ExportButton
          kind="gstr1"
          period={period}
          section={exportSection}
          label={exportLabel ?? 'Export Excel'}
        />
        <GstnJsonButton kind="gstr1" period={period} />
        <FilingControl type="Gstr1" period={period} />
      </div>
    </div>
  );
}

export function Gstr1() {
  const { period, setPeriod, options } = usePeriod();
  const [tab, setTab] = useState<TabKey>('summary');
  const [search, setSearch] = useState('');

  const summaryQ = useGstr1(period);
  const invoicesQ = useInvoices(period);

  const summary = useMemo(() => summaryQ.data ?? [], [summaryQ.data]);
  const invoices = useMemo(() => invoicesQ.data ?? [], [invoicesQ.data]);
  const bySection = useMemo(
    () => ({
      B2B: invoices.filter((i) => i.section === 'B2B'),
      Export: invoices.filter((i) => i.section === 'Export'),
      B2CL: invoices.filter((i) => i.section === 'B2CL'),
      B2CS: invoices.filter((i) => i.section === 'B2CS'),
      CDN: invoices.filter((i) => i.section === 'CDN'),
    }),
    [invoices],
  );

  const counts: Record<TabKey, number> = {
    summary: summary.length,
    b2b: bySection.B2B.length,
    export: bySection.Export.length,
    b2cl: bySection.B2CL.length,
    b2cs: bySection.B2CS.length,
    cdn: bySection.CDN.length,
    tables: 0,
  };

  const isPending = summaryQ.isPending || invoicesQ.isPending;
  const paused = summaryQ.fetchStatus === 'paused' || invoicesQ.fetchStatus === 'paused';
  const isError = summaryQ.isError || invoicesQ.isError;
  const error = (summaryQ.error ?? invoicesQ.error) as Error | undefined;

  const currentTabDef = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
    <div className="flex flex-col gap-6">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">GSTR-1</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Outward supplies and tax liability breakdown for <span className="font-bold text-slate-800 dark:text-slate-200">{formatPeriod(period)}</span>
          </p>
        </div>
      </header>

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

      {isError ? (
        <PageError error={error} what="GSTR-1" />
      ) : isPending ? (
        <PageLoading label="Loading GSTR-1…" paused={paused} />
      ) : tab === 'summary' ? (
        <SummaryTab
          rows={summary}
          search={search}
          setSearch={setSearch}
          period={period}
          setPeriod={setPeriod}
          options={options}
          tabDef={currentTabDef}
        />
      ) : tab === 'b2b' ? (
        <InvoiceTab
          rows={bySection.B2B}
          noun="B2B invoice"
          search={search}
          setSearch={setSearch}
          period={period}
          setPeriod={setPeriod}
          options={options}
          tabDef={currentTabDef}
        />
      ) : tab === 'export' ? (
        <InvoiceTab
          rows={bySection.Export}
          noun="export invoice"
          search={search}
          setSearch={setSearch}
          period={period}
          setPeriod={setPeriod}
          options={options}
          tabDef={currentTabDef}
        />
      ) : tab === 'b2cl' ? (
        <InvoiceTab
          rows={bySection.B2CL}
          noun="B2C large invoice"
          search={search}
          setSearch={setSearch}
          period={period}
          setPeriod={setPeriod}
          options={options}
          tabDef={currentTabDef}
        />
      ) : tab === 'b2cs' ? (
        <B2csTab
          period={period}
          setPeriod={setPeriod}
          options={options}
          search={search}
          setSearch={setSearch}
          tabDef={currentTabDef}
        />
      ) : tab === 'cdn' ? (
        <InvoiceTab
          rows={bySection.CDN}
          noun="credit / debit note"
          docLabel="Note No"
          search={search}
          setSearch={setSearch}
          period={period}
          setPeriod={setPeriod}
          options={options}
          tabDef={currentTabDef}
        />
      ) : (
        <TablesTab
          period={period}
          setPeriod={setPeriod}
          options={options}
          search={search}
          setSearch={setSearch}
          tabDef={currentTabDef}
        />
      )}
    </div>
  );
}

function SummaryTab({
  rows,
  search,
  setSearch,
  period,
  setPeriod,
  options,
  tabDef,
}: {
  rows: Gstr1SummaryRow[];
  search: string;
  setSearch: (v: string) => void;
  period: string;
  setPeriod: (v: string) => void;
  options: CarolErpPeriod[];
  tabDef: typeof TABS[0];
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.partyName.toLowerCase().includes(q) ||
        r.partyGSTIN.toLowerCase().includes(q) ||
        r.section.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const t = filtered.reduce(
    (a, r) => ({
      invoices: a.invoices + r.invoiceCount,
      taxable: a.taxable + r.taxableValue,
      igst: a.igst + r.igst,
      cgst: a.cgst + r.cgst,
      sgst: a.sgst + r.sgst,
      total: a.total + r.totalAmount,
    }),
    { invoices: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0, total: 0 },
  );

  return (
    <div className="flex flex-col gap-5">
      
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Gstr1KpiCard
          label="Total Invoices"
          value={t.invoices}
          subtitle={`${filtered.length} parties shown`}
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

        <Gstr1KpiCard
          label="Taxable Turnover"
          value={inr.format(t.taxable)}
          subtitle="Net taxable turnover base"
          accent="cyan"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <Gstr1KpiCard
          label="IGST Output"
          value={inr.format(t.igst)}
          subtitle="Inter-state tax liability"
          accent="indigo"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          }
        />

        <Gstr1KpiCard
          label="CGST + SGST"
          value={inr.format(t.cgst + t.sgst)}
          subtitle={`${inr.format(t.cgst)} each (intra-state)`}
          accent="purple"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
        />

        <Gstr1KpiCard
          label="Total Value"
          value={inr.format(t.total)}
          subtitle="Gross invoice value"
          accent="emerald"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </section>

      <Gstr1ActionBar
        search={search}
        setSearch={setSearch}
        placeholder={tabDef.placeholder}
        period={period}
        setPeriod={setPeriod}
        options={options}
        exportSection={tabDef.exportSection}
        exportLabel="Download All Excel"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {rows.length === 0 ? 'No outward supplies for this period' : 'No parties match the search filter'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {rows.length === 0 ? 'Select another tax period to view historical returns.' : 'Clear search keywords to view all parties.'}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-end px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="text-slate-900 dark:text-white font-bold mx-1">{filtered.length}</span> of {rows.length} parties
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm">
            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Party Name</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Section</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">GSTIN</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Invoices</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Taxable Value</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">IGST</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">CGST</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">SGST</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">Gross Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filtered.map((r) => (
                    <tr key={`${r.partyGSTIN}|${r.partyName}`} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">{r.partyName}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap"><SectionTag section={r.section} /></td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap"><GstinTag value={r.partyGSTIN} /></td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{r.invoiceCount}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-800 dark:text-slate-200">{inr.format(r.taxableValue)}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-cyan-600 dark:text-cyan-400">{r.igst ? inr.format(r.igst) : '—'}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-500 dark:text-slate-400">{r.cgst ? inr.format(r.cgst) : '—'}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-500 dark:text-slate-400">{r.sgst ? inr.format(r.sgst) : '—'}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{inr.format(r.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="sticky bottom-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
                    <td colSpan={3} className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200">
                      TOTAL ({filtered.length} PARTIES)
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono">{t.invoices}</td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono">{inr.format(t.taxable)}</td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-cyan-600 dark:text-cyan-400">{inr.format(t.igst)}</td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-500 dark:text-slate-400">{inr.format(t.cgst)}</td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-500 dark:text-slate-400">{inr.format(t.sgst)}</td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold">{inr.format(t.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceTab({
  rows,
  noun,
  search,
  setSearch,
  period,
  setPeriod,
  options,
  tabDef,
  docLabel = 'Invoice No',
}: {
  rows: InvoiceResponse[];
  noun: string;
  search: string;
  setSearch: (v: string) => void;
  period: string;
  setPeriod: (v: string) => void;
  options: CarolErpPeriod[];
  tabDef: typeof TABS[0];
  docLabel?: string;
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.partyName.toLowerCase().includes(q) ||
        (r.partyGSTIN ?? '').toLowerCase().includes(q) ||
        (r.placeOfSupply ?? '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const t = filtered.reduce(
    (a, r) => ({
      taxable: a.taxable + r.taxableValue,
      igst: a.igst + r.igst,
      cgst: a.cgst + r.cgst,
      sgst: a.sgst + r.sgst,
      total: a.total + r.totalAmount,
    }),
    { taxable: 0, igst: 0, cgst: 0, sgst: 0, total: 0 },
  );

  return (
    <div className="flex flex-col gap-5">
      
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Gstr1KpiCard
          label={`Total ${noun}s`}
          value={filtered.length}
          subtitle={`of ${rows.length} total records`}
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

        <Gstr1KpiCard
          label="Taxable Turnover"
          value={inr.format(t.taxable)}
          subtitle="Net taxable turnover base"
          accent="cyan"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <Gstr1KpiCard
          label="Total Tax Liability"
          value={inr.format(t.igst + t.cgst + t.sgst)}
          subtitle="IGST + CGST + SGST"
          accent="indigo"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          }
        />

        <Gstr1KpiCard
          label="Gross Total"
          value={inr.format(t.total)}
          subtitle="Consolidated invoice value"
          accent="emerald"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </section>

      <Gstr1ActionBar
        search={search}
        setSearch={setSearch}
        placeholder={tabDef.placeholder}
        period={period}
        setPeriod={setPeriod}
        options={options}
        exportSection={tabDef.exportSection}
        exportLabel={`Export ${tabDef.label} Excel`}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {rows.length === 0 ? `No ${noun}s for this period` : `No ${noun}s match the search query`}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {rows.length === 0 ? 'There are no outward supplies classified in this section.' : 'Clear search keywords to view all records.'}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-end px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="text-slate-900 dark:text-white font-bold mx-1">{filtered.length}</span> of {rows.length} {noun}s
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm">
            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">{docLabel}</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Date</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Party</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">GSTIN</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Taxable Value</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">IGST</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">CGST</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">SGST</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">Gross Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{r.invoiceNumber}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap text-slate-600 dark:text-slate-400">{r.invoiceDate.slice(0, 10)}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">{r.partyName}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap"><GstinTag value={r.partyGSTIN} /></td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-800 dark:text-slate-200">{inr.format(r.taxableValue)}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-cyan-600 dark:text-cyan-400">{r.igst ? inr.format(r.igst) : '—'}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-500 dark:text-slate-400">{r.cgst ? inr.format(r.cgst) : '—'}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-500 dark:text-slate-400">{r.sgst ? inr.format(r.sgst) : '—'}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{inr.format(r.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="sticky bottom-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
                    <td colSpan={4} className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200">
                      TOTAL ({filtered.length} {noun.toUpperCase()}S)
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono">{inr.format(t.taxable)}</td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-cyan-600 dark:text-cyan-400">{inr.format(t.igst)}</td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-500 dark:text-slate-400">{inr.format(t.cgst)}</td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-500 dark:text-slate-400">{inr.format(t.sgst)}</td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold">{inr.format(t.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function B2csTab({
  period,
  setPeriod,
  options,
  search,
  setSearch,
  tabDef,
}: {
  period: string;
  setPeriod: (v: string) => void;
  options: CarolErpPeriod[];
  search: string;
  setSearch: (v: string) => void;
  tabDef: typeof TABS[0];
}) {
  const { data, isPending, fetchStatus, isError, error } = useB2cs(period);
  const rows = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.splyTy.toLowerCase().includes(q) ||
        r.pos.toLowerCase().includes(q) ||
        String(r.rt).includes(q)
    );
  }, [rows, search]);

  if (isPending) return <PageLoading label="Loading B2C (small)…" paused={fetchStatus === 'paused'} />;
  if (isError) return <PageError error={error} what="the B2C (small) summary" />;

  const t = filtered.reduce(
    (a, r) => ({ taxable: a.taxable + r.txval, igst: a.igst + r.iamt, cgst: a.cgst + r.camt, sgst: a.sgst + r.samt }),
    { taxable: 0, igst: 0, cgst: 0, sgst: 0 },
  );

  return (
    <div className="flex flex-col gap-5">
      
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Gstr1KpiCard
          label="B2CS Rate Tiers"
          value={filtered.length}
          subtitle={`of ${rows.length} total rate brackets`}
          accent="blue"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          }
        />

        <Gstr1KpiCard
          label="Taxable Amount"
          value={inr.format(t.taxable)}
          subtitle="Net taxable base"
          accent="cyan"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <Gstr1KpiCard
          label="IGST Output"
          value={inr.format(t.igst)}
          subtitle="Inter-state tax"
          accent="indigo"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          }
        />

        <Gstr1KpiCard
          label="CGST + SGST"
          value={inr.format(t.cgst + t.sgst)}
          subtitle="Intra-state tax"
          accent="purple"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
        />
      </section>

      <Gstr1ActionBar
        search={search}
        setSearch={setSearch}
        placeholder={tabDef.placeholder}
        period={period}
        setPeriod={setPeriod}
        options={options}
        exportSection={tabDef.exportSection}
        exportLabel="Export B2C Small Excel"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {rows.length === 0 ? 'No B2C (small) supplies for this period' : 'No B2C small entries match the search filter'}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-end px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="text-slate-900 dark:text-white font-bold mx-1">{filtered.length}</span> of {rows.length} entries
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm">
            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Supply Type</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">POS</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Rate%</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Taxable</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">IGST</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">CGST</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">SGST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filtered.map((r, i) => (
                    <tr key={`${r.splyTy}|${r.pos}|${r.rt}|${i}`} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200">{r.splyTy}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono">{r.pos}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono">{r.rt}%</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-800 dark:text-slate-200">{inr.format(r.txval)}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-cyan-600 dark:text-cyan-400">{r.iamt ? inr.format(r.iamt) : '—'}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-500 dark:text-slate-400">{r.camt ? inr.format(r.camt) : '—'}</td>
                      <td className="py-3 px-3.5 text-right font-mono text-slate-500 dark:text-slate-400">{r.samt ? inr.format(r.samt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="sticky bottom-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
                    <td colSpan={3} className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200">
                      TOTAL ({filtered.length} ENTRIES)
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono">{inr.format(t.taxable)}</td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-cyan-600 dark:text-cyan-400">{inr.format(t.igst)}</td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-500 dark:text-slate-400">{inr.format(t.cgst)}</td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-500 dark:text-slate-400">{inr.format(t.sgst)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TablesTab({
  period,
  setPeriod,
  options,
  search,
  setSearch,
  tabDef,
}: {
  period: string;
  setPeriod: (v: string) => void;
  options: CarolErpPeriod[];
  search: string;
  setSearch: (v: string) => void;
  tabDef: typeof TABS[0];
}) {
  const { data, isPending, fetchStatus, isError, error } = useGstr1Tables(period);
  const hsn = useMemo(() => data?.hsn ?? [], [data?.hsn]);
  const docs = useMemo(() => data?.docsIssued ?? [], [data?.docsIssued]);

  const filteredHsn = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return hsn;
    return hsn.filter((r) => r.hsnCode.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [hsn, search]);

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => d.docType.toLowerCase().includes(q));
  }, [docs, search]);

  if (isPending) return <PageLoading label="Loading HSN / documents…" paused={fetchStatus === "paused"} />;
  if (isError) return <PageError error={error} what="the HSN / documents tables" />;

  const t = filteredHsn.reduce(
    (a, r) => ({
      taxable: a.taxable + r.taxableValue,
      igst: a.igst + r.igst,
      cgst: a.cgst + r.cgst,
      sgst: a.sgst + r.sgst,
    }),
    { taxable: 0, igst: 0, cgst: 0, sgst: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Gstr1KpiCard
          label="Total HSN Items"
          value={filteredHsn.length}
          subtitle={`of ${hsn.length} total HSN codes`}
          accent="blue"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          }
        />

        <Gstr1KpiCard
          label="HSN Taxable Base"
          value={inr.format(t.taxable)}
          subtitle="Net goods & services"
          accent="cyan"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <Gstr1KpiCard
          label="Total Tax Base"
          value={inr.format(t.igst + t.cgst + t.sgst)}
          subtitle="HSN tax liability"
          accent="indigo"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          }
        />

        <Gstr1KpiCard
          label="Docs Issued"
          value={docs.reduce((acc, d) => acc + d.count, 0)}
          subtitle={`${docs.length} document categories`}
          accent="emerald"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
      </section>

      <Gstr1ActionBar
        search={search}
        setSearch={setSearch}
        placeholder={tabDef.placeholder}
        period={period}
        setPeriod={setPeriod}
        options={options}
        exportSection={tabDef.exportSection}
        exportLabel="Export HSN / Docs Excel"
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Table 12 — HSN Summary</h2>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="text-slate-900 dark:text-white font-bold mx-1">{filteredHsn.length}</span> of {hsn.length} HSN items
          </div>
        </div>

        {filteredHsn.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {hsn.length === 0 ? 'No outward HSN lines for this period' : 'No HSN records match the search filter'}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">HSN Code</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Description</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Rate%</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Quantity</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Taxable Value</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">IGST</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">CGST</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">SGST</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">Gross Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredHsn.map((r) => (
                    <tr key={`${r.hsnCode}|${r.rate}`} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100">{r.hsnCode}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 max-w-[200px] truncate text-slate-700 dark:text-slate-300">{r.description}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono">{r.rate}%</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono">{r.quantity}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-800 dark:text-slate-200">{inr.format(r.taxableValue)}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-cyan-600 dark:text-cyan-400">{r.igst ? inr.format(r.igst) : '—'}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-500 dark:text-slate-400">{r.cgst ? inr.format(r.cgst) : '—'}</td>
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-500 dark:text-slate-400">{r.sgst ? inr.format(r.sgst) : '—'}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{inr.format(r.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="sticky bottom-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
                    <td colSpan={4} className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200">
                      TOTAL ({filteredHsn.length} HSN LINES)
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono">{inr.format(t.taxable)}</td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-cyan-600 dark:text-cyan-400">{inr.format(t.igst)}</td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-500 dark:text-slate-400">{inr.format(t.cgst)}</td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-500 dark:text-slate-400">{inr.format(t.sgst)}</td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold">{inr.format(t.taxable + t.igst + t.cgst + t.sgst)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3.5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Table 13 — Documents Issued</h2>
        {filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">No document records match the search filter</div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm max-w-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700">Document Type</th>
                  <th className="py-3 px-3.5 text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredDocs.map((d) => (
                  <tr key={d.docType} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                    <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200">{d.docType}</td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export { Gstr1 as Gstr1ReturnPage, Gstr1 as default };
