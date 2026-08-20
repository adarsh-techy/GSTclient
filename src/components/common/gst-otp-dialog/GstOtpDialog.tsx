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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div className="w-full max-w-[95vw] sm:max-w-md p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            🔗
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Connect to GSTN (OTP)</h3>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Authenticate session with GST portal</p>
          </div>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
          The GST returns API requires an OTP. Click <strong>Request OTP</strong> — the GST portal sends a
          code to the taxpayer's registered mobile &amp; email. Enter it below; the session lasts ~6 hours.
        </div>

        {!txn ? (
          <div className="flex items-center justify-end gap-2.5 pt-2 flex-wrap">
            <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="button" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs" disabled={busy} onClick={request}>
              {busy ? <><span className="spinner w-3.5 h-3.5" aria-hidden="true" />Requesting…</> : 'Request OTP'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Enter 6-Digit OTP</span>
              <input
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 font-mono text-center tracking-widest text-base font-bold"
                value={otp}
                inputMode="numeric"
                autoFocus
                placeholder="123456"
                maxLength={6}
                onChange={(e) => setOtp(e.target.value)}
              />
            </label>
            <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
              <button type="button" className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer" disabled={busy} onClick={request}>Resend</button>
              <button type="button" className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="button" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs" disabled={busy} onClick={verify}>
                {busy ? <><span className="spinner w-3.5 h-3.5" aria-hidden="true" />Verifying…</> : 'Verify & Connect'}
              </button>
            </div>
          </div>
        )}

        {err ? (
          <div className="mt-3">
            <GstnErrorPanel
              error={err}
              onAction={
                HANDLED_HERE.includes(err.action)
                  ? (action) => {
                      if (action === 'check_settings') { onClose(); navigate('/settings'); return; }
                      setTxn(null); setErr(null);
                    }
                  : undefined
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
