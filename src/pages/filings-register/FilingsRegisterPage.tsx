import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listFilings, markFiled } from '../../api';
import { GstnJsonButton } from '../../components';
import { FileAllReturnsWizard } from '../../components';
import { apiErrorMessage } from '../../api';
import { PageError, PageLoading } from '../../components';
import { useToast } from '../../components';
import { useAuth } from '../../auth/AuthContext';
import { formatPeriod, usePeriod } from '../../hooks/usePeriod';
import type { Filing, FilingStatus, FilingType } from '../../types/api';

type TypeFilter = 'all' | FilingType;
type StatusFilter = 'all' | FilingStatus;

function financialYear(d: Date): { startYear: number; label: string } {
  const startYear = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return { startYear, label: `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}` };
}

function FilingTypeBadge({ type }: { type: FilingType }) {
  const isGstr1 = type === 'Gstr1';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
        isGstr1
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
          : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      }`}
    >
      {isGstr1 ? 'GSTR-1' : 'GSTR-3B'}
    </span>
  );
}

function FilingStatusBadge({ status }: { status: FilingStatus }) {
  const styles: Record<FilingStatus, { bg: string; text: string; border: string; label: string }> = {
    Filed: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-800',
      label: 'Filed ✓',
    },
    Submitted: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-800',
      label: 'Submitted',
    },
    Locked: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-800',
      label: 'Locked',
    },
    SaveFailed: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-300 dark:border-rose-800',
      label: 'Save Rejected',
    },
  };

  const s = styles[status] || styles.Locked;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
}

function FilingsKpiCard({
  label,
  value,
  subtitle,
  icon,
  accent = 'cyan',
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: 'cyan' | 'blue' | 'indigo' | 'emerald' | 'purple' | 'amber' | 'rose';
}) {
  const accentStyles = {
    cyan: {
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/60 text-[#00b4d8]',
      valColor: 'text-slate-900 dark:text-white',
      borderHover: 'hover:border-cyan-300 dark:hover:border-cyan-700',
    },
    blue: {
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      valColor: 'text-slate-900 dark:text-white',
      borderHover: 'hover:border-blue-300 dark:hover:border-blue-700',
    },
    indigo: {
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
      valColor: 'text-indigo-600 dark:text-indigo-400',
      borderHover: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    },
    emerald: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      valColor: 'text-emerald-600 dark:text-emerald-400',
      borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    },
    purple: {
      iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
      valColor: 'text-purple-600 dark:text-purple-400',
      borderHover: 'hover:border-purple-300 dark:hover:border-purple-700',
    },
    amber: {
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      valColor: 'text-amber-600 dark:text-amber-400',
      borderHover: 'hover:border-amber-300 dark:hover:border-amber-700',
    },
    rose: {
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
      valColor: 'text-rose-600 dark:text-rose-400',
      borderHover: 'hover:border-rose-300 dark:hover:border-rose-700',
    },
  }[accent];

  return (
    <div
      className={`p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between gap-2.5 transition-all duration-200 hover:shadow-md ${accentStyles.borderHover}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${accentStyles.iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className={`text-xl sm:text-2xl font-black tracking-tight font-mono truncate ${accentStyles.valColor}`}>
          {value}
        </div>
        {subtitle && (
          <div className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export function Filings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const qc = useQueryClient();
  const toast = useToast();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ackBy, setAckBy] = useState<Record<string, string>>({});
  const { period } = usePeriod();
  const [wizardOpen, setWizardOpen] = useState(false);

  const filingsQuery = useQuery({
    queryKey: ['filings'],
    queryFn: () => listFilings({}),
  });

  const fileMutation = useMutation({
    mutationFn: ({ filingId, ackNo }: { filingId: string; ackNo: string }) =>
      markFiled(filingId, { ackNo }),
    onSuccess: (data) => {
      toast.show(`Marked return filed (Ack ${data.ackNo})`, 'success');
      setAckBy((m) => ({ ...m, [data.filingId]: '' }));
      qc.invalidateQueries({ queryKey: ['filings'] });
      qc.invalidateQueries({ queryKey: ['filing-latest'] });
    },
    onError: (err) => toast.show(`Mark filed failed: ${apiErrorMessage(err)}`, 'error'),
  });

  const all = useMemo(() => filingsQuery.data ?? [], [filingsQuery.data]);

  const stats = useMemo(() => {
    const now = new Date();
    const fy = financialYear(now);
    const inFy = (iso: string | null) => {
      if (!iso) return false;
      const d = new Date(iso);
      return d >= new Date(fy.startYear, 3, 1) && d < new Date(fy.startYear + 1, 3, 1);
    };
    const inThisMonth = (iso: string | null) => {
      if (!iso) return false;
      const d = new Date(iso);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    };
    return {
      fyLabel: fy.label,
      filedFy: all.filter((f) => f.status === 'Filed' && inFy(f.filedOn)).length,
      filedMonth: all.filter((f) => f.status === 'Filed' && inThisMonth(f.filedOn)).length,
      awaiting: all.filter((f) => f.status === 'Locked' || f.status === 'Submitted').length,
      rejected: all.filter((f) => f.status === 'SaveFailed').length,
    };
  }, [all]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((f) => {
      const matchType = typeFilter === 'all' || f.type === typeFilter;
      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      if (!matchType || !matchStatus) return false;
      if (!q) return true;
      return (
        f.type.toLowerCase().includes(q) ||
        f.period.toLowerCase().includes(q) ||
        (f.ackNo ?? '').toLowerCase().includes(q) ||
        (f.filedBy ?? '').toLowerCase().includes(q) ||
        f.status.toLowerCase().includes(q)
      );
    });
  }, [all, typeFilter, statusFilter, search]);

  const handleCopyArn = (arn: string, id: string) => {
    navigator.clipboard.writeText(arn);
    setCopiedId(id);
    toast.show(`Copied ARN ${arn}`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Tax Filings Audit Log
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Official locked, submitted &amp; filed GSTR-1 and GSTR-3B return snapshots and ARN acknowledgement records
          </p>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] text-white font-bold text-xs shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
              title="Walk through GSTR-1 then GSTR-3B for one period on a single OTP session"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>File Pending Returns · {formatPeriod(period)}</span>
            </button>
          </div>
        ) : null}
      </header>

      {wizardOpen ? (
        <FileAllReturnsWizard
          period={period}
          onClose={() => {
            setWizardOpen(false);
            void filingsQuery.refetch();
          }}
        />
      ) : null}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <FilingsKpiCard
          label={`Filed · FY ${stats.fyLabel}`}
          value={stats.filedFy}
          subtitle="Returns filed this fiscal year"
          accent="emerald"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />

        <FilingsKpiCard
          label="Filed This Month"
          value={stats.filedMonth}
          subtitle="Current calendar month"
          accent="cyan"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />

        <FilingsKpiCard
          label="Awaiting Filing"
          value={stats.awaiting}
          subtitle="Locked / submitted pending OTP"
          accent="amber"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <FilingsKpiCard
          label="Save Rejected"
          value={stats.rejected}
          subtitle="GSTN rejected — fix & resubmit"
          accent="rose"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </section>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        
        <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md flex-1">
          <input
            type="text"
            placeholder="Search return type, period, ARN / Ack #, filed by…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium pl-8 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#00b4d8] shadow-2xs transition-all"
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Type:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-[#00b4d8] cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Gstr1">GSTR-1</option>
              <option value="Gstr3b">GSTR-3B</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-[#00b4d8] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Filed">Filed</option>
              <option value="Submitted">Submitted</option>
              <option value="Locked">Locked</option>
              <option value="SaveFailed">Save Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {filingsQuery.isError ? (
        <PageError error={filingsQuery.error} what="filings" onRetry={() => void filingsQuery.refetch()} />
      ) : filingsQuery.isPending ? (
        <PageLoading label="Loading Filings Audit Log…" paused={filingsQuery.fetchStatus === 'paused'} />
      ) : (
        <div className="flex flex-col gap-2">
          
          <div className="flex items-center justify-end px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="text-slate-900 dark:text-white font-bold mx-1">{filtered.length}</span> of {all.length} filings
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm">
            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Return Type</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Tax Period</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Filing Status</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">ARN / Ack Number</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Filed On</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Filed By</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Locked On</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filtered.map((f: Filing) => {
                    const kind = f.type === 'Gstr1' ? 'gstr1' : 'gstr3b';
                    const isCopied = copiedId === f.filingId;
                    const ack = ackBy[f.filingId] ?? '';

                    return (
                      <tr key={f.filingId} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap font-bold">
                          <FilingTypeBadge type={f.type} />
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {formatPeriod(f.period)}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                          <FilingStatusBadge status={f.status} />
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {f.ackNo ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold">{f.ackNo}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyArn(f.ackNo!, f.filingId)}
                                className="text-slate-400 hover:text-[#00b4d8] transition-colors p-0.5 cursor-pointer"
                                title="Copy ARN / Ack Number"
                              >
                                {isCopied ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {f.filedOn ? new Date(f.filedOn).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                          {f.filedBy || '—'}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {new Date(f.createdOn).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <GstnJsonButton kind={kind} period={f.period} />

                            {f.status === 'Locked' && isAdmin && (
                              <div className="inline-flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="ARN / Ack No"
                                  value={ack}
                                  onChange={(e) =>
                                    setAckBy((m) => ({ ...m, [f.filingId]: e.target.value }))
                                  }
                                  className="w-28 text-[11px] font-mono px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-[#00b4d8]"
                                />
                                <button
                                  type="button"
                                  disabled={!ack.trim() || fileMutation.isPending}
                                  onClick={() =>
                                    fileMutation.mutate({
                                      filingId: f.filingId,
                                      ackNo: ack.trim(),
                                    })
                                  }
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                  Mark Filed
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="sticky bottom-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
                    <td colSpan={8} className="py-3 px-3.5 uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200">
                      TOTAL COMPLIANCE LOG ENTRIES: {filtered.length} OF {all.length}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { Filings as FilingsRegisterPage, Filings as default };
