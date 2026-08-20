import { useMemo } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useGstSummary, useIrnList } from '../../hooks/useGstSummary';
import { useGstr1 } from '../../hooks/useInvoices';
import { usePeriod, formatPeriod } from '../../hooks/usePeriod';
import { apiErrorMessage } from '../../api';
import { PeriodSelector } from '../../components';
import { KpiCard } from '../../components';
import { IrnDeadlineBanner } from '../../components';
import { latestFiling } from '../../api';
import type { CarolErpPeriod, Filing } from '../../types/api';

const inrFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (amount: number) => inrFormat.format(amount);

function compactInr(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `₹${Math.round(n / 1e3)}K`;
  return `₹${n}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const trunc = (s: string, n = 18) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const RECON_COLORS: Record<string, string> = {
  Matched: '#10b981', Mismatch: '#f59e0b', Missing: '#ef4444', 'Not in 2B': '#f97316',
};

export function Dashboard() {
  const { period, setPeriod, options, isLoading: periodsLoading, isError: periodsError, error: periodsErr } = usePeriod();
  const summary = useGstSummary(period);
  const irns = useIrnList();
  const gstr1 = useGstr1(period);

  const irnList = irns.data ?? [];
  const trend = useMemo(
    () =>
      [...options]
        .sort((a, b) => a.period.localeCompare(b.period))
        .slice(-12)
        .map((p: CarolErpPeriod) => ({ label: formatPeriod(p.period), Sales: p.salesCount, Purchases: p.purchaseCount })),
    [options],
  );

  const topCustomers = useMemo(
    () =>
      (gstr1.data ?? [])
        .slice()
        .sort((a, b) => b.taxableValue - a.taxableValue)
        .slice(0, 6)
        .map((r) => ({ name: trunc(r.partyName || r.partyGSTIN || '—'), value: round2(r.taxableValue) })),
    [gstr1.data],
  );

  if (summary.isLoading || (periodsLoading && options.length === 0)) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2" />
            <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (summary.isError) {
    const err = summary.error as Error | undefined;
    return (
      <div className="flex flex-col gap-6 w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">Period {formatPeriod(period)}</p>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} options={options} />
        </header>
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col gap-3">
          <div className="text-base font-bold text-rose-800 dark:text-rose-300">Unable to Load Dashboard Data</div>
          <p className="text-xs text-rose-700 dark:text-rose-400">{err?.message ?? 'Please check that the backend service is running on https://localhost:7124.'}</p>
          <button className="px-4 py-2 w-fit rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm" onClick={() => summary.refetch()}>
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const data = summary.data!;
  const out = data.outputGST;
  const itc = data.itcFromGSTR2B;
  const net = data.netTaxPayable;
  const rs = data.reconSummary;

  const reconIssues = rs.mismatch + rs.missing + rs.notIn2B;
  const blockingIssues = rs.mismatch + rs.missing;
  const filingReady = blockingIssues === 0;
  const activeIrns = irnList.filter((i) => i.status === 'Generated').length;
  const periodsErrorMsg = periodsError ? apiErrorMessage(periodsErr) : null;

  const taxPosition = [
    { name: 'Output GST', value: round2(out.totalGST), color: '#3b82f6' },
    { name: 'Eligible ITC', value: round2(itc.eligibleITC), color: '#10b981' },
    { name: 'Net Payable', value: round2(net.total), color: net.total > 0 ? '#6366f1' : '#10b981' },
  ];

  const reconData = [
    { name: 'Matched', value: rs.matched },
    { name: 'Mismatch', value: rs.mismatch },
    { name: 'Missing', value: rs.missing },
    { name: 'Not in 2B', value: rs.notIn2B },
  ].filter((d) => d.value > 0);

  const checklist = [
    { ok: out.invoiceCount > 0, label: `Output supplies captured (${out.invoiceCount})`, warn: false },
    { ok: rs.total > 0, label: 'Reconciliation run against GSTR-2B', warn: rs.total === 0 },
    { ok: rs.mismatch === 0, label: rs.mismatch === 0 ? 'No value mismatches' : `${rs.mismatch} value mismatch(es)`, warn: false },
    { ok: rs.missing === 0, label: rs.missing === 0 ? 'All GSTR-2B invoices in books' : `${rs.missing} invoice(s) missing from books`, warn: false },
    { ok: rs.notIn2B === 0, label: rs.notIn2B === 0 ? 'No purchases pending in GSTR-2B' : `${rs.notIn2B} booked purchase(s) not in 2B`, warn: rs.notIn2B > 0 },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <IrnDeadlineBanner />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Period {formatPeriod(data.period)} · GSTIN {data.tenantGSTIN || '—'}
          </p>
          {periodsErrorMsg ? <p className="text-xs font-semibold text-amber-600 mt-1">CarolERP periods unavailable: {periodsErrorMsg}</p> : null}
        </div>
        <PeriodSelector value={period} onChange={setPeriod} options={options} />
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          label={`Net Tax Payable · ${formatPeriod(data.period)}`}
          value={fmt(net.total)}
          hint={filingReady ? '✓ Ready to file · Cash payable' : `⚠ ${blockingIssues} issue${blockingIssues === 1 ? '' : 's'} to resolve`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
          accent="payable"
        />
        <KpiCard
          label="Output GST"
          value={fmt(out.totalGST)}
          hint={`${out.invoiceCount} invoices · taxable ${compactInr(out.taxableAmount)}`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          }
          accent="output"
        />
        <KpiCard
          label="Eligible ITC (GSTR-2B)"
          value={fmt(itc.eligibleITC)}
          hint={itc.importIgst > 0 ? `Total ITC ${fmt(itc.totalITC)} · incl. import ${compactInr(itc.importIgst)}` : `Total ITC ${fmt(itc.totalITC)}`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="17" y1="7" x2="7" y2="17" />
              <polyline points="17 17 7 17 7 7" />
            </svg>
          }
          accent="itc"
        />
        <KpiCard
          label="Recon Health"
          value={String(reconIssues === 0 ? 'All Clear' : `${reconIssues} Issues`)}
          hint={`${rs.matched} matched of ${rs.total} invoices`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
          accent={reconIssues === 0 ? 'itc' : 'recon'}
        />
        <KpiCard
          label="Carry-Forward Credit"
          value={fmt(data.carryForward.totalCarryForward)}
          hint={`${activeIrns} active IRNs · to next period`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          }
          accent="irn"
        />
      </section>

      <FilingStatusStrip period={data.period} net3b={net.total} itcTotal={itc.totalITC} reconciled={rs.total > 0} />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={`Tax Position Overview — ${formatPeriod(data.period)}`}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={taxPosition} margin={{ top: 12, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.6} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={compactInr} tick={{ fontSize: 11, fill: '#64748b' }} width={64} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  color: '#0f172a',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  padding: '8px 12px',
                }}
                formatter={(value) => [fmt(Number(value)), 'Amount']}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={54}>
                {taxPosition.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="GSTR-2B Reconciliation Breakdown">
          {reconData.length === 0 ? (
            <Empty>No reconciliation data available — fetch GSTR-2B to analyze.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={reconData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {reconData.map((d) => <Cell key={d.name} fill={RECON_COLORS[d.name] ?? '#94a3b8'} />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    color: '#0f172a',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    padding: '8px 12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Activity Trend — Sales vs Purchases">
          {trend.length === 0 ? (
            <Empty>No period history available.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trend} margin={{ top: 12, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.6} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={36} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    color: '#0f172a',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    padding: '8px 12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Purchases" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top 6 Customers by Taxable Sales">
          {gstr1.isLoading ? (
            <Empty>Loading sales data…</Empty>
          ) : topCustomers.length === 0 ? (
            <Empty>No sales recorded for this period.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topCustomers} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.6} />
                <XAxis type="number" tickFormatter={compactInr} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    color: '#0f172a',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    padding: '8px 12px',
                  }}
                  formatter={(value) => [fmt(Number(value)), 'Taxable Sales']}
                />
                <Bar dataKey="value" fill="#0099ff" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Filing Readiness Checklist">
          <div className="flex flex-col gap-2">
            {checklist.map((c) => (
              <div key={c.label} className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold ${c.ok ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300' : c.warn ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-300' : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c.ok ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100' : c.warn ? 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100' : 'bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100'}`}>
                  {c.ok ? '✓' : c.warn ? '!' : '✕'}
                </span>
                <span className="truncate">{c.label}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Statutory Tax Composition">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 pb-1 border-b border-slate-100 dark:border-slate-800">Output GST</div>
              <Line label="IGST" value={fmt(out.igst)} />
              <Line label="CGST" value={fmt(out.cgst)} />
              <Line label="SGST" value={fmt(out.sgst)} />
              <Line label="Taxable Value" value={fmt(out.taxableAmount)} muted />
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 pb-1 border-b border-slate-100 dark:border-slate-800">Input Tax Credit</div>
              <Line label="Total (2B + IMPG)" value={fmt(itc.totalITC)} />
              <Line label="Eligible ITC" value={fmt(itc.eligibleITC)} strong />
              <Line label="Import IGST (BoE)" value={fmt(itc.importIgst)} />
              <Line label="Mismatched / Missing" value={`${fmt(itc.mismatchedITC)} / ${fmt(itc.missingITC)}`} muted />
            </div>
          </div>
        </ChartCard>
      </section>

      <section className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/90 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-blue-200/70 dark:border-indigo-900/50 shadow-xs flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] uppercase tracking-wider shadow-xs">
            ✨ AI Advisor Insights
          </span>
        </div>
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed mt-1">{data.aiRemarks}</div>
      </section>

      <section className="p-6 rounded-2xl bg-white dark:bg-[#151d2a] border border-slate-200/70 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Carry-forward to next period</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">IGST</div>
            <div className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1">{fmt(data.carryForward.igst)}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">CGST</div>
            <div className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1">{fmt(data.carryForward.cgst)}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">SGST</div>
            <div className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1">{fmt(data.carryForward.sgst)}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/40">
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Total Carry-Forward</div>
            <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{fmt(data.carryForward.totalCarryForward)}</div>
          </div>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">{data.carryForward.remarks}</div>
      </section>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#151d2a] border border-slate-200/70 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">{title}</div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="h-48 flex items-center justify-center text-xs font-semibold text-slate-400 dark:text-slate-500 text-center p-4">{children}</div>;
}

function Line({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-xs py-1 ${strong ? 'font-bold text-slate-900 dark:text-slate-100' : muted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function returnDueDate(period: string, day: number): Date | null {
  if (period.length !== 6) return null;
  const y = Number(period.slice(0, 4));
  const m = Number(period.slice(4, 6));
  if (!y || !m || m < 1 || m > 12) return null;
  return new Date(y, m, day);
}

function daysUntil(d: Date): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

function FilingStatusStrip({
  period, net3b, itcTotal, reconciled,
}: { period: string; net3b: number; itcTotal: number; reconciled: boolean }) {
  const g1 = useQuery({ queryKey: ['filing-latest', 'Gstr1', period], queryFn: () => latestFiling(period, 'Gstr1'), enabled: !!period });
  const g3 = useQuery({ queryKey: ['filing-latest', 'Gstr3b', period], queryFn: () => latestFiling(period, 'Gstr3b'), enabled: !!period });

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <FilingStatusCard title="GSTR-1" filing={g1.data ?? null} due={returnDueDate(period, 11)} to="/gstr1"
        figureLabel="Outward" figure={undefined} />
      <FilingStatusCard title="GSTR-3B" filing={g3.data ?? null} due={returnDueDate(period, 20)} to="/gstr3b"
        figureLabel="Net payable" figure={fmt(net3b)} />
      <Gstr2bStatusCard reconciled={reconciled} itc={itcTotal} />
    </section>
  );
}

function FilingStatusCard({
  title, filing, due, to, figureLabel, figure,
}: { title: string; filing: Filing | null; due: Date | null; to: string; figureLabel: string; figure?: string }) {
  const filed = filing?.status === 'Filed';
  const status = !filing ? 'Not started'
    : filing.status === 'Filed' ? 'Filed'
    : filing.status === 'SaveFailed' ? 'Save rejected'
    : filing.status === 'Submitted' ? 'Submitted' : 'Locked';
  const badgeClasses = filed
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
    : filing?.status === 'SaveFailed'
    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200'
    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200';
  const days = due ? daysUntil(due) : null;
  const dueTone = filed ? 'text-slate-800 dark:text-slate-100' : days === null ? 'text-slate-800 dark:text-slate-100' : days < 0 ? 'text-rose-600 dark:text-rose-400' : days <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100';

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#151d2a] border border-slate-200/70 dark:border-slate-800/80 shadow-sm flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{title}</span>
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeClasses}`}>{status}</span>
      </div>
      <div className="flex flex-col">
        {filed ? (
          <>
            <div className="font-mono text-base font-bold text-slate-800 dark:text-slate-100 truncate">{filing?.ackNo ?? '—'}</div>
            <div className="text-[11px] text-slate-500 font-medium">ARN{filing?.filedOn ? ` · ${new Date(filing.filedOn).toLocaleDateString('en-IN')}` : ''}</div>
          </>
        ) : (
          <>
            <div className={`text-base font-extrabold ${dueTone}`}>
              {due ? due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Due{days === null ? '' : days < 0 ? ` · ${-days}d overdue` : days === 0 ? ' · today' : ` · in ${days}d`}
              {figure ? ` · ${figureLabel} ${figure}` : ''}
            </div>
          </>
        )}
      </div>
      <Link to={to} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1">
        {filed ? 'View Return →' : 'File Now →'}
      </Link>
    </div>
  );
}

function Gstr2bStatusCard({ reconciled, itc }: { reconciled: boolean; itc: number }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#151d2a] border border-slate-200/70 dark:border-slate-800/80 shadow-sm flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">GSTR-2B</span>
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${reconciled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200'}`}>
          {reconciled ? 'Reconciled' : 'Not reconciled'}
        </span>
      </div>
      <div className="flex flex-col">
        <div className="text-base font-extrabold text-slate-800 dark:text-slate-100">{fmt(itc)}</div>
        <div className="text-[11px] text-slate-500 font-medium">ITC available{reconciled ? '' : ' · run reconciliation'}</div>
      </div>
      <Link to="/recon" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1">
        {reconciled ? 'View Recon →' : 'Reconcile →'}
      </Link>
    </div>
  );
}

export { Dashboard as DashboardPage, Dashboard as default };
