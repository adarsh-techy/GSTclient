import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useInvoices } from '../../hooks/useInvoices';
import { usePeriod, formatPeriod } from '../../hooks/usePeriod';
import { PeriodSelector } from '../../components';
import { BulkActionsBar } from '../../components';
import { ExportButton } from '../../components';
import { fetchCompany, fetchInvoicePdf, openInvoicePdfInNewTab } from '../../api';
import { generateIrnForBill, listIrns, downloadEinvoiceJson, downloadEinvoiceQr } from '../../api';
import { listEWayBills } from '../../api';
import { CancelIrnModal, EmailJsonModal } from '../../components';
import { CancelEWayBillModal, GenerateEWayBillModal, UpdateVehicleModal, hoursSince } from '../../components';
import { apiErrorMessage as apiErr, apiErrorMessage } from '../../api';
import { PageError, PageLoading } from '../../components';
import { useToast } from '../../components';
import { GstinTag } from '../../components';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import type { CarolErpPeriod, EWayBillResponse, InvoiceResponse, IRNResponse } from '../../types/api';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const inrCompact = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
function money(value: number | null | undefined) {
  return value == null ? '' : inr.format(value);
}

type Row = InvoiceResponse & { _irn?: IRNResponse | null; _ewb?: EWayBillResponse | null };

interface ActionsCtx {
  isAdmin: boolean;
  companyEmail?: string;
  openCancel: (invoice: Row, irn: IRNResponse) => void;
  openEmail: (invoice: Row, irn: IRNResponse) => void;
  openGenerateEwb: (invoice: Row) => void;
  openCancelEwb: (invoice: Row, ewb: EWayBillResponse) => void;
  openUpdateEwbVehicle: (invoice: Row, ewb: EWayBillResponse) => void;
  onChanged: () => void;
}

function ActionButton({
  onClick,
  disabled,
  title,
  variant = 'theme',
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  variant?: 'theme' | 'danger' | 'emerald' | 'indigo' | 'sky';
  children: React.ReactNode;
}) {
  const { activeAccentHex } = useTheme();
  const isDanger = variant === 'danger';

  return (
    <div className="relative group/action inline-flex items-center">
      <button
        type="button"
        className={`w-6 h-6 flex items-center justify-center bg-transparent border-0 p-0 transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:pointer-events-none hover:scale-125 active:scale-95 ${
          isDanger ? 'text-rose-500 hover:text-rose-600' : 'hover:opacity-80'
        }`}
        style={!isDanger ? { color: activeAccentHex } : undefined}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
      
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/action:flex flex-col items-center z-50 transition-opacity duration-150">
        <span className="relative z-10 px-2 py-1 text-[10px] font-bold text-white bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md rounded-md shadow-lg whitespace-nowrap border border-slate-700/60">
          {title}
        </span>
        <span className="w-1.5 h-1.5 -mt-1 rotate-45 bg-slate-900 dark:bg-slate-800 border-r border-b border-slate-700/60" />
      </div>
    </div>
  );
}

function RowActions({ invoice, irn, ctx }: { invoice: Row; irn: IRNResponse | null; ctx: ActionsCtx }) {
  const toast = useToast();
  const [printing, setPrinting] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [dlBusy, setDlBusy] = useState(false);

  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);
    try {
      openInvoicePdfInNewTab(await fetchInvoicePdf(invoice.billId));
    } catch (err) {
      toast.show(`Print failed: ${apiErrorMessage(err)}`, 'error');
    } finally {
      setPrinting(false);
    }
  };

  const handleGenerate = async () => {
    if (genBusy) return;
    setGenBusy(true);
    try {
      const r = await generateIrnForBill(invoice.billId);
      const tag = r.source?.startsWith('WHITEBOOKS') ? 'WhiteBooks' : 'stub';
      toast.show(`IRN generated (${tag}): ${r.irnNumber.slice(0, 16)}…`, 'success');
      ctx.onChanged();
    } catch (err) {
      toast.show(`IRN failed: ${apiErr(err)}`, 'error');
    } finally {
      setGenBusy(false);
    }
  };

  const download = async (fn: () => Promise<void>, label: string) => {
    if (dlBusy) return;
    setDlBusy(true);
    try { await fn(); } catch (err) { toast.show(`${label} failed: ${apiErr(err)}`, 'error'); } finally { setDlBusy(false); }
  };

  const status = irn?.lifecycleStatus;
  return (
    <span className="flex items-center justify-center gap-1.5">
      <ActionButton onClick={handlePrint} disabled={printing} title="Print Invoice PDF" variant="theme">
        {printing ? <span className="spinner w-3.5 h-3.5" aria-hidden="true" /> : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
        )}
      </ActionButton>

      {!irn && ctx.isAdmin ? (
        <ActionButton onClick={handleGenerate} disabled={genBusy} title="Generate e-Invoice IRN" variant="emerald">
          {genBusy ? <span className="spinner w-3.5 h-3.5" aria-hidden="true" /> : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          )}
        </ActionButton>
      ) : null}

      {irn && status === 'Cancelled' ? (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" title={irn.cancelReason ? `Reason ${irn.cancelReason}${irn.cancelRemarks ? ': ' + irn.cancelRemarks : ''}` : 'Cancelled'}>Cancelled</span>
      ) : null}

      {irn && status === 'Cancellable' && ctx.isAdmin ? (
        <ActionButton onClick={() => ctx.openCancel(invoice, irn)} title={`Cancel IRN · ${irn.timeRemaining}`} variant="danger">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </ActionButton>
      ) : null}

      {irn && status === 'Locked' ? (
        <ActionButton onClick={() => ctx.openEmail(invoice, irn)} title="Email signed JSON to Buyer" variant="theme">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </ActionButton>
      ) : null}

      {irn ? (
        <ActionButton onClick={() => download(() => downloadEinvoiceJson(invoice.billId, invoice.invoiceNumber), 'Download JSON')} disabled={dlBusy} title="Download Signed JSON" variant="indigo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </ActionButton>
      ) : null}

      {irn && status !== 'Cancelled' ? (
        <ActionButton onClick={() => download(() => downloadEinvoiceQr(invoice.billId, invoice.invoiceNumber), 'Download QR')} disabled={dlBusy} title="Download Invoice QR PNG" variant="sky">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </ActionButton>
      ) : null}

      {irn?.emailSentOn ? (
        <span className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center" title={`Emailed ${irn.emailSentTo ?? ''}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      ) : null}

      {(!invoice._ewb || invoice._ewb.status !== 'Active') && ctx.isAdmin ? (
        <ActionButton
          onClick={() => ctx.openGenerateEwb(invoice)}
          title={invoice._ewb ? `Re-issue e-Way Bill (${invoice._ewb.status})` : 'Generate e-Way Bill'}
          variant="theme"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </ActionButton>
      ) : null}

      {invoice._ewb && invoice._ewb.status === 'Active' && ctx.isAdmin && hoursSince(invoice._ewb.generatedDate) < 24 ? (
        <ActionButton
          onClick={() => ctx.openCancelEwb(invoice, invoice._ewb!)}
          title={`Cancel e-Way Bill · ${(24 - hoursSince(invoice._ewb.generatedDate)).toFixed(1)}h left`}
          variant="danger"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </ActionButton>
      ) : null}

      {invoice._ewb && invoice._ewb.status === 'Active' && ctx.isAdmin && new Date(invoice._ewb.validUntil).getTime() > Date.now() ? (
        <ActionButton
          onClick={() => ctx.openUpdateEwbVehicle(invoice, invoice._ewb!)}
          title={`Update vehicle · current ${invoice._ewb.vehicleNumber || '—'}`}
          variant="theme"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </ActionButton>
      ) : null}
    </span>
  );
}

function EwbCell({ data }: { data?: Row }) {
  const ewb = data?._ewb;
  if (!ewb) return <span className="text-slate-400">—</span>;
  const s = ewb.status;
  const badgeClasses = s === 'Cancelled'
    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
    : s === 'Expired'
    ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
  const label = ewb.source === 'STUB' ? `${s} (stub)` : s;
  return <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold border ${badgeClasses}`} title={`EWB ${ewb.ewbNumber} · valid until ${new Date(ewb.validUntil).toLocaleDateString('en-IN')}`}>{label}</span>;
}

function GstinCell({ value }: { value?: string }) {
  return <GstinTag value={value} />;
}

function EInvoiceCell({ data }: { data?: Row }) {
  const irn = data?._irn;
  if (irn) {
    const s = irn.lifecycleStatus;
    const badgeClasses = s === 'Cancelled'
      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
      : s === 'Locked'
      ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
    const label = irn.isStub ? `${s} (stub)` : s;
    return <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold border ${badgeClasses}`} title={irn.isStub ? 'Test/stub IRN' : irn.source}>{label}</span>;
  }
  switch (data?.eInvoiceStatus) {
    case 'Required': return <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">Required</span>;
    default: return <span className="text-slate-400">—</span>;
  }
}

type SortField = 'invoiceNumber' | 'invoiceDate' | 'partyName' | 'companyName' | 'partyGSTIN' | 'taxableValue' | 'igst' | 'cgst' | 'sgst' | 'totalAmount';

function CustomInvoiceTable({
  rows,
  totals,
  actionsCtx,
  period,
  setPeriod,
  options,
  handleRefresh,
  isFetching,
}: {
  rows: Row[];
  totals: { taxableValue: number; discount: number; igst: number; cgst: number; sgst: number; totalAmount: number };
  actionsCtx: ActionsCtx;
  period: string;
  setPeriod: (p: string) => void;
  options: CarolErpPeriod[];
  handleRefresh: () => void;
  isFetching: boolean;
}) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('invoiceNumber');
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCount, setVisibleCount] = useState(15);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setVisibleCount(15);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
    setVisibleCount(15);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(q)) ||
      (r.partyName && r.partyName.toLowerCase().includes(q)) ||
      (r.partyGSTIN && r.partyGSTIN.toLowerCase().includes(q)) ||
      (r.companyName && r.companyName.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (valA == null) valA = '';
      if (valB == null) valB = '';
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortAsc ? cmp : -cmp;
      }
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortField, sortAsc]);

  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    const onTableScroll = () => {
      if (!wrapper) return;
      if (wrapper.scrollHeight - wrapper.scrollTop - wrapper.clientHeight < 120) {
        setVisibleCount((prev) => (prev < sorted.length ? Math.min(prev + 15, sorted.length) : prev));
      }
    };

    const onWindowScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        setVisibleCount((prev) => (prev < sorted.length ? Math.min(prev + 15, sorted.length) : prev));
      }
    };

    if (wrapper) {
      wrapper.addEventListener('scroll', onTableScroll, { passive: true });
    }
    window.addEventListener('scroll', onWindowScroll, { passive: true });

    return () => {
      if (wrapper) wrapper.removeEventListener('scroll', onTableScroll);
      window.removeEventListener('scroll', onWindowScroll);
    };
  }, [sorted.length]);

  const displayed = sorted.slice(0, visibleCount);

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return <span className="opacity-30 ml-1 text-[10px]">↕</span>;
    return <span className="text-blue-600 dark:text-blue-400 font-bold ml-1 text-[10px]">{sortAsc ? '↑' : '↓'}</span>;
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-3 sm:p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="relative flex items-center w-full sm:min-w-[280px] sm:max-w-md flex-1">
          <span className="absolute left-3 text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#00b4d8] shadow-xs"
            placeholder="Search party, invoice #, GSTIN..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {search ? (
            <button type="button" className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => handleSearchChange('')} aria-label="Clear search">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
          <PeriodSelector value={period} onChange={setPeriod} options={options} />
          <ExportButton kind="invoices" period={period} />
          <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 shadow-xs transition-all cursor-pointer" onClick={handleRefresh} disabled={isFetching} title="Re-pull live data from CarolERP">
            {isFetching ? (
              <><span className="spinner w-3 h-3" aria-hidden="true" />Refreshing…</>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
        <span>Showing <strong className="text-slate-800 dark:text-slate-100 font-bold">{displayed.length}</strong> of <strong className="text-slate-800 dark:text-slate-100 font-bold">{sorted.length}</strong> invoices</span>
        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">15 rows · Scroll for more</span>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[640px] relative scroll-smooth" ref={tableWrapperRef}>
          <table className="w-full border-collapse border-spacing-0 text-xs">
            <thead>
              <tr className="sticky top-0 z-20">
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 cursor-pointer select-none hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left" onClick={() => handleSort('invoiceNumber')}>Invoice # {sortIcon('invoiceNumber')}</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 cursor-pointer select-none hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left" onClick={() => handleSort('invoiceDate')}>Date {sortIcon('invoiceDate')}</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 cursor-pointer select-none hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left" onClick={() => handleSort('partyName')}>Party {sortIcon('partyName')}</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 cursor-pointer select-none hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left" onClick={() => handleSort('companyName')}>Company {sortIcon('companyName')}</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 text-left">GSTIN</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 text-left">e-Invoice</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 text-left">e-Way Bill</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 text-left">POS</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 cursor-pointer select-none hover:bg-blue-50 dark:hover:bg-blue-900/30 text-right" onClick={() => handleSort('taxableValue')}>Taxable {sortIcon('taxableValue')}</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 text-right">Discount</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 text-right">IGST</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 text-right">CGST</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 text-right">SGST</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700 cursor-pointer select-none hover:bg-blue-50 dark:hover:bg-blue-900/30 text-right" onClick={() => handleSort('totalAmount')}>Total {sortIcon('totalAmount')}</th>
                <th className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider py-3 px-2.5 whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                displayed.map((r) => (
                  <tr key={r.billId || r.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-slate-100">{r.invoiceNumber}</td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap text-slate-600 dark:text-slate-300">{r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200 max-w-[220px] truncate" title={r.partyName}>{r.partyName}</td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">{r.companyName || '—'}</td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800"><GstinCell value={r.partyGSTIN} /></td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800"><EInvoiceCell data={r} /></td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800"><EwbCell data={r} /></td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">{r.placeOfSupply || '—'}</td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-800 dark:text-slate-200">{money(r.taxableValue)}</td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-500 dark:text-slate-400">{r.discount ? money(r.discount) : '—'}</td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-800 dark:text-slate-200">{money(r.igst)}</td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-500 dark:text-slate-400">{r.cgst ? money(r.cgst) : '—'}</td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-500 dark:text-slate-400">{r.sgst ? money(r.sgst) : '—'}</td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-800 dark:text-slate-200">{money(r.totalAmount)}</td>
                    <td className="py-2.5 px-2.5 border-b border-slate-100 dark:border-slate-800 text-center whitespace-nowrap">
                      <RowActions invoice={r} irn={r._irn ?? null} ctx={actionsCtx} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="sticky bottom-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
                <td colSpan={2} className="py-3 px-2.5 border-r border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-[11px] tracking-wider uppercase text-slate-700 dark:text-slate-200">
                    TOTAL ({rows.length})
                  </span>
                </td>
                <td colSpan={6} className="py-3 px-2.5 border-r border-slate-200 dark:border-slate-700"></td>
                <td className="py-3 px-2.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-800 dark:text-slate-200 text-xs">{money(totals.taxableValue)}</td>
                <td className="py-3 px-2.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-500 dark:text-slate-400 text-xs">{totals.discount ? money(totals.discount) : '—'}</td>
                <td className="py-3 px-2.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-800 dark:text-slate-200 text-xs">{money(totals.igst)}</td>
                <td className="py-3 px-2.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-800 dark:text-slate-200 text-xs">{totals.cgst ? money(totals.cgst) : '—'}</td>
                <td className="py-3 px-2.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-800 dark:text-slate-200 text-xs">{totals.sgst ? money(totals.sgst) : '—'}</td>
                <td className="py-3 px-2.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-900 dark:text-slate-100 text-xs font-bold">{money(totals.totalAmount)}</td>
                <td className="py-3 px-2.5"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {visibleCount < sorted.length ? (
          <div className="flex items-center justify-between p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500">
            <span>Loaded {displayed.length} of {sorted.length} invoices</span>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-all cursor-pointer"
              onClick={() => setVisibleCount((prev) => Math.min(prev + 15, sorted.length))}
            >
              Load next 15 invoices
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

export function Invoices() {
  const { period, setPeriod, options } = usePeriod();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const { data, isPending, fetchStatus, isError, error, isFetching } = useInvoices(period);
  const irnQuery = useQuery({ queryKey: ['irns'], queryFn: listIrns, staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 });
  const ewbQuery = useQuery({ queryKey: ['ewaybills'], queryFn: listEWayBills, staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 });
  const companyQuery = useQuery({ queryKey: ['company'], queryFn: fetchCompany, staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 });

  const [cancelTarget, setCancelTarget] = useState<{ invoice: Row; irn: IRNResponse } | null>(null);
  const [emailTarget, setEmailTarget] = useState<{ invoice: Row; irn: IRNResponse } | null>(null);
  const [ewbTarget, setEwbTarget] = useState<Row | null>(null);
  const [ewbCancelTarget, setEwbCancelTarget] = useState<{ invoice: Row; ewb: EWayBillResponse } | null>(null);
  const [ewbVehicleTarget, setEwbVehicleTarget] = useState<{ invoice: Row; ewb: EWayBillResponse } | null>(null);

  const irnByBill = useMemo(() => {
    const m = new Map<number, IRNResponse>();
    for (const r of irnQuery.data ?? []) if (r.billId != null) m.set(r.billId, r);
    return m;
  }, [irnQuery.data]);

  const ewbByInvoiceId = useMemo(() => {
    const m = new Map<string, EWayBillResponse>();
    for (const r of ewbQuery.data ?? []) {
      const existing = m.get(r.invoiceId);
      const isBetter = !existing || (existing.status !== 'Active' && r.status === 'Active');
      if (isBetter) m.set(r.invoiceId, r);
    }
    return m;
  }, [ewbQuery.data]);

  const rows = useMemo<Row[]>(
    () => (data ?? []).map((inv) => ({
      ...inv,
      _irn: irnByBill.get(inv.billId) ?? null,
      _ewb: ewbByInvoiceId.get(inv.id) ?? null,
    })),
    [data, irnByBill, ewbByInvoiceId],
  );

  const totals = useMemo(() => rows.reduce(
    (a, r) => ({
      taxableValue: a.taxableValue + r.taxableValue,
      discount: a.discount + (r.discount ?? 0),
      igst: a.igst + r.igst,
      cgst: a.cgst + r.cgst,
      sgst: a.sgst + r.sgst,
      totalAmount: a.totalAmount + r.totalAmount,
    }),
    { taxableValue: 0, discount: 0, igst: 0, cgst: 0, sgst: 0, totalAmount: 0 },
  ), [rows]);

  const onChanged = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['irns'] });
    qc.invalidateQueries({ queryKey: ['ewaybills'] });
    qc.invalidateQueries({ queryKey: ['invoices', period] });
  }, [qc, period]);

  const handleRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['invoices', period] });
    qc.invalidateQueries({ queryKey: ['irns'] });
    qc.invalidateQueries({ queryKey: ['ewaybills'] });
    qc.invalidateQueries({ queryKey: ['company'] });
  }, [qc, period]);

  const actionsCtx = useMemo<ActionsCtx>(() => ({
    isAdmin,
    companyEmail: companyQuery.data?.email ?? undefined,
    openCancel: (invoice, irn) => setCancelTarget({ invoice, irn }),
    openEmail: (invoice, irn) => setEmailTarget({ invoice, irn }),
    openGenerateEwb: (invoice) => setEwbTarget(invoice),
    openCancelEwb: (invoice, ewb) => setEwbCancelTarget({ invoice, ewb }),
    openUpdateEwbVehicle: (invoice, ewb) => setEwbVehicleTarget({ invoice, ewb }),
    onChanged,
  }), [isAdmin, companyQuery.data?.email, onChanged]);

  return (
    <div>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Outward supplies · {formatPeriod(period)}</p>
        </div>
      </header>

      <BulkActionsBar period={period} />

      {!isPending && !isError ? (
        <section className="inv-summary grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
          <SummaryCard
            label="Invoices"
            value={inrCompact.format(rows.length)}
            badge={`${rows.length} Total`}
            badgeType="primary"
            sub={`${rows.filter((r) => r.partyGSTIN).length} B2B · ${rows.filter((r) => !r.partyGSTIN).length} B2C`}
            accent="output"
          />
          <SummaryCard
            label="Taxable Sales"
            value={money(totals.taxableValue)}
            badge="Base"
            badgeType="success"
            sub={totals.discount ? `Discount: ${money(totals.discount)}` : 'Net Taxable Sales'}
            accent="itc"
          />
          <SummaryCard
            label="Total GST"
            value={money(totals.igst + totals.cgst + totals.sgst)}
            badge={totals.igst > 0 && (totals.cgst + totals.sgst) > 0 ? 'IGST + CGST' : totals.igst > 0 ? 'IGST' : 'CGST + SGST'}
            badgeType="purple"
            sub={`IGST: ${money(totals.igst)} · C+S: ${money(totals.cgst + totals.sgst)}`}
            accent="payable"
          />
          <SummaryCard
            label="Gross Amount"
            value={money(totals.totalAmount)}
            badge="Gross"
            badgeType="info"
            sub="Taxable + Total GST"
            accent="irn"
          />
          <SummaryCard
            label="Compliance"
            value={`${rows.filter((r) => r._irn && r._irn.lifecycleStatus !== 'Cancelled').length} IRN · ${rows.filter((r) => r._ewb && r._ewb.status === 'Active').length} EWB`}
            badge="Live"
            badgeType="success"
            sub="Active portal registrations"
            accent="success"
          />
        </section>
      ) : null}

      {isError ? (
        <PageError error={error} what="invoices" />
      ) : isPending ? (
        <PageLoading label="Loading invoices…" paused={fetchStatus === 'paused'} />
      ) : rows.length === 0 ? (
        <div className="page-state">No invoices for {formatPeriod(period)}.</div>
      ) : (
        <CustomInvoiceTable
          rows={rows}
          totals={totals}
          actionsCtx={actionsCtx}
          period={period}
          setPeriod={setPeriod}
          options={options}
          handleRefresh={handleRefresh}
          isFetching={isFetching}
        />
      )}

      {cancelTarget ? (
        <CancelIrnModal
          invoice={cancelTarget.invoice}
          irn={cancelTarget.irn}
          onClose={() => setCancelTarget(null)}
          onDone={() => { setCancelTarget(null); onChanged(); }}
        />
      ) : null}

      {emailTarget ? (
        <EmailJsonModal
          invoice={emailTarget.invoice}
          irn={emailTarget.irn}
          defaultCc={actionsCtx.companyEmail}
          onClose={() => setEmailTarget(null)}
          onDone={() => { setEmailTarget(null); onChanged(); }}
        />
      ) : null}

      {ewbTarget ? (
        <GenerateEWayBillModal
          invoice={ewbTarget}
          onClose={() => setEwbTarget(null)}
          onDone={() => { setEwbTarget(null); onChanged(); }}
        />
      ) : null}

      {ewbCancelTarget ? (
        <CancelEWayBillModal
          invoice={ewbCancelTarget.invoice}
          ewb={ewbCancelTarget.ewb}
          onClose={() => setEwbCancelTarget(null)}
          onDone={() => { setEwbCancelTarget(null); onChanged(); }}
        />
      ) : null}

      {ewbVehicleTarget ? (
        <UpdateVehicleModal
          invoice={ewbVehicleTarget.invoice}
          ewb={ewbVehicleTarget.ewb}
          onClose={() => setEwbVehicleTarget(null)}
          onDone={() => { setEwbVehicleTarget(null); onChanged(); }}
        />
      ) : null}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  sub?: React.ReactNode;
  badge?: string;
  badgeType?: 'primary' | 'success' | 'info' | 'purple' | 'amber';
  accent: 'output' | 'itc' | 'payable' | 'irn' | 'success';
}

const ACCENT_BORDER_CLASSES = {
  output: 'border-t-[3.5px] border-t-blue-600',
  itc: 'border-t-[3.5px] border-t-emerald-600',
  payable: 'border-t-[3.5px] border-t-purple-600',
  irn: 'border-t-[3.5px] border-t-sky-600',
  success: 'border-t-[3.5px] border-t-teal-600',
};

const BADGE_CLASSES = {
  primary: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
};

const BADGE_DOT_CLASSES = {
  primary: 'bg-blue-600 shadow-[0_0_6px_rgba(37,99,235,0.5)]',
  success: 'bg-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
  info: 'bg-sky-600 shadow-[0_0_6px_rgba(2,132,199,0.5)]',
  purple: 'bg-purple-600 shadow-[0_0_6px_rgba(139,92,246,0.5)]',
  amber: 'bg-amber-600 shadow-[0_0_6px_rgba(245,158,11,0.5)]',
};

function SummaryCard({ label, value, sub, badge, badgeType = 'info', accent }: SummaryCardProps) {
  return (
    <div className={`flex flex-col justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all h-[118px] ${ACCENT_BORDER_CLASSES[accent]}`}>
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">{label}</span>
        {badge ? (
          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${BADGE_CLASSES[badgeType]}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${BADGE_DOT_CLASSES[badgeType]}`} />
            {badge}
          </span>
        ) : null}
      </div>
      <div className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight my-auto font-mono" title={value}>{value}</div>
      {sub ? (
        <div className="pt-1.5 mt-auto border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate block" title={typeof sub === 'string' ? sub : undefined}>{sub}</span>
        </div>
      ) : null}
    </div>
  );
}

export { Invoices as InvoicesPage, Invoices as default };
