import { useState } from 'react';
import { apiError, buildErrorReport, SUPPORT_EMAIL, supportMailto } from '../../../api';

export function PageLoading({
  label,
  paused = false,
}: {
  label: string;
  
  paused?: boolean;
}) {
  if (!paused) return <div className="page-state p-6 rounded-xl bg-surface border border-border text-center text-sm text-slate-500">{label}</div>;
  return (
    <div className="page-state page-error p-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
      <div className="page-error-head font-bold text-base mb-2"><strong>Waiting for the server</strong></div>
      <p className="page-error-msg text-xs leading-relaxed mb-4">
        The request to the server has not completed and is not being retried — the server is
        usually unreachable or restarting. Nothing was loaded, so this is not an empty result.
      </p>
      <div className="page-error-actions flex items-center gap-3">
        <button type="button" className="btn-primary px-4 py-2 rounded-lg bg-[var(--custom-theme,var(--primary))] text-white text-xs font-semibold hover:opacity-90 transition-all cursor-pointer" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </div>
    </div>
  );
}

export function PageError({
  error,
  what,
  onRetry,
}: {
  error: unknown;
  what?: string;
  onRetry?: () => void;
}) {
  const e = apiError(error);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const report = buildErrorReport(error, { what });
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      window.prompt('Copy this error report:', report);
    }
  };

  return (
    <div className="page-state page-state-error page-error p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200">
      <div className="page-error-head flex items-center justify-between font-bold text-base mb-2">
        <strong>{what ? `Could not load ${what}` : 'Something went wrong'}</strong>
        {e.code ? <span className="v-badge px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-mono">{e.code}</span> : null}
      </div>
      <p className="page-error-msg text-xs leading-relaxed mb-4">{e.message}</p>

      {e.details.length > 0 ? (
        <ul className="filing-validation-list flex flex-col gap-1.5 mb-4 text-xs">
          {e.details.slice(0, 20).map((d, i) => (
            <li key={i} className="v-error flex items-center gap-2 p-2 rounded bg-rose-500/15 border border-rose-500/20">
              <span className="v-badge font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-200 text-rose-800">{d.code ?? 'GSTN'}</span>
              {d.invoiceNumber ? <span className="v-inv font-semibold">{d.invoiceNumber}</span> : null}
              <span className="v-msg">{d.message}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="page-error-actions flex items-center gap-3">
        {onRetry ? <button type="button" className="btn-primary px-3.5 py-1.5 rounded-lg bg-[var(--custom-theme,var(--primary))] text-white text-xs font-semibold hover:opacity-90 transition-all cursor-pointer" onClick={onRetry}>Try again</button> : null}
        <button type="button" className="btn-ghost px-3.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium hover:bg-surface-2 transition-all cursor-pointer" onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy error report'}
        </button>
        {SUPPORT_EMAIL ? (
          <a className="btn-ghost px-3.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium hover:bg-surface-2 transition-all" href={supportMailto(buildErrorReport(error, { what }), `GSTAutoPilot error${e.code ? ` ${e.code}` : ''}`)}>
            Email support
          </a>
        ) : null}
      </div>

      {e.reference ? <div className="filing-status-sub text-[11px] text-slate-500 mt-3">Support reference: <code className="font-mono bg-surface-2 px-1 py-0.5 rounded">{e.reference}</code></div> : null}
    </div>
  );
}
