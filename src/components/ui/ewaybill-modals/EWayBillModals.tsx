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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
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
      <h3 className="modal-title">Generate e-Way Bill</h3>
      <div className="modal-meta">Invoice: <strong>{invoice.invoiceNumber}</strong> · {invoice.partyName}</div>
      <div className="modal-meta mono">Taxable {invoice.taxableValue.toLocaleString('en-IN')} · Total {invoice.totalAmount.toLocaleString('en-IN')}</div>

      <label className="login-label">
        Vehicle number (required)
        <input
          className="login-input"
          placeholder="KL07AB1234"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
          autoFocus
          maxLength={15}
        />
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <label className="login-label" style={{ flex: 1 }}>
          Distance (km)
          <input
            type="number"
            className="login-input"
            placeholder="0"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            min={1}
            max={4000}
          />
        </label>
        <label className="login-label" style={{ flex: 1 }}>
          Mode
          <select className="login-input" value={mode} onChange={(e) => setMode(e.target.value as GenerateEWayBillRequest['mode'])}>
            {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>

      <label className="login-label">
        Transporter name (optional)
        <input
          className="login-input"
          placeholder="ABC Transport Co."
          value={transporterName}
          onChange={(e) => setTransporterName(e.target.value)}
        />
      </label>
      <label className="login-label">
        Transporter GSTIN (optional)
        <input
          className="login-input"
          placeholder="32AABCT2045G1ZU"
          value={transporterGSTIN}
          onChange={(e) => setTransporterGSTIN(e.target.value)}
          maxLength={15}
        />
      </label>

      <div className="modal-note">
        From GSTIN, From address, and To address are filled from the active company + this invoice's party.
        Validity is calculated as ⌈distance ÷ 200 km⌉ days (NIC rule), minimum 1 day.
      </div>

      {err ? <div className="page-state-error" style={{ marginTop: 8 }}>{err}</div> : null}

      <div className="modal-actions">
        <button type="button" className="btn-primary" disabled={busy} onClick={submit}>
          {busy ? <><span className="spinner" aria-hidden="true" />Generating…</> : 'Generate e-Way Bill'}
        </button>
        <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
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

  // 24h NIC window from generation. We display the remaining time so the
  // operator knows whether they're at risk of timing out mid-form.
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
      <h3 className="modal-title">Cancel e-Way Bill</h3>
      <div className="modal-meta">Invoice: <strong>{invoice.invoiceNumber}</strong> · {invoice.partyName}</div>
      <div className="modal-meta mono">EWB: {ewb.ewbNumber} · Vehicle {ewb.vehicleNumber || '—'}</div>
      {expired ? (
        <div className="modal-warn">⛔ 24-hour cancel window has passed. The EWB can no longer be cancelled.</div>
      ) : (
        <div className="modal-warn">⚠ Time remaining: {hoursLeft.toFixed(1)} h</div>
      )}

      <div className="modal-field">
        <label>Cancel Reason:</label>
        {CANCEL_REASONS.map((r) => (
          <label key={r.code} className="modal-radio">
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

      <label className="login-label">
        Remarks (optional)
        <textarea
          className="login-input"
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={expired}
        />
      </label>

      <div className="modal-danger-note">
        ⚠ This action cannot be undone. After cancellation, the goods movement is no longer covered — a fresh EWB must be issued before the consignment leaves.
      </div>

      {err ? <div className="page-state-error" style={{ marginTop: 8 }}>{err}</div> : null}

      <div className="modal-actions">
        <button type="button" className="btn-danger" disabled={busy || expired} onClick={submit}>
          {busy ? <><span className="spinner" aria-hidden="true" />Cancelling…</> : 'Cancel e-Way Bill'}
        </button>
        <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>Close</button>
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
      <h3 className="modal-title">Update Vehicle</h3>
      <div className="modal-meta">Invoice: <strong>{invoice.invoiceNumber}</strong> · {invoice.partyName}</div>
      <div className="modal-meta mono">EWB: {ewb.ewbNumber}</div>
      <div className="modal-meta">Current vehicle: <strong className="mono">{ewb.vehicleNumber || '—'}</strong></div>
      {validity.expired ? (
        <div className="modal-warn">⛔ This e-Way Bill has expired. Vehicle can no longer be updated; issue a new EWB.</div>
      ) : (
        <div className="modal-warn">⚠ Valid until {new Date(ewb.validUntil).toLocaleString('en-IN')} · {validity.hoursLeft.toFixed(1)} h remaining</div>
      )}

      <label className="login-label">
        New vehicle number
        <input
          className="login-input"
          placeholder="KL07XY9999"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
          autoFocus
          maxLength={15}
          disabled={validity.expired}
        />
      </label>

      <div className="modal-note">
        Typical reasons: vehicle breakdown / transshipment / re-routing. The EWB itself stays the same (number, validity, parties) — only the vehicle assignment is rewritten.
      </div>

      {err ? <div className="page-state-error" style={{ marginTop: 8 }}>{err}</div> : null}

      <div className="modal-actions">
        <button type="button" className="btn-primary" disabled={busy || validity.expired} onClick={submit}>
          {busy ? <><span className="spinner" aria-hidden="true" />Updating…</> : 'Update Vehicle'}
        </button>
        <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>Close</button>
      </div>
    </Overlay>
  );
}
