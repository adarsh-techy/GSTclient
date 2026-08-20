import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listEWayBills } from '../../api';
import { CancelEWayBillModal, UpdateVehicleModal, hoursSince } from '../../components';
import { GstinTag } from '../../components';
import { PageError, PageLoading } from '../../components';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import type { EWayBillResponse, InvoiceResponse } from '../../types/api';

type StatusFilter = 'all' | 'active' | 'cancelled' | 'expired';

function ewbAsInvoice(ewb: EWayBillResponse): InvoiceResponse {
  return {
    id: ewb.invoiceId,
    billId: 0,
    invoiceNumber: ewb.ewbNumber,
    invoiceDate: ewb.generatedDate,
    partyName: ewb.toAddress || '—',
    partyGSTIN: ewb.toGSTIN,
    placeOfSupply: '',
    section: 'B2B',
    gstCategory: 'LocalSales',
    taxableValue: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalAmount: 0,
    eInvoiceStatus: 'NA',
    companyId: null,
    companyName: null,
    lines: [],
  } as unknown as InvoiceResponse;
}

const dtfmt = (s?: string | null) => {
  if (!s) return { date: '—', time: '' };
  const d = new Date(s);
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
};

function StatusBadge({ ewb }: { ewb: EWayBillResponse }) {
  if (ewb.status === 'Cancelled') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
        title={ewb.cancelReason ? `Cancelled: ${ewb.cancelReason}` : 'Cancelled'}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Cancelled
      </span>
    );
  }
  if (ewb.status === 'Expired') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Active
      {ewb.source === 'STUB' && <span className="text-[9px] font-medium opacity-75">(stub)</span>}
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

function EwbCopyCell({ ewbNumber }: { ewbNumber: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ewbNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-xs">
      <span className="font-semibold text-slate-800 dark:text-slate-200 select-all">{ewbNumber}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="p-0.5 rounded text-slate-400 hover:text-[#00b4d8] hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-all cursor-pointer"
        title={copied ? 'Copied!' : 'Copy EWB number'}
      >
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function EWayBills() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const qc = useQueryClient();
  const { data, isPending, fetchStatus, isError, error } = useQuery({ queryKey: ['ewaybills'], queryFn: listEWayBills });

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState<EWayBillResponse | null>(null);
  const [updateTarget, setUpdateTarget] = useState<EWayBillResponse | null>(null);

  const all = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((r) => {
      const statusOk =
        statusFilter === 'all' ? true
          : statusFilter === 'cancelled' ? r.status === 'Cancelled'
            : statusFilter === 'expired' ? r.status === 'Expired'
              : r.status === 'Active';
      const searchOk = !q
        || r.ewbNumber.toLowerCase().includes(q)
        || (r.invoiceNo ?? '').toLowerCase().includes(q)
        || r.vehicleNumber.toLowerCase().includes(q)
        || (r.toAddress ?? '').toLowerCase().includes(q)
        || (r.toGSTIN ?? '').toLowerCase().includes(q)
        || (r.transporterName ?? '').toLowerCase().includes(q);
      return statusOk && searchOk;
    });
  }, [all, statusFilter, search]);

  const summary = useMemo(() => ({
    total: all.length,
    active: all.filter((r) => r.status === 'Active').length,
    cancelled: all.filter((r) => r.status === 'Cancelled').length,
    expired: all.filter((r) => r.status === 'Expired').length,
  }), [all]);

  const onChanged = () => qc.invalidateQueries({ queryKey: ['ewaybills'] });

  return (
    <div className="flex flex-col gap-6">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            e-Way Bills
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Real-time electronic waybill dispatch registry · {all.length} total generated records
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total EWBs</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#00b4d8] flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expired</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-600 dark:text-slate-300">{summary.expired}</div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {(['all', 'active', 'cancelled', 'expired'] as const).map((s) => (
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

          <div className="relative w-full sm:w-auto sm:min-w-[320px] flex-1">
            <input
              type="text"
              placeholder="Search EWB / invoice / vehicle / party / GSTIN…"
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
          Showing <span className="text-slate-900 dark:text-white font-bold">{filtered.length}</span> of {all.length} e-Way Bills
        </div>
      </div>

      {isError ? (
        <PageError error={error} what="e-Way Bills" />
      ) : isPending ? (
        <PageLoading label="Loading e-Way Bills…" paused={fetchStatus === 'paused'} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {all.length === 0 ? 'No e-Way Bills generated yet' : 'No matching e-Way Bills found'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {all.length === 0
              ? 'Generate an e-Way Bill directly from the Invoices page for any active dispatch.'
              : 'Try adjusting your status filter or search keywords.'}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm">
          <div className="overflow-x-auto max-h-[620px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Invoice #</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">EWB Number</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Generated</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Valid Until</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Status</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Vehicle</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">To Party</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">To GSTIN</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Distance</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Mode</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Transporter</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filtered.map((r) => {
                  const within24h = hoursSince(r.generatedDate) < 24;
                  const notExpired = new Date(r.validUntil).getTime() > Date.now();
                  const canCancel = isAdmin && r.status === 'Active' && within24h;
                  const canUpdate = isAdmin && r.status === 'Active' && notExpired;
                  const gen = dtfmt(r.generatedDate);
                  const exp = dtfmt(r.validUntil);

                  return (
                    <tr key={r.ewbId} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                      
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {r.invoiceNo ?? <span className="text-slate-400 font-normal">—</span>}
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        <EwbCopyCell ewbNumber={r.ewbNumber} />
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{gen.date}</span>
                          <span className="text-[10.5px] text-slate-400 font-mono">{gen.time}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`font-semibold ${notExpired ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                            {exp.date}
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-mono">{exp.time}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        <StatusBadge ewb={r} />
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap font-mono font-medium text-slate-800 dark:text-slate-200">
                        {r.vehicleNumber ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200">
                            {r.vehicleNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={r.toAddress || ''}>
                        {r.toAddress || '—'}
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        <GstinTag value={r.toGSTIN} />
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                        {r.distance ? `${r.distance} km` : '—'}
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {r.mode}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 max-w-[160px] truncate text-slate-600 dark:text-slate-400" title={r.transporterName || ''}>
                        {r.transporterName || '—'}
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-3.5 justify-center">
                          
                          {canCancel && (
                            <ActionButton
                              onClick={() => setCancelTarget(r)}
                              title={`Cancel e-Way Bill · ${(24 - hoursSince(r.generatedDate)).toFixed(1)}h left`}
                              variant="rose"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                              </svg>
                            </ActionButton>
                          )}

                          {canUpdate && (
                            <ActionButton
                              onClick={() => setUpdateTarget(r)}
                              title={`Update vehicle · current ${r.vehicleNumber || '—'}`}
                              variant="theme"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </ActionButton>
                          )}

                          {r.status === 'Cancelled' && r.cancelReason && (
                            <div className="relative group/cancelinfo inline-flex items-center justify-center">
                              <span className="text-rose-500 dark:text-rose-400 cursor-pointer">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="16" x2="12" y2="12" />
                                  <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                              </span>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cancelinfo:flex items-center px-2.5 py-1 text-[10.5px] font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-md shadow-xl border border-slate-700 whitespace-nowrap z-50 pointer-events-none transition-all">
                                Cancelled: {r.cancelReason}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                              </div>
                            </div>
                          )}

                          {!canCancel && !canUpdate && !(r.status === 'Cancelled' && r.cancelReason) && (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cancelTarget ? (
        <CancelEWayBillModal
          invoice={ewbAsInvoice(cancelTarget)}
          ewb={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onDone={() => { setCancelTarget(null); onChanged(); }}
        />
      ) : null}

      {updateTarget ? (
        <UpdateVehicleModal
          invoice={ewbAsInvoice(updateTarget)}
          ewb={updateTarget}
          onClose={() => setUpdateTarget(null)}
          onDone={() => { setUpdateTarget(null); onChanged(); }}
        />
      ) : null}
    </div>
  );
}

export { EWayBills as EWayBillsPage, EWayBills as default };
