import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestGstOtp, verifyGstOtp } from '../../../api';
import { apiError, type ApiError } from '../../../api';
import { GstnErrorPanel } from '../../';
import { useToast } from '../../';

const HANDLED_HERE: ApiError['action'][] = ['reauthenticate', 'retry', 'check_settings'];

export function GstOtpDialog({ onClose, onConnected }: { onClose: () => void; onConnected: () => void }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [txn, setTxn] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<ApiError | null>(null);

  const request = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await requestGstOtp();
      setTxn(r.txn);
      toast.show('OTP sent to the GST-registered mobile & email.', 'info');
    } catch (e) { setErr(apiError(e)); } finally { setBusy(false); }
  };

  const verify = async () => {
    if (!txn) return;
    if (!otp.trim()) { setErr(apiError(new Error('Enter the OTP.'))); return; }
    setBusy(true); setErr(null);
    try {
      await verifyGstOtp(txn, otp.trim());
      toast.show('GSTN connected.', 'success');
      onConnected();
    } catch (e) {
      const parsed = apiError(e);
      setErr(parsed);

      if (parsed.code === 'AUTH4033') setTxn(null);
    } finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Connect to GSTN (OTP)</h3>
        <div className="modal-note">
          The GST returns API requires an OTP. Click <strong>Request OTP</strong> — the GST portal sends a
          code to the taxpayer's registered mobile &amp; email. Enter it below; the session lasts ~6 hours.
        </div>

        {!txn ? (
          <div className="modal-actions">
            <button type="button" className="btn-primary" disabled={busy} onClick={request}>
              {busy ? 'Requesting…' : 'Request OTP'}
            </button>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          </div>
        ) : (
          <>
            <label className="login-label">
              Enter OTP
              <input className="login-input" value={otp} inputMode="numeric" autoFocus
                onChange={(e) => setOtp(e.target.value)} />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" disabled={busy} onClick={request}>Resend</button>
              <button type="button" className="btn-primary" disabled={busy} onClick={verify}>
                {busy ? 'Verifying…' : 'Verify & Connect'}
              </button>
              <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
            </div>
          </>
        )}
        {err ? (
          <GstnErrorPanel
            error={err}
            // Only pass a handler for the steps this dialog can actually take —
            // the panel renders text instead of a dead button otherwise.
            onAction={
              HANDLED_HERE.includes(err.action)
                ? (action) => {
                    if (action === 'check_settings') { onClose(); navigate('/settings'); return; }
                    setTxn(null); setErr(null); // reauthenticate / retry: start a fresh OTP round
                  }
                : undefined
            }
          />
        ) : null}
      </div>
    </div>
  );
}
