import { useMemo, useState } from 'react';
import { useIrnList } from '../../hooks/useGstSummary';
import { downloadEinvoiceJson, downloadEinvoiceQr } from '../../api';
import { apiErrorMessage } from '../../api';
import { PageError, PageLoading } from '../../components';
import { useToast } from '../../components';
import { useTheme } from '../../theme/ThemeContext';
import type { IRNLifecycleStatus } from '../../types/api';

const dtfmt = (s?: string | null) => {
  if (!s) return { date: '—', time: '' };
  const d = new Date(s);
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
};

function StatusBadge({ status, isCancellable, cancelReason }: { status: IRNLifecycleStatus; isCancellable?: boolean; cancelReason?: string | null }) {
  if (status === 'Cancelled') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
        title={cancelReason ? `Cancelled: ${cancelReason}` : 'IRN Cancelled'}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Cancelled
      </span>
    );
  }
  if (status === 'Cancellable' || isCancellable) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Cancellable
      </span>
    );
  }
  if (status === 'Locked') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Locked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  );
}

function ActionButton({
  onClick,
  title,
  variant = 'theme',
  children,
}: {
  onClick: () => void;
  title: string;
  variant?: 'theme' | 'emerald' | 'indigo' | 'rose' | 'amber';
  children: React.ReactNode;
}) {
  const { activeAccentHex } = useTheme();
  const isDanger = variant === 'rose';

  return (
    <div className="relative group/action inline-flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        className={`bg-transparent border-0 p-0 flex items-center justify-center transition-all duration-150 hover:scale-125 active:scale-95 cursor-pointer ${
          isDanger ? 'text-rose-500 hover:text-rose-600' : 'hover:opacity-80'
        }`}
        style={!isDanger ? { color: activeAccentHex } : undefined}
        aria-label={title}
      >
        {children}
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/action:flex items-center px-2.5 py-1 text-[10.5px] font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-md shadow-xl border border-slate-700 whitespace-nowrap z-50 pointer-events-none transition-all">
        {title}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
      </div>
    </div>
  );
}

function IrnCopyCell({ irn }: { irn: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(irn);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative group/irn inline-flex items-center gap-1.5 font-mono text-xs">
      <span className="text-slate-700 dark:text-slate-300 select-all font-mono" title={irn}>
        {irn.slice(0, 16)}…{irn.slice(-6)}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 rounded text-slate-400 hover:text-[#00b4d8] hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-all cursor-pointer"
        title={copied ? 'Copied!' : 'Copy full 64-char IRN'}
      >
        {copied ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function EInvoiceHistory() {
  const { data, isPending, fetchStatus, isError, error } = useIrnList();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all');
  const [search, setSearch] = useState('');

  const all = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((r) => {
      const matchStatus =
        statusFilter === 'all' ? true
          : statusFilter === 'cancelled' ? r.lifecycleStatus === 'Cancelled'
            : r.lifecycleStatus !== 'Cancelled';
      const matchSearch = !q
        || r.invoiceNo.toLowerCase().includes(q)
        || r.irnNumber.toLowerCase().includes(q)
        || r.acknowledgementNo.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [all, statusFilter, search]);

  const summary = useMemo(() => ({
    total: all.length,
    active: all.filter((r) => r.lifecycleStatus !== 'Cancelled').length,
    cancelled: all.filter((r) => r.lifecycleStatus === 'Cancelled').length,
    emailed: all.filter((r) => r.emailSentOn).length,
    pendingEmail: all.filter((r) => r.lifecycleStatus === 'Locked' && !r.emailSentOn).length,
  }), [all]);

  const download = async (fn: () => Promise<void>, label: string) => {
    try {
      await fn();
      toast.show(`${label} downloaded successfully`, 'success');
    } catch (err) {
      toast.show(`${label} failed: ${apiErrorMessage(err)}`, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            e-Invoice History
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Real-time Government IRN registry and signed payload repository · {all.length} total generated records
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total IRNs</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#00b4d8] flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{summary.total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">{summary.active}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cancelled</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">{summary.cancelled}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Emailed</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">{summary.emailed}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pending Email</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">{summary.pendingEmail}</div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {(['all', 'active', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-[280px] flex-1">
            <input
              type="text"
              placeholder="Search invoice / IRN / Ack no…"
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

        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 self-center sm:self-auto">
          Showing <span className="text-slate-900 dark:text-white font-bold">{filtered.length}</span> of {all.length} IRNs
        </div>
      </div>

      {isError ? (
        <PageError error={error} what="e-Invoice history" />
      ) : isPending ? (
        <PageLoading label="Loading e-Invoice history…" paused={fetchStatus === 'paused'} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">No IRN records found</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting your status filter or search query.</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm">
          <div className="overflow-x-auto max-h-[620px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Invoice No</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Ack Date & Time</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">IRN Hash</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Ack No</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Status</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Age</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filtered.map((r) => {
                  const ack = dtfmt(r.acknowledgementDate);
                  return (
                    <tr key={r.irnId} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                      
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{r.invoiceNo}</span>
                          {r.isStub && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              Stub
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{ack.date}</span>
                          <span className="text-[10.5px] text-slate-400 font-mono">{ack.time}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        <IrnCopyCell irn={r.irnNumber} />
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {r.acknowledgementNo || '—'}
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        <StatusBadge status={r.lifecycleStatus} isCancellable={r.isCancellable} cancelReason={r.cancelReason} />
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                          {r.ageHours.toFixed(1)}h
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {r.billId != null ? (
                          <div className="inline-flex items-center gap-3.5 justify-center">
                            
                            <ActionButton
                              onClick={() => download(() => downloadEinvoiceJson(r.billId!, r.invoiceNo), 'Signed JSON')}
                              title="Download Signed JSON"
                              variant="theme"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </ActionButton>

                            {r.lifecycleStatus !== 'Cancelled' && (
                              <ActionButton
                                onClick={() => download(() => downloadEinvoiceQr(r.billId!, r.invoiceNo), 'Invoice QR PNG')}
                                title="Download Invoice QR PNG"
                                variant="indigo"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="7" height="7" />
                                  <rect x="14" y="3" width="7" height="7" />
                                  <rect x="14" y="14" width="7" height="7" />
                                  <rect x="3" y="14" width="7" height="7" />
                                </svg>
                              </ActionButton>
                            )}

                            {r.emailSentOn && (
                              <div className="relative group/email inline-flex items-center justify-center">
                                <span className="text-emerald-500 dark:text-emerald-400">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                  </svg>
                                </span>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/email:flex items-center px-2.5 py-1 text-[10.5px] font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-md shadow-xl border border-slate-700 whitespace-nowrap z-50 pointer-events-none transition-all">
                                  Emailed to {r.emailSentTo || 'Buyer'} ({new Date(r.emailSentOn).toLocaleDateString('en-IN')})
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export { EInvoiceHistory as EInvoiceHistoryPage, EInvoiceHistory as default };
