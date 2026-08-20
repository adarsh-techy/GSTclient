import { useState, type ReactNode } from 'react';
import { cancelIrn, emailEinvoiceJson } from '../../../api';
import { apiErrorMessage as apiErr } from '../../../api';
import { useToast } from '../../common';
import type { InvoiceResponse, IRNResponse } from '../../../types/api';

const CANCEL_REASONS = [
  { code: '1', label: 'Duplicate' },
  { code: '2', label: 'Data Entry Mistake' },
  { code: '3', label: 'Order Cancelled' },
  { code: '4', label: 'Others' },
];

function Overlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div className="w-full max-w-[95vw] sm:max-w-lg p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function CancelIrnModal({ invoice, irn, onClose, onDone }: {
  invoice: InvoiceResponse; irn: IRNResponse; onClose: () => void; onDone: (updated: IRNResponse) => void;
}) {
  const toast = useToast();
  const [reason, setReason] = useState('4');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!remarks.trim()) { setErr('Remarks are required.'); return; }
    setBusy(true); setErr(null);
    try {
      const updated = await cancelIrn(irn.irnId, reason, remarks.trim());
      toast.show('IRN cancelled successfully', 'success');
      onDone(updated);
    } catch (e) {
      setErr(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Cancel e-Invoice</h3>
      <div className="text-xs text-slate-600 dark:text-slate-300 mb-1">Invoice: <strong className="text-slate-900 dark:text-white">{invoice.invoiceNumber}</strong></div>
      <div className="text-xs font-mono text-slate-500 mb-2 truncate">IRN: {irn.irnNumber}</div>
      <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 mb-4">⚠ Time remaining: {irn.timeRemaining}</div>

      <div className="flex flex-col gap-1.5 mb-4 text-xs">
        <label className="font-bold text-slate-700 dark:text-slate-300">Cancel Reason:</label>
        {CANCEL_REASONS.map((r) => (
          <label key={r.code} className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="radio" className="text-blue-600 cursor-pointer" name="cancel-reason" value={r.code} checked={reason === r.code} onChange={() => setReason(r.code)} />
            <span>{r.code} - {r.label}</span>
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
        <span>Remarks (required)</span>
        <textarea className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </label>

      <div className="text-[11px] text-rose-600 dark:text-rose-400 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 mb-4">⚠ This action cannot be undone. After cancellation, issue a new invoice with correct details.</div>
      {err ? <div className="text-xs text-rose-600 mb-3">{err}</div> : null}

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
        <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer" onClick={onClose} disabled={busy}>Close</button>
        <button type="button" className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs" disabled={busy} onClick={submit}>
          {busy ? <><span className="spinner w-3.5 h-3.5" aria-hidden="true" />Cancelling…</> : 'Cancel e-Invoice'}
        </button>
      </div>
    </Overlay>
  );
}

export function EmailJsonModal({ invoice, irn, defaultCc, onClose, onDone }: {
  invoice: InvoiceResponse; irn: IRNResponse; defaultCc?: string; onClose: () => void; onDone: (updated: IRNResponse) => void;
}) {
  const toast = useToast();
  const [toEmail, setToEmail] = useState('');
  const [ccEmail, setCcEmail] = useState(defaultCc ?? '');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!toEmail.trim()) { setErr('To Email is required.'); return; }
    setBusy(true); setErr(null);
    try {
      await emailEinvoiceJson(invoice.billId, {
        toEmail: toEmail.trim(),
        ccEmail: ccEmail.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      toast.show('Signed JSON emailed successfully', 'success');
      onDone(irn);
    } catch (e) {
      setErr(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Email Signed e-Invoice JSON</h3>
      <div className="text-xs text-slate-600 dark:text-slate-300 mb-1">Invoice: <strong className="text-slate-900 dark:text-white">{invoice.invoiceNumber}</strong></div>
      <div className="text-xs font-mono text-slate-500 mb-4 truncate">IRN: {irn.irnNumber}</div>

      <div className="flex flex-col gap-3 mb-4 text-xs">
        <label className="flex flex-col gap-1 font-bold text-slate-700 dark:text-slate-300">
          <span>To Email (required)</span>
          <input type="email" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600" value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder="buyer@example.com" />
        </label>
        <label className="flex flex-col gap-1 font-bold text-slate-700 dark:text-slate-300">
          <span>CC Email</span>
          <input type="email" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600" value={ccEmail} onChange={(e) => setCcEmail(e.target.value)} placeholder="accounts@example.com" />
        </label>
        <label className="flex flex-col gap-1 font-bold text-slate-700 dark:text-slate-300">
          <span>Remarks</span>
          <textarea className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </label>
      </div>

      {err ? <div className="text-xs text-rose-600 mb-3">{err}</div> : null}

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
        <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer" onClick={onClose} disabled={busy}>Close</button>
        <button type="button" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs" disabled={busy} onClick={submit}>
          {busy ? <><span className="spinner w-3.5 h-3.5" aria-hidden="true" />Sending…</> : 'Send Email'}
        </button>
      </div>
    </Overlay>
  );
}
