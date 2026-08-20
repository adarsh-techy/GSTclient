import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fileWithEvc, latestFiling, lockGstr1, lockGstr3b, markFiled, nilCheck, submitToGstn, validateGstr1,
  type NilCheckResult, type ReturnValidationResult,
} from '../../../api';
import { getGstSession } from '../../../api';
import { apiError, type ApiError, type GstnErrorDetail } from '../../../api';
import { GstnErrorPanel } from '../../';
import { GstOtpDialog } from '../../';
import { useToast } from '../../';
import { useAuth } from '../../../auth/AuthContext';
import type { Filing, FilingType, GstnSubmitResponse } from '../../../types/api';

interface Props {
  type: FilingType;
  period: string;
}

const HANDLED_HERE: ApiError['action'][] = [
  'reauthenticate', 'check_settings', 'fix_invoices', 'show_arn', 'retry', 'file_nil',
];

function isNilConfirmationRequired(err: unknown): boolean {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error
    === 'NIL_CONFIRMATION_REQUIRED';
}

export function FilingControl({ type, period }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [ackInput, setAckInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [cinInput, setCinInput] = useState('');
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  
  const [errorReport, setErrorReport] = useState<string | null>(null);
  
  const [validation, setValidation] = useState<ReturnValidationResult | null>(null);

  const [gstnError, setGstnError] = useState<ApiError | null>(null);
  
  const retryRef = useRef<(() => void) | null>(null);

  const [nilPrompt, setNilPrompt] = useState<NilCheckResult | null>(null);

  const fail = (label: string, err: unknown, retry?: () => void) => {
    const parsed = apiError(err);
    setGstnError(parsed);
    retryRef.current = retry ?? null;
    toast.show(`${label}: ${parsed.message}`, 'error');

    if (parsed.action === 'reauthenticate') setShowOtpDialog(true);
  };

  const handleGstnAction = (action: ApiError['action']) => {
    setGstnError(null);
    switch (action) {
      case 'reauthenticate': setShowOtpDialog(true); break;
      case 'check_settings': navigate('/settings'); break;
      case 'fix_invoices': navigate('/invoices'); break;
      case 'show_arn': navigate('/filings'); break;
      case 'retry': retryRef.current?.(); break;

      case 'file_nil': void openNilPrompt(); break;
      default: break;
    }
  };

  const query = useQuery({
    queryKey: ['filing-latest', type, period],
    queryFn: () => latestFiling(period, type),
    enabled: !!period,
  });
  const sessionQuery = useQuery({ queryKey: ['gst-session'], queryFn: getGstSession });

  const setFiling = (data: Filing) => {
    qc.setQueryData<Filing | null>(['filing-latest', type, period], data);
    qc.invalidateQueries({ queryKey: ['filings'] });
  };

  const lockMutation = useMutation({
    mutationFn: (confirmNil: boolean = false) =>
      (type === 'Gstr1' ? lockGstr1(period, confirmNil) : lockGstr3b(period, confirmNil)),
    onSuccess: (data, confirmNil) => {
      toast.show(
        confirmNil ? `NIL ${type} locked for ${period}` : `${type} locked for ${period}`,
        'success',
      );
      setValidation(null); setGstnError(null); setNilPrompt(null); setFiling(data);
    },
    onMutate: () => setGstnError(null),
    onError: (err) => {

      if (isNilConfirmationRequired(err)) { void openNilPrompt(); return; }
      fail('Lock failed', err, () => lockMutation.mutate(false));
    },
  });

  const openNilPrompt = async () => {
    try {
      setNilPrompt(await nilCheck(period, type));
    } catch (e) {
      fail('Could not check whether the period is empty', e);
    }
  };

  const validateMutation = useMutation({
    mutationFn: () => validateGstr1(period),
    onSuccess: (res) => {
      if (res.errorCount === 0 && res.warningCount === 0) {
        lockMutation.mutate(false);
      } else {
        setValidation(res);
      }
    },
    onMutate: () => setGstnError(null),
    onError: (err) => fail('Validation failed', err, () => validateMutation.mutate()),
  });

  const startGstr1Lock = () => { setValidation(null); setGstnError(null); validateMutation.mutate(); };

  const fileMutation = useMutation({
    mutationFn: (filingId: string) => markFiled(filingId, { ackNo: ackInput.trim() }),
    onSuccess: (data) => { toast.show(`Marked filed (Ack ${data.ackNo})`, 'success'); setAckInput(''); setFiling(data); },
    onMutate: () => setGstnError(null),
    onError: (err) => fail('Mark filed failed', err),
  });

  const submitMutation = useMutation({
    mutationFn: (filingId: string) => submitToGstn(filingId),
    onSuccess: (data: GstnSubmitResponse) => {
      setErrorReport(data.errorReportJson);
      toast.show(data.message, data.readyToFile ? 'success' : 'error');
      qc.invalidateQueries({ queryKey: ['filing-latest', type, period] });
      qc.invalidateQueries({ queryKey: ['filings'] });
    },
    onMutate: () => setGstnError(null),
    onError: (err, filingId) => fail('GSTN submit failed', err, () => submitMutation.mutate(filingId)),
  });

  const evcMutation = useMutation({
    mutationFn: (filingId: string) =>
      fileWithEvc(filingId, otpInput.trim(), { cin: cinInput.trim() || undefined }),
    onSuccess: (data) => {
      toast.show(`Filed on GSTN (ARN ${data.ackNo})`, 'success');
      setOtpInput(''); setCinInput(''); setErrorReport(null); setGstnError(null); setFiling(data);
    },
    onMutate: () => setGstnError(null),
    onError: (err, filingId) => fail('Filing failed', err, () => evcMutation.mutate(filingId)),
  });

  if (!period) return null;
  const filing = query.data ?? null;
  const configured = !!sessionQuery.data?.configured;
  const hasSession = !!sessionQuery.data?.hasSession;

  const needsConnect = configured && !hasSession;

  const onConnected = () => {
    setShowOtpDialog(false);
    qc.invalidateQueries({ queryKey: ['gst-session'] });
  };

  const connectButton = (label: string) => (
    <button type="button" className="btn-ghost" onClick={() => setShowOtpDialog(true)}
      title="The GST returns API needs an OTP session before it can be used">
      🔗 {label}
    </button>
  );

  return (
    <div className="filing-control">
      <FilingStatusBadge filing={filing} />

      {!filing && isAdmin ? (
        <button type="button" className="btn-primary"
          disabled={lockMutation.isPending || validateMutation.isPending}
          onClick={() => (type === 'Gstr1' ? startGstr1Lock() : lockMutation.mutate(false))}>
          {validateMutation.isPending
            ? <><span className="spinner" aria-hidden="true" />Validating…</>
            : lockMutation.isPending
              ? <><span className="spinner" aria-hidden="true" />Locking…</>
              : '🔒 Lock & File'}
        </button>
      ) : null}

      {filing && (filing.status === 'Locked' || filing.status === 'SaveFailed') && isAdmin ? (
        <>
          {hasSession ? (
            <button type="button" className="btn-primary" disabled={submitMutation.isPending}
              onClick={() => { setErrorReport(null); submitMutation.mutate(filing.filingId); }}
              title="Save the return to GSTN, then submit it — submitting LOCKS the data on the portal">
              {submitMutation.isPending
                ? <><span className="spinner" aria-hidden="true" />Submitting…</>
                : filing.status === 'SaveFailed' ? '↻ Retry submit to GSTN' : '📤 Submit to GSTN'}
            </button>
          ) : null}
          {needsConnect ? connectButton('Connect to GSTN') : null}
          <div className="filing-mark-row">
            <input type="text" className="login-input" placeholder="GSTN Ack/ARN (manual)" value={ackInput}
              onChange={(e) => setAckInput(e.target.value)} style={{ minWidth: 160 }} />
            <button type="button" className="btn-ghost" disabled={!ackInput.trim() || fileMutation.isPending}
              onClick={() => fileMutation.mutate(filing.filingId)}>
              {fileMutation.isPending ? 'Marking…' : '✓ Mark Filed'}
            </button>
          </div>
        </>
      ) : null}

      {filing && filing.status === 'Submitted' && isAdmin ? (
        <div className="filing-mark-row">
          <input type="text" className="login-input" placeholder="Filing OTP" value={otpInput}
            inputMode="numeric" onChange={(e) => setOtpInput(e.target.value)} style={{ minWidth: 130 }} />
          {type === 'Gstr3b' ? (
            <input type="text" className="login-input" placeholder="CIN (if paid by challan)" value={cinInput}
              onChange={(e) => setCinInput(e.target.value)} style={{ minWidth: 170 }} />
          ) : null}
          <button type="button" className="btn-primary" disabled={!otpInput.trim() || evcMutation.isPending}
            onClick={() => evcMutation.mutate(filing.filingId)}>
            {evcMutation.isPending ? 'Filing…' : '✓ File on GSTN'}
          </button>
          
          <button type="button" className="btn-ghost" disabled={submitMutation.isPending}
            onClick={() => submitMutation.mutate(filing.filingId)} title="Re-send the EVC OTP to the authorised signatory">
            {submitMutation.isPending ? 'Sending…' : '↻ Resend OTP'}
          </button>
        </div>
      ) : null}

      {validation ? (
        <ValidationPreview
          result={validation}
          locking={lockMutation.isPending}
          onLockAnyway={() => lockMutation.mutate(false)}
          onGoToInvoices={() => navigate('/invoices')}
          onDismiss={() => setValidation(null)}
        />
      ) : null}

      {gstnError ? (
        <GstnErrorPanel
          error={gstnError}
          onAction={HANDLED_HERE.includes(gstnError.action) ? handleGstnAction : undefined}
        />
      ) : null}

      {nilPrompt ? (
        <NilConfirmDialog
          check={nilPrompt}
          type={type}
          busy={lockMutation.isPending}
          onConfirm={() => lockMutation.mutate(true)}
          onCancel={() => setNilPrompt(null)}
        />
      ) : null}

      {errorReport ? <GstnErrorReport json={errorReport} onDismiss={() => setErrorReport(null)} /> : null}

      {showOtpDialog ? (
        <GstOtpDialog onClose={() => setShowOtpDialog(false)} onConnected={onConnected} />
      ) : null}
    </div>
  );
}

function NilConfirmDialog({
  check, type, busy, onConfirm, onCancel,
}: {
  check: NilCheckResult;
  type: FilingType;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const label = type === 'Gstr1' ? 'GSTR-1' : 'GSTR-3B';
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">File a NIL {label} for {check.period}?</h3>
        <div className="modal-note">{check.reason}</div>

        <ul className="filing-validation-list">
          <li><span className="v-badge">BOOKS</span><span className="v-msg">
            {check.invoiceCount} document{check.invoiceCount === 1 ? '' : 's'} found for this period
          </span></li>
          <li><span className="v-badge">TAXABLE</span><span className="v-msg">₹{check.taxableValue.toLocaleString('en-IN')}</span></li>
          <li><span className="v-badge">TAX</span><span className="v-msg">₹{check.tax.toLocaleString('en-IN')}</span></li>
        </ul>

        <p className="modal-note">
          A NIL return declares to GSTN that there were <strong>no outward supplies at all</strong> in
          this period. If the period only looks empty because data has not been imported yet, close
          this and check the books first — a filed return cannot be withdrawn.
        </p>

        <label className="login-label" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          I confirm {check.period} had no transactions and should be filed as NIL.
        </label>

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="btn-primary" disabled={!agreed || busy} onClick={onConfirm}>
            {busy ? <><span className="spinner" aria-hidden="true" />Locking…</> : `Lock NIL ${label}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ValidationPreview({
  result, locking, onLockAnyway, onGoToInvoices, onDismiss,
}: {
  result: ReturnValidationResult;
  locking: boolean;
  onLockAnyway: () => void;
  onGoToInvoices: () => void;
  onDismiss: () => void;
}) {
  const { errorCount, warningCount, issues, issuesTruncated, invoicesChecked } = result;
  const hasErrors = errorCount > 0;
  return (
    <div className={`filing-validation ${hasErrors ? 'has-errors' : 'warn-only'}`}>
      <div className="filing-error-head">
        <strong>
          {hasErrors ? '⚠ ' : '⚠ '}
          Pre-file check — {errorCount} error{errorCount === 1 ? '' : 's'}
          {warningCount > 0 ? `, ${warningCount} warning${warningCount === 1 ? '' : 's'}` : ''}
        </strong>
        <button type="button" className="btn-ghost" onClick={onDismiss}>Dismiss</button>
      </div>
      <p className="modal-note">
        {hasErrors
          ? `GSTN will reject these ${errorCount} invoice${errorCount === 1 ? '' : 's'} at save. Fix them in Invoices, or lock anyway to proceed at your own risk.`
          : `Checked ${invoicesChecked} invoices. These are advisory — you can proceed.`}
      </p>
      <ul className="filing-validation-list">
        {issues.map((iss, idx) => (
          <li key={`${iss.code}|${iss.invoiceNo}|${idx}`} className={iss.severity === 'Error' ? 'v-error' : 'v-warn'}>
            <span className="v-badge">{iss.severity === 'Error' ? 'ERROR' : 'WARN'}</span>
            {iss.invoiceNo ? <span className="v-inv mono">{iss.invoiceNo}</span> : null}
            <span className="v-msg">{stripInvoicePrefix(iss.message, iss.invoiceNo)}</span>
          </li>
        ))}
      </ul>
      {issuesTruncated ? (
        <p className="modal-note">Showing the first {issues.length}. Fix these and re-check for the rest.</p>
      ) : null}
      <div className="filing-validation-actions">
        <button type="button" className="btn-ghost" onClick={onGoToInvoices}>Go to Invoices</button>
        <button type="button" className={hasErrors ? 'btn-ghost' : 'btn-primary'} disabled={locking} onClick={onLockAnyway}>
          {locking ? <><span className="spinner" aria-hidden="true" />Locking…</> : hasErrors ? '🔒 Lock anyway' : '🔒 Lock & File'}
        </button>
      </div>
    </div>
  );
}

function stripInvoicePrefix(message: string, invoiceNo?: string): string {
  if (invoiceNo && message.startsWith(`Invoice ${invoiceNo}: `)) return message.slice(`Invoice ${invoiceNo}: `.length);
  return message;
}

function GstnErrorReport({ json, onDismiss }: { json: string; onDismiss: () => void }) {
  const [showRaw, setShowRaw] = useState(false);
  const rows = flattenGstnReport(json);
  let pretty = json;
  try { pretty = JSON.stringify(JSON.parse(json), null, 2); } catch {  }

  return (
    <div className="filing-error-report">
      <div className="filing-error-head">
        <strong>⚠ GSTN rejected {rows.length ? `${rows.length} row${rows.length === 1 ? '' : 's'}` : 'the save'}</strong>
        <button type="button" className="btn-ghost" onClick={onDismiss}>Dismiss</button>
      </div>
      <p className="modal-note">
        Nothing has been locked on the portal. Correct the flagged invoices, re-lock the return, and submit again.
      </p>

      {rows.length > 0 ? (
        <ul className="filing-validation-list">
          {rows.map((r, i) => (
            <li key={i} className="v-error">
              <span className="v-badge">{r.code ?? 'GSTN'}</span>
              {r.invoiceNumber ? <span className="v-inv mono">{r.invoiceNumber}</span> : null}
              {r.ctin && !r.invoiceNumber ? <span className="v-inv mono">{r.ctin}</span> : null}
              <span className="v-msg">{r.message ?? '(no description given)'}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="filing-validation-actions">
        <button type="button" className="btn-ghost" onClick={() => setShowRaw((v) => !v)}>
          {showRaw ? 'Hide raw response' : 'Show raw response'}
        </button>
      </div>
      {showRaw ? <pre className="filing-error-json">{pretty}</pre> : null}
    </div>
  );
}

function flattenGstnReport(json: string): GstnErrorDetail[] {
  const rows: GstnErrorDetail[] = [];
  const walk = (node: unknown, ctin?: string, inum?: string) => {
    if (rows.length >= 200 || node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach((n) => walk(n, ctin, inum)); return; }
    const o = node as Record<string, unknown>;
    const str = (...keys: string[]) => {
      for (const k of keys) if (typeof o[k] === 'string' && (o[k] as string).trim()) return o[k] as string;
      return undefined;
    };
    const thisCtin = str('ctin') ?? ctin;
    const thisInum = str('inum', 'ntnum', 'num', 'doc_num') ?? inum;
    const code = str('error_cd', 'errorCode', 'error_code', 'code');
    const message = str('error_msg', 'errorMessage', 'error_desc', 'message', 'desc');
    if (code || message) rows.push({ code, message, ctin: thisCtin, invoiceNumber: thisInum });
    for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v, thisCtin, thisInum);
  };
  try { walk(JSON.parse(json)); } catch {  }
  return rows;
}

function FilingStatusBadge({ filing }: { filing: Filing | null }) {
  if (!filing) return <span className="status-badge badge-orange">Draft</span>;
  if (filing.status === 'Filed') {
    return (
      <span className="status-badge badge-good" title={`Ack ${filing.ackNo}${filing.filedBy ? ` · filed by ${filing.filedBy}` : ''}`}>
        Filed · {filing.ackNo}
      </span>
    );
  }
  if (filing.status === 'Submitted') {
    return <span className="status-badge badge-amber" title={filing.referenceId ? `GSTN ref ${filing.referenceId}` : undefined}>
      Submitted · locked on GSTN
    </span>;
  }
  if (filing.status === 'SaveFailed') {
    return <span className="status-badge badge-orange">Save rejected by GSTN</span>;
  }
  return <span className="status-badge badge-amber">Locked · {new Date(filing.createdOn).toLocaleDateString('en-IN')}</span>;
}
