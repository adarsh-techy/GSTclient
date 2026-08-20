import React from 'react';
import { useGstr3b } from '../../hooks/useInvoices';
import { usePeriod, formatPeriod } from '../../hooks/usePeriod';
import { PeriodSelector } from '../../components';
import { ExportButton } from '../../components';
import { GstnJsonButton } from '../../components';
import { FilingControl } from '../../components';
import { PageError, PageLoading } from '../../components';
import type { Gstr3bLine } from '../../types/api';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

function Gstr3bKpiCard({
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

export function Gstr3b() {
  const { period, setPeriod, options } = usePeriod();
  const { data, isPending, fetchStatus, isError, error } = useGstr3b(period);

  return (
    <div className="flex flex-col gap-6">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">GSTR-3B</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Monthly summary return & net tax settlement for <span className="font-bold text-slate-800 dark:text-slate-200">{formatPeriod(period)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} options={options} />
          <ExportButton kind="gstr3b" period={period} label="Export 3B Excel" />
          <GstnJsonButton kind="gstr3b" period={period} />
          <FilingControl type="Gstr3b" period={period} />
        </div>
      </header>

      {isError ? (
        <PageError error={error} what="GSTR-3B" />
      ) : isPending ? (
        <PageLoading label={`Loading GSTR-3B ${formatPeriod(period)}…`} paused={fetchStatus === 'paused'} />
      ) : !data ? null : (
        <Gstr3bBody data={data} />
      )}
    </div>
  );
}

function Gstr3bBody({ data }: { data: NonNullable<ReturnType<typeof useGstr3b>['data']> }) {
  const out = data.section3_1_OutwardSupplies;
  const itc = data.table4_Itc;
  const net = data.netTaxPayable;
  const cf = data.carryForward;

  const isNilPayable = net.total === 0;

  return (
    <div className="flex flex-col gap-6">
      
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Gstr3bKpiCard
          label="Net Tax Payable in Cash"
          value={inr.format(net.total)}
          subtitle={isNilPayable ? '✓ Nil cash liability (covered by ITC)' : 'Cash deposit required via PMT-06'}
          accent={isNilPayable ? 'emerald' : 'rose'}
          icon={
            isNilPayable ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )
          }
        />

        <Gstr3bKpiCard
          label="Total Eligible ITC (Table 4)"
          value={inr.format(itc.totalItcAvailable)}
          subtitle={`${itc.purchaseCount} inward purchase bills`}
          accent="cyan"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />

        <Gstr3bKpiCard
          label="Outward GST Liability (Sec 3.1)"
          value={inr.format(out.totalGstCollected)}
          subtitle={`${out.invoiceCount} outward sales invoices`}
          accent="indigo"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <Gstr3bKpiCard
          label="ITC Carried Forward"
          value={inr.format(cf.totalCarryForward)}
          subtitle="Closing balance to next period"
          accent="emerald"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
              <path d="M12 6V4M12 20v-2" />
            </svg>
          }
        />
      </section>

      <section className="flex flex-col gap-3.5 p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Section 3.1 — Outward Supplies &amp; Inward Reverse Charge</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Details of outward supplies, zero-rated exports, nil-rated, and supplies attracting reverse charge
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-[#00b4d8]">
              {out.invoiceCount} invoices
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700">Nature of Supply</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Taxable Value</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">IGST</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">CGST</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">SGST</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                <BreakdownRow label="(a) Outward taxable supplies (other than zero rated, nil rated &amp; exempted)" line={out.taxableOutward} />
                <BreakdownRow label="(b) Outward taxable supplies (zero rated - exports / SEZ)" line={out.zeroRated} />
                <BreakdownRow label="(c) Other outward supplies (nil rated, exempted)" line={out.nilRatedExempt} />
                <BreakdownRow label="(d) Inward supplies liable to reverse charge (RCM)" line={out.reverseChargeInward} highlightRcm />
                <BreakdownRow label="(e) Non-GST outward supplies" line={out.nonGstOutward} />
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
                  <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200">
                    TOTAL OUTWARD SUPPLIES
                  </td>
                  <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono font-bold">
                    {inr.format(out.taxableValue)}
                  </td>
                  <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-cyan-600 dark:text-cyan-400">
                    {inr.format(out.igst)}
                  </td>
                  <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-600 dark:text-slate-300">
                    {inr.format(out.cgst)}
                  </td>
                  <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-600 dark:text-slate-300">
                    {inr.format(out.sgst)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {inr.format(out.totalGstCollected)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Outward Invoices</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{out.invoiceCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Taxable Base (a+b+c+e)</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{inr.format(out.taxableValue)}</span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-800/60 flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300">Total Output GST Collected</span>
            <span className="text-sm font-black text-[#0096c7] dark:text-cyan-300 font-mono">{inr.format(out.totalGstCollected)}</span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3.5 p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Table 4 — Eligible Input Tax Credit (ITC)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Summary of all ITC available, import of goods, and reverse charge credit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Total ITC: {inr.format(itc.totalItcAvailable)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCell label="Purchase Documents" value={String(itc.purchaseCount)} sub="Inward bills count" />
          <StatCell label="Taxable Purchase Base" value={inr.format(itc.taxableValue)} sub="Inward purchases" />
          <StatCell label="Integrated Tax (IGST)" value={inr.format(itc.igst)} sub="Inter-state ITC" accent="cyan" />
          <StatCell label="Import IGST (Table 4A1)" value={inr.format(itc.importIgst)} sub="Customs / BoE credit" accent="emerald" />
          <StatCell label="Reverse Charge (Table 4A3)" value={inr.format(itc.reverseChargeIGST + itc.reverseChargeCGST + itc.reverseChargeSGST)} sub="Inward RCM credit" accent="purple" />
          <StatCell label="Central Tax (CGST)" value={inr.format(itc.cgst)} sub="Intra-state central" />
          <StatCell label="State Tax (SGST)" value={inr.format(itc.sgst)} sub="Intra-state state" />
          <StatCell label="Net Available ITC (4A)" value={inr.format(itc.totalItcAvailable)} sub="Gross eligible credit" accent="emerald" highlight />
        </div>

        {itc.note && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 mt-0.5 text-[#00b4d8]">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{itc.note}</span>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <section className="flex flex-col justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Net Tax Payable in Cash</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isNilPayable
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                {isNilPayable ? 'Nil Cash Outflow' : 'Challan Required'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5">
              <StatCell label="IGST" value={inr.format(net.igst)} />
              <StatCell label="CGST" value={inr.format(net.cgst)} />
              <StatCell label="SGST" value={inr.format(net.sgst)} />
              <StatCell
                label="Total Cash"
                value={inr.format(net.total)}
                accent={isNilPayable ? 'emerald' : 'rose'}
                highlight
              />
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border text-xs font-medium ${
              isNilPayable
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/70 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
            }`}
          >
            {isNilPayable
              ? '✓ All outward tax liabilities are completely set off against eligible ITC. No cash payment is due.'
              : `⚠️ You have a net cash liability of ${inr.format(net.total)}. Please create a PMT-06 challan to deposit cash prior to return submission.`}
          </div>
        </section>

        <section className="flex flex-col justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">ITC Carried Forward</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                Closing Credit
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5">
              <StatCell label="IGST Credit" value={inr.format(cf.igst)} />
              <StatCell label="CGST Credit" value={inr.format(cf.cgst)} />
              <StatCell label="SGST Credit" value={inr.format(cf.sgst)} />
              <StatCell label="Total Balance" value={inr.format(cf.totalCarryForward)} accent="emerald" highlight />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 text-xs font-medium text-emerald-900 dark:text-emerald-200">
            {cf.remarks || 'This unutilized ITC balance will be automatically carried forward to the subsequent tax period.'}
          </div>
        </section>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  line,
  highlightRcm = false,
}: {
  label: string;
  line: Gstr3bLine;
  highlightRcm?: boolean;
}) {
  const total = line.igst + line.cgst + line.sgst;

  return (
    <tr className={`hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors ${highlightRcm ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''}`}>
      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200">
        {label}
      </td>
      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-800 dark:text-slate-200">
        {inr.format(line.taxableValue)}
      </td>
      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-cyan-600 dark:text-cyan-400">
        {line.igst ? inr.format(line.igst) : '—'}
      </td>
      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-600 dark:text-slate-300">
        {line.cgst ? inr.format(line.cgst) : '—'}
      </td>
      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-600 dark:text-slate-300">
        {line.sgst ? inr.format(line.sgst) : '—'}
      </td>
      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
        {total ? inr.format(total) : '—'}
      </td>
    </tr>
  );
}

function StatCell({
  label,
  value,
  sub,
  accent,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'cyan' | 'emerald' | 'purple' | 'rose';
  highlight?: boolean;
}) {
  const accentClass = accent
    ? {
        cyan: 'text-[#0096c7] dark:text-cyan-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        purple: 'text-purple-600 dark:text-purple-400',
        rose: 'text-rose-600 dark:text-rose-400',
      }[accent]
    : 'text-slate-900 dark:text-white';

  return (
    <div
      className={`p-3 rounded-xl border flex flex-col justify-between gap-1 transition-all ${
        highlight
          ? 'bg-slate-100/90 dark:bg-slate-900/90 border-slate-300/80 dark:border-slate-600/80 shadow-2xs font-bold'
          : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60'
      }`}
    >
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
        {label}
      </div>
      <div className={`text-sm sm:text-base font-black tracking-tight font-mono truncate ${accentClass}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">{sub}</div>}
    </div>
  );
}

export { Gstr3b as Gstr3bReturnPage, Gstr3b as default };
