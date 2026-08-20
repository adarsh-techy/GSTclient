import { useMemo, useState, type ReactNode } from 'react';
import { cancelEWayBill, generateEWayBillForBill, updateEWayBillVehicle } from '../../../api';
import { apiErrorMessage as apiErr } from '../../../api';
import { useToast } from '../../common';
import type { EWayBillResponse, GenerateEWayBillRequest, InvoiceResponse } from '../../../types/api';

const MODES: Array<GenerateEWayBillRequest['mode']> = ['Road', 'Rail', 'Air', 'Ship'];

const CANCEL_REASONS = [
  { code: '1', label: 'Duplicate' },
  { code: '2', label: 'Order Cancelled' },
  { code: '3', label: 'Data Entry Mistake' },
  { code: '4', label: 'Others' },
];

export function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function Overlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div className="w-full max-w-[95vw] sm:max-w-lg p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const VEHICLE_RE = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/;

export function GenerateEWayBillModal({ invoice, onClose, onDone }: {
  invoice: InvoiceResponse;
  onClose: () => void;
  onDone: (ewb: EWayBillResponse) => void;
}) {
  const toast = useToast();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [distance, setDistance] = useState('');
  const [mode, setMode] = useState<GenerateEWayBillRequest['mode']>('Road');
  const [transporterName, setTransporterName] = useState('');
  const [transporterGSTIN, setTransporterGSTIN] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const normalizedVehicle = vehicleNumber.replace(/\s+/g, '').toUpperCase();
  const distanceNum = Number(distance);

  const validate = (): string | null => {
    if (!normalizedVehicle) return 'Vehicle number is required.';
    if (!VEHICLE_RE.test(normalizedVehicle)) return 'Vehicle number format looks invalid (e.g. KL07AB1234).';
    if (!distance || !Number.isFinite(distanceNum) || distanceNum <= 0) return 'Distance must be a positive number.';
    if (distanceNum > 4000) return 'Distance over 4000 km looks wrong — please verify.';
    if (transporterGSTIN && transporterGSTIN.replace(/\s+/g, '').length !== 15) {
      return 'Transporter GSTIN must be 15 characters when provided.';
    }
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) { setErr(v); return; }
    setBusy(true); setErr(null);
    try {
      const body: GenerateEWayBillRequest = {
        vehicleNumber: normalizedVehicle,
        distance: distanceNum,
        mode,
        transporterName: transporterName.trim() || undefined,
        transporterGSTIN: transporterGSTIN.replace(/\s+/g, '').toUpperCase() || undefined,
      };
      const ewb = await generateEWayBillForBill(invoice.billId, body);
      const tag = ewb.source === 'STUB' ? 'stub' : ewb.source;
      toast.show(`e-Way Bill generated (${tag}): ${ewb.ewbNumber}`, 'success');
      onDone(ewb);
    } catch (e) {
      setErr(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Generate e-Way Bill</h3>
      <div className="text-xs text-slate-600 dark:text-slate-300 mb-1">Invoice: <strong className="text-slate-900 dark:text-white">{invoice.invoiceNumber}</strong> · {invoice.partyName}</div>
      <div className="text-xs font-mono text-slate-500 mb-3">Taxable ₹{invoice.taxableValue.toLocaleString('en-IN')} · Total ₹{invoice.totalAmount.toLocaleString('en-IN')}</div>

      <div className="flex flex-col gap-3 text-xs mb-4">
        <label className="flex flex-col gap-1 font-semibold text-slate-700 dark:text-slate-300">
          <span>Vehicle number (required)</span>
          <input
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 font-mono text-xs"
            placeholder="KL07AB1234"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            autoFocus
            maxLength={15}
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 font-semibold text-slate-700 dark:text-slate-300">
            <span>Distance (km)</span>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs"
              placeholder="0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              min={1}
              max={4000}
            />
          </label>
          <label className="flex flex-col gap-1 font-semibold text-slate-700 dark:text-slate-300">
            <span>Transport Mode</span>
            <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs" value={mode} onChange={(e) => setMode(e.target.value as GenerateEWayBillRequest['mode'])}>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 font-semibold text-slate-700 dark:text-slate-300">
          <span>Transporter name (optional)</span>
          <input
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs"
            placeholder="ABC Transport Co."
            value={transporterName}
            onChange={(e) => setTransporterName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 font-semibold text-slate-700 dark:text-slate-300">
          <span>Transporter GSTIN (optional)</span>
          <input
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 font-mono text-xs"
            placeholder="32AABCT2045G1ZU"
            value={transporterGSTIN}
            onChange={(e) => setTransporterGSTIN(e.target.value)}
            maxLength={15}
          />
        </label>
      </div>

      <div className="text-[11px] p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
        From GSTIN, From address, and To address are filled from active company + invoice party. Validity is calculated as ⌈distance ÷ 200 km⌉ days (NIC rule), min 1 day.
      </div>

      {err ? <div className="text-xs text-rose-600 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 mb-3">{err}</div> : null}

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
        <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs" disabled={busy} onClick={submit}>
          {busy ? <><span className="spinner w-3.5 h-3.5" aria-hidden="true" />Generating…</> : 'Generate e-Way Bill'}
        </button>
      </div>
    </Overlay>
  );
}

export function CancelEWayBillModal({ invoice, ewb, onClose, onDone }: {
  invoice: InvoiceResponse;
  ewb: EWayBillResponse;
  onClose: () => void;
  onDone: (updated: EWayBillResponse) => void;
}) {
  const toast = useToast();
  const [reasonCode, setReasonCode] = useState('4');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { hoursLeft, expired } = useMemo(() => {
    const elapsed = hoursSince(ewb.generatedDate);
    const left = 24 - elapsed;
    return { hoursLeft: left, expired: left <= 0 };
  }, [ewb.generatedDate]);

  const submit = async () => {
    if (expired) { setErr('24-hour cancel window has passed.'); return; }
    const codeLabel = CANCEL_REASONS.find((r) => r.code === reasonCode)?.label ?? 'Others';

    const reasonText = remarks.trim()
      ? `${reasonCode}-${codeLabel}: ${remarks.trim()}`
      : `${reasonCode}-${codeLabel}`;

    setBusy(true); setErr(null);
    try {
      const updated = await cancelEWayBill(ewb.ewbId, reasonText);
      toast.show('e-Way Bill cancelled', 'success');
      onDone(updated);
    } catch (e) {
      setErr(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Cancel e-Way Bill</h3>
      <div className="text-xs text-slate-600 dark:text-slate-300 mb-1">Invoice: <strong className="text-slate-900 dark:text-white">{invoice.invoiceNumber}</strong> · {invoice.partyName}</div>
      <div className="text-xs font-mono text-slate-500 mb-2">EWB: {ewb.ewbNumber} · Vehicle {ewb.vehicleNumber || '—'}</div>
      {expired ? (
        <div className="text-xs font-semibold text-rose-600 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 mb-3">⛔ 24-hour cancel window has passed. The EWB can no longer be cancelled.</div>
      ) : (
        <div className="text-xs font-semibold text-amber-600 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 mb-3">⚠ Time remaining: {hoursLeft.toFixed(1)} h</div>
      )}

      <div className="flex flex-col gap-1.5 mb-3 text-xs">
        <label className="font-bold text-slate-700 dark:text-slate-300">Cancel Reason:</label>
        {CANCEL_REASONS.map((r) => (
          <label key={r.code} className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="ewb-cancel-reason"
              value={r.code}
              checked={reasonCode === r.code}
              onChange={() => setReasonCode(r.code)}
              disabled={expired}
            />
            <span>{r.code} - {r.label}</span>
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
        <span>Remarks (optional)</span>
        <textarea
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs"
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={expired}
        />
      </label>

      <div className="text-[11px] p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 mb-3">
        ⚠ This action cannot be undone. After cancellation, the goods movement is no longer covered — a fresh EWB must be issued before the consignment leaves.
      </div>

      {err ? <div className="text-xs text-rose-600 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 mb-3">{err}</div> : null}

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
        <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer" onClick={onClose} disabled={busy}>Close</button>
        <button type="button" className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs" disabled={busy || expired} onClick={submit}>
          {busy ? <><span className="spinner w-3.5 h-3.5" aria-hidden="true" />Cancelling…</> : 'Cancel e-Way Bill'}
        </button>
      </div>
    </Overlay>
  );
}

export function UpdateVehicleModal({ invoice, ewb, onClose, onDone }: {
  invoice: InvoiceResponse;
  ewb: EWayBillResponse;
  onClose: () => void;
  onDone: (updated: EWayBillResponse) => void;
}) {
  const toast = useToast();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const normalized = vehicleNumber.replace(/\s+/g, '').toUpperCase();
  const isSameAsCurrent = normalized === ewb.vehicleNumber.replace(/\s+/g, '').toUpperCase();
  const validity = useMemo(() => {
    const ms = new Date(ewb.validUntil).getTime() - Date.now();
    return { expired: ms <= 0, hoursLeft: ms / 3_600_000 };
  }, [ewb.validUntil]);

  const submit = async () => {
    if (validity.expired) { setErr('e-Way Bill has expired; vehicle cannot be updated.'); return; }
    if (!normalized) { setErr('New vehicle number is required.'); return; }
    if (!VEHICLE_RE.test(normalized)) { setErr('Vehicle number format looks invalid (e.g. KL07AB1234).'); return; }
    if (isSameAsCurrent) { setErr('New vehicle number is the same as the current one.'); return; }

    setBusy(true); setErr(null);
    try {
      const updated = await updateEWayBillVehicle(ewb.ewbId, normalized);
      toast.show(`Vehicle updated to ${normalized}`, 'success');
      onDone(updated);
    } catch (e) {
      setErr(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Update Vehicle</h3>
      <div className="text-xs text-slate-600 dark:text-slate-300 mb-1">Invoice: <strong className="text-slate-900 dark:text-white">{invoice.invoiceNumber}</strong> · {invoice.partyName}</div>
      <div className="text-xs font-mono text-slate-500 mb-1">EWB: {ewb.ewbNumber}</div>
      <div className="text-xs text-slate-600 dark:text-slate-300 mb-2">Current vehicle: <strong className="font-mono">{ewb.vehicleNumber || '—'}</strong></div>
      {validity.expired ? (
        <div className="text-xs font-semibold text-rose-600 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 mb-3">⛔ This e-Way Bill has expired. Vehicle can no longer be updated; issue a new EWB.</div>
      ) : (
        <div className="text-xs font-semibold text-amber-600 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 mb-3">⚠ Valid until {new Date(ewb.validUntil).toLocaleString('en-IN')} · {validity.hoursLeft.toFixed(1)} h remaining</div>
      )}

      <label className="flex flex-col gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
        <span>New vehicle number</span>
        <input
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 font-mono text-xs"
          placeholder="KL07XY9999"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
          autoFocus
          maxLength={15}
          disabled={validity.expired}
        />
      </label>

      <div className="text-[11px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 mb-3">
        Typical reasons: vehicle breakdown / transshipment / re-routing. The EWB number and validity remain unchanged.
      </div>

      {err ? <div className="text-xs text-rose-600 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 mb-3">{err}</div> : null}

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
        <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer" onClick={onClose} disabled={busy}>Close</button>
        <button type="button" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs" disabled={busy || validity.expired} onClick={submit}>
          {busy ? <><span className="spinner w-3.5 h-3.5" aria-hidden="true" />Updating…</> : 'Update Vehicle'}
        </button>
      </div>
    </Overlay>
  );
}
