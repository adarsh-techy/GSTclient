import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pendingReturns, type PendingReturn } from '../../../api';
import { GstOtpDialog } from '../../';
import { FilingControl } from '../../';
import type { FilingType } from '../../../types/api';

export function FileAllReturnsWizard({ period, onClose }: { period: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [showOtp, setShowOtp] = useState(false);

  const query = useQuery({
    queryKey: ['pending-returns', period],
    queryFn: () => pendingReturns(period),
    enabled: !!period,
  });

  const data = query.data;
  const outstanding = (data?.returns ?? []).filter((r) => r.needsAction);
  const ordered = [...outstanding].sort((a) => (a.type === 'Gstr1' ? -1 : 1));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[95vw] sm:max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <polyline points="9 15 11 17 15 13" />
              </svg>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
                File Pending Returns
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                Period: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{period}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            aria-label="Close"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {query.isLoading ? (
            <div className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400 py-4">
              <span className="spinner w-4 h-4 border-2" />
              <span>Checking outstanding returns…</span>
            </div>
          ) : null}

          {data ? (
            <>
              
              {!data.gstnConfigured ? (
                <div className="flex gap-3 p-4 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[13px] font-bold text-red-700 dark:text-red-400">GST API is not configured</span>
                    <span className="text-[12px] text-red-600 dark:text-red-300/80 leading-relaxed">
                      Add the GST-returns credentials in <strong>Settings → GST API</strong> before filing through the portal.
                    </span>
                  </div>
                </div>
              ) : !data.hasGstnSession ? (
                
                <div className="flex gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <span className="text-[13px] font-bold text-amber-700 dark:text-amber-400">No GSTN Session</span>
                    <span className="text-[12px] text-amber-700 dark:text-amber-300/80 leading-relaxed">
                      One OTP session covers both returns. Connect once, then work down the list.
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowOtp(true)}
                      className="self-start mt-0.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11.5px] font-bold transition-all cursor-pointer shadow-sm"
                    >
                      Connect to GSTN (OTP)
                    </button>
                  </div>
                </div>
              ) : (
                
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-950/30 text-[12px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  GSTN session active — both returns below can be filed without another OTP.
                </div>
              )}

              {ordered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-slate-500 dark:text-slate-400">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="text-[13px] font-medium">Nothing outstanding — both returns for {period} are filed.</span>
                </div>
              ) : (
                <ol className="flex flex-col gap-4">
                  {ordered.map((r, i) => (
                    <li key={r.type} className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-800/40 overflow-hidden">
                      
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-800/60">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                          {i + 1}
                        </span>
                        <span className="text-[13.5px] font-bold text-slate-800 dark:text-white">{label(r.type)}</span>
                        <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${stepBadgeClass(r)}`}>
                          {stepLabel(r)}
                        </span>
                      </div>
                      
                      <div className="px-4 py-3">
                        <FilingControl type={r.type} period={period} />
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {filedAlready(data.returns).length > 0 ? (
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Already filed:</span>{' '}
                  {filedAlready(data.returns).map((r) => `${label(r.type)}${r.ackNo ? ` (${r.ackNo})` : ''}`).join(', ')}.
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[12.5px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

        {showOtp ? (
          <GstOtpDialog
            onClose={() => setShowOtp(false)}
            onConnected={() => {
              setShowOtp(false);
              qc.invalidateQueries({ queryKey: ['gst-session'] });
              void query.refetch();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function filedAlready(returns: PendingReturn[]): PendingReturn[] {
  return returns.filter((r) => !r.needsAction);
}

function label(t: FilingType): string {
  return t === 'Gstr1' ? 'GSTR-1' : 'GSTR-3B';
}

function stepLabel(r: PendingReturn): string {
  switch (r.nextStep) {
    case 'lock': return 'Not Started';
    case 'submit': return r.status === 'SaveFailed' ? 'Save Rejected — Retry' : 'Locked · Ready to Submit';
    case 'file': return 'Submitted · Awaiting EVC';
    default: return 'Done';
  }
}

function stepBadgeClass(r: PendingReturn): string {
  switch (r.nextStep) {
    case 'lock': return 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600';
    case 'submit': return r.status === 'SaveFailed'
      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700';
    case 'file': return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700';
    default: return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700';
  }
}
