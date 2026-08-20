import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pendingEmail, pendingIrn, type BulkCandidate, type BulkCandidates } from '../../../api';
import { emailEinvoiceJson, generateIrnForBill } from '../../../api';
import { useBulkRunner } from '../../../hooks/useBulkRunner';
import { useToast } from '../../';

type Op = 'irn' | 'email';

export function BulkActionsBar({ period }: { period: string }) {
  const toast = useToast();
  const [op, setOp] = useState<Op | null>(null);

  const irnQuery = useQuery({ queryKey: ['bulk-irn', period], queryFn: () => pendingIrn(period), enabled: !!period });
  const emailQuery = useQuery({ queryKey: ['bulk-email', period], queryFn: () => pendingEmail(period), enabled: !!period });

  const irnCount = irnQuery.data?.ready.length ?? 0;
  const emailCount = emailQuery.data?.ready.length ?? 0;
  const blocked = (irnQuery.data?.blocked.length ?? 0) + (emailQuery.data?.blocked.length ?? 0);

  return (
    <div className="bulk-bar flex flex-wrap items-center gap-3 p-3.5 mb-5 rounded-xl bg-blue-50/50 dark:bg-slate-900/40 border border-blue-200/60 dark:border-blue-900/40">
      <span className="bulk-bar-title text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">Bulk actions</span>

      <button type="button" className="btn-ghost text-xs px-3 py-1.5 rounded-lg border border-border bg-surface text-slate-700 dark:text-slate-200 hover:bg-surface-2 disabled:opacity-50 transition-all cursor-pointer font-medium" disabled={!irnCount} onClick={() => setOp('irn')}
        title={irnCount ? `${irnCount} invoice(s) need an IRN` : 'Nothing in this period needs an IRN'}>
        Generate all pending IRNs{irnCount ? ` (${irnCount})` : ''}
      </button>

      <button type="button" className="btn-ghost text-xs px-3 py-1.5 rounded-lg border border-border bg-surface text-slate-700 dark:text-slate-200 hover:bg-surface-2 disabled:opacity-50 transition-all cursor-pointer font-medium" disabled={!emailCount} onClick={() => setOp('email')}
        title={emailCount ? `${emailCount} e-Invoice(s) not yet emailed` : 'No e-Invoices are waiting to be emailed'}>
        Email all e-Invoices{emailCount ? ` (${emailCount})` : ''}
      </button>

      {blocked > 0 ? (
        <span className="bulk-bar-note text-xs text-amber-600 dark:text-amber-400 font-medium ml-auto" title="Listed in the dialog — these are not silently skipped">
          {blocked} cannot be processed
        </span>
      ) : null}

      {op ? (
        <BulkRunDialog
          op={op}
          data={(op === 'irn' ? irnQuery.data : emailQuery.data) ?? null}
          onClose={() => {
            setOp(null);
            void irnQuery.refetch();
            void emailQuery.refetch();
          }}
          onFinished={(ok, failed) =>
            toast.show(
              failed ? `Finished: ${ok} succeeded, ${failed} failed.` : `Finished: ${ok} succeeded.`,
              failed ? 'error' : 'success',
            )}
        />
      ) : null}
    </div>
  );
}

function BulkRunDialog({
  op, data, onClose, onFinished,
}: {
  op: Op;
  data: BulkCandidates | null;
  onClose: () => void;
  onFinished: (succeeded: number, failed: number) => void;
}) {
  const { state, run, cancel } = useBulkRunner<BulkCandidate>();
  const [confirmed, setConfirmed] = useState(false);
  const [started, setStarted] = useState(false);

  if (!data) return null;
  const ready = data.ready;
  const isIrn = op === 'irn';
  const title = isIrn ? 'Generate all pending IRNs' : 'Email all e-Invoices';

  const minutes = Math.ceil((ready.length / Math.max(1, data.rateLimitMax)) * (data.rateLimitPeriodSeconds / 60));

  const start = async () => {
    setStarted(true);
    await run(ready, async (c) => {
      if (isIrn) { await generateIrnForBill(c.billId); return; }
      await emailEinvoiceJson(c.billId, { toEmail: c.partyEmail ?? '' });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={state.running ? undefined : onClose}>
      <div className="w-full max-w-2xl p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">{title} — {data.period}</h3>

        {!started ? (
          <>
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              {isIrn ? (
                <>This registers <strong>{ready.length}</strong> invoice(s) with the NIC e-Invoice portal.
                  An IRN cannot be un-generated — it can only be cancelled on the portal within 24 hours
                  of generation.</>
              ) : (
                <>This sends the signed JSON and PDF to <strong>{ready.length}</strong> buyer(s) at the
                  addresses held in the ERP account master. Email cannot be recalled once sent.</>
              )}
            </div>
            <div className="text-xs text-slate-500 leading-relaxed mb-3">
              Paced at {data.rateLimitMax} per {formatPeriod(data.rateLimitPeriodSeconds)} —
              roughly {minutes} minute{minutes === 1 ? '' : 's'} for {ready.length} item(s).
              Keep this tab open; closing it stops the run.
            </div>

            {data.blocked.length > 0 ? (
              <>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">{data.blocked.length} will be left out:</p>
                <ul className="flex flex-col gap-1.5 mb-4 text-xs">
                  {data.blocked.slice(0, 50).map((c) => (
                    <li key={c.billId} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">SKIP</span>
                      <span className="font-semibold">{c.invoiceNumber}</span>
                      <span>{c.partyName} — {c.blockedReason}</span>
                    </li>
                  ))}
                </ul>
                {data.blocked.length > 50 ? (
                  <p className="text-xs text-slate-400">…and {data.blocked.length - 50} more.</p>
                ) : null}
              </>
            ) : null}

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 my-4 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600 cursor-pointer" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              {isIrn
                ? `I want to generate ${ready.length} IRN(s) on the live portal.`
                : `I want to email ${ready.length} buyer(s).`}
            </label>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
              <button type="button" className="px-4 py-2 rounded-lg border border-border bg-surface text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-surface-2 transition-all cursor-pointer" onClick={onClose}>Cancel</button>
              <button type="button" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50" disabled={!confirmed || !ready.length} onClick={start}>
                Start
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(state.completed / Math.max(1, state.total)) * 100}%` }} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-3">
              {state.completed} of {state.total} · {state.succeeded} succeeded
              {state.failed ? ` · ${state.failed} failed` : ''}
              {state.waitingSeconds
                ? ` · rate limit reached, resuming in ${state.waitingSeconds}s`
                : ''}
            </p>

            <ul className="flex flex-col gap-1.5 mb-4 text-xs max-h-60 overflow-y-auto">
              {state.results.map((r) => (
                <li key={r.item.billId} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${r.state === 'failed' ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300'}`}>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border">{r.state.toUpperCase()}</span>
                  <span className="font-semibold">{r.item.invoiceNumber}</span>
                  <span>
                    {r.item.partyName}
                    {r.message ? ` — ${r.message}` : ''}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
              {state.running ? (
                <button type="button" className="px-4 py-2 rounded-lg border border-border bg-surface text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-surface-2 transition-all cursor-pointer" onClick={cancel}>Stop</button>
              ) : (
                <button type="button" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all cursor-pointer"
                  onClick={() => { onFinished(state.succeeded, state.failed); onClose(); }}>
                  Close
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatPeriod(seconds: number): string {
  if (seconds >= 3600) return `${Math.round(seconds / 3600)} hour`;
  return `${Math.round(seconds / 60)} minute`;
}
