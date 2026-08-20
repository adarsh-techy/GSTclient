import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePeriod, formatPeriod } from '../../hooks/usePeriod';
import { PeriodSelector } from '../../components';
import { apiErrorMessage as apiError } from '../../api';
import { PageError, PageLoading } from '../../components';
import { useToast } from '../../components';
import {
  createBillOfEntry,
  deleteBillOfEntry,
  listBillsOfEntry,
  updateBillOfEntry,
} from '../../api';
import type { BillOfEntry as Boe, SaveBillOfEntryCommand } from '../../types/api';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

type FormState = {
  boENumber: string;
  boEDate: string;
  portCode: string;
  supplierName: string;
  supplierGSTIN: string;
  assessableValue: string;
  igstAmount: string;
  cessAmount: string;
  remarks: string;
};

function emptyForm(period: string): FormState {
  const y = period.slice(0, 4);
  const m = period.slice(4, 6);
  return {
    boENumber: '',
    boEDate: `${y}-${m}-01`,
    portCode: '',
    supplierName: '',
    supplierGSTIN: '',
    assessableValue: '',
    igstAmount: '',
    cessAmount: '',
    remarks: '',
  };
}

function BoeKpiCard({
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
  accent?: 'cyan' | 'blue' | 'indigo' | 'emerald' | 'purple' | 'amber';
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

export function BillOfEntry() {
  const { period, setPeriod, options } = usePeriod();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: ['bill-of-entry', period],
    queryFn: () => listBillsOfEntry(period),
    enabled: Boolean(period),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(period));
  const [showModal, setShowModal] = useState(false);

  const rows = useMemo(() => query.data ?? [], [query.data]);

  const totals = useMemo(() => {
    return {
      count: rows.length,
      assessable: rows.reduce((a, r) => a + r.assessableValue, 0),
      igst: rows.reduce((a, r) => a + r.igstAmount, 0),
      cess: rows.reduce((a, r) => a + r.cessAmount, 0),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (b) =>
        b.boENumber.toLowerCase().includes(q) ||
        (b.portCode ?? '').toLowerCase().includes(q) ||
        (b.supplierName ?? '').toLowerCase().includes(q) ||
        (b.supplierGSTIN ?? '').toLowerCase().includes(q) ||
        (b.remarks ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const filteredTotals = useMemo(() => {
    return {
      count: filtered.length,
      assessable: filtered.reduce((a, r) => a + r.assessableValue, 0),
      igst: filtered.reduce((a, r) => a + r.igstAmount, 0),
      cess: filtered.reduce((a, r) => a + r.cessAmount, 0),
    };
  }, [filtered]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['bill-of-entry', period] });
    qc.invalidateQueries({ queryKey: ['gstr3b'] });
    qc.invalidateQueries({ queryKey: ['gst-summary'] });
  };

  const saveMut = useMutation({
    mutationFn: (cmd: SaveBillOfEntryCommand) =>
      editingId ? updateBillOfEntry(editingId, cmd) : createBillOfEntry(cmd),
    onSuccess: () => {
      toast.show(editingId ? 'Bill of Entry updated.' : 'Bill of Entry added successfully.', 'success');
      resetForm();
      invalidate();
    },
    onError: (err) => toast.show(`Save failed: ${apiError(err)}`, 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteBillOfEntry(id),
    onSuccess: () => {
      toast.show('Bill of Entry deleted.', 'info');
      invalidate();
    },
    onError: (err) => toast.show(`Delete failed: ${apiError(err)}`, 'error'),
  });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm(period));
    setShowModal(false);
  };

  const startEdit = (b: Boe) => {
    setEditingId(b.boEId);
    setForm({
      boENumber: b.boENumber,
      boEDate: b.boEDate.slice(0, 10),
      portCode: b.portCode ?? '',
      supplierName: b.supplierName ?? '',
      supplierGSTIN: b.supplierGSTIN ?? '',
      assessableValue: String(b.assessableValue || ''),
      igstAmount: String(b.igstAmount || ''),
      cessAmount: String(b.cessAmount || ''),
      remarks: b.remarks ?? '',
    });
    setShowModal(true);
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.show(`Copied BoE ${text} to clipboard`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMut.mutate({
      period,
      boENumber: form.boENumber.trim(),
      boEDate: form.boEDate,
      portCode: form.portCode.trim() || null,
      supplierName: form.supplierName.trim() || null,
      supplierGSTIN: form.supplierGSTIN.trim() || null,
      assessableValue: Number(form.assessableValue || 0),
      igstAmount: Number(form.igstAmount || 0),
      cessAmount: Number(form.cessAmount || 0),
      remarks: form.remarks.trim() || null,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Bill of Entry (Imports)
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Customs IGST on overseas goods imports for <span className="font-bold text-slate-800 dark:text-slate-200">{formatPeriod(period)}</span>.
            Feeds GSTR-3B Table 4(A)(1) directly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm(period));
              setEditingId(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] text-white font-bold text-xs shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Bill of Entry</span>
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <BoeKpiCard
          label="Total Bills of Entry"
          value={totals.count}
          subtitle={`${new Set(rows.map((r) => r.supplierName).filter(Boolean)).size} overseas suppliers`}
          accent="blue"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />

        <BoeKpiCard
          label="Assessable Value"
          value={inr.format(totals.assessable)}
          subtitle="Net customs turnover base"
          accent="cyan"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <BoeKpiCard
          label="Import IGST Credit"
          value={inr.format(totals.igst)}
          subtitle="Feeds GSTR-3B Table 4(A)(1)"
          accent="indigo"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          }
        />

        <BoeKpiCard
          label="Customs Cess"
          value={inr.format(totals.cess)}
          subtitle="Compensation cess"
          accent="purple"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
        />
      </section>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        
        <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md flex-1">
          <input
            type="text"
            placeholder="Search BoE #, port code, supplier, GSTIN…"
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

        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} options={options} />
        </div>
      </div>

      {query.isError ? (
        <PageError error={query.error} what="Bills of Entry" onRetry={() => void query.refetch()} />
      ) : query.isPending ? (
        <PageLoading label="Loading Bills of Entry…" paused={query.fetchStatus === 'paused'} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#00b4d8] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Bills of Entry recorded for {formatPeriod(period)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Import invoices do not carry customs IGST automatically. Record Bill-of-Entry entries here to claim Import IGST ITC in GSTR-3B Table 4(A)(1).
          </p>
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm(period));
              setEditingId(null);
              setShowModal(true);
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-[#00b4d8] hover:bg-[#0096c7] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            + Add First Bill of Entry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Bills of Entry match the search query
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Clear the search keyword to view all {rows.length} records.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          
          <div className="flex items-center justify-end px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="text-slate-900 dark:text-white font-bold mx-1">{filtered.length}</span> of {rows.length} Bills of Entry
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-sm">
            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">BoE No</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Date</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Port</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Supplier (Overseas)</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Supplier GSTIN</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Assessable Value</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">IGST Amount</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap">Cess Amount</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filtered.map((b) => {
                    const isCopied = copiedId === b.boEId;

                    return (
                      <tr key={b.boEId} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{b.boENumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(b.boENumber, b.boEId)}
                              className="text-slate-400 hover:text-[#00b4d8] transition-colors p-0.5 cursor-pointer"
                              title="Copy BoE number"
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
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {b.boEDate.slice(0, 10)}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300">
                          {b.portCode || '—'}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                          {b.supplierName || '—'}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 font-mono text-slate-500 dark:text-slate-400">
                          {b.supplierGSTIN || <span className="text-slate-400 font-sans">— (Overseas)</span>}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-800 dark:text-slate-200">
                          {inr.format(b.assessableValue)}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {inr.format(b.igstAmount)}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-600 dark:text-slate-400">
                          {inr.format(b.cessAmount)}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(b)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all cursor-pointer"
                              title="Edit Bill of Entry"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              disabled={deleteMut.isPending}
                              onClick={() => {
                                if (window.confirm(`Delete Bill of Entry #${b.boENumber}?`)) {
                                  deleteMut.mutate(b.boEId);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer disabled:opacity-40"
                              title="Delete Bill of Entry"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="sticky bottom-0 z-20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
                    <td colSpan={5} className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200">
                      TOTAL ({filteredTotals.count} BOE RECORDS)
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono">
                      {inr.format(filteredTotals.assessable)}
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                      {inr.format(filteredTotals.igst)}
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right font-mono">
                      {inr.format(filteredTotals.cess)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {inr.format(filteredTotals.igst + filteredTotals.cess)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 mt-0.5 text-[#00b4d8]">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div className="flex flex-col gap-0.5">
          <span className="font-bold">GSTR-3B Table 4(A)(1) Synchronization:</span>
          <span>
            Import IGST recorded here is automatically fed into GSTR-3B Table 4(A)(1) (Import of Goods) as eligible Input Tax Credit for {formatPeriod(period)}.
          </span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-[95vw] sm:max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#00b4d8] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Bill of Entry' : 'Add Bill of Entry'}
                </h3>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    BoE Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7891234"
                    value={form.boENumber}
                    onChange={(e) => setForm({ ...form, boENumber: e.target.value })}
                    className="w-full text-xs font-mono font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    BoE Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.boEDate}
                    onChange={(e) => setForm({ ...form, boEDate: e.target.value })}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Port Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INNSA1"
                    value={form.portCode}
                    onChange={(e) => setForm({ ...form, portCode: e.target.value })}
                    className="w-full text-xs font-mono font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Overseas Supplier Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Global Exports Ltd"
                    value={form.supplierName}
                    onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Supplier GSTIN (SEZ/Bonded)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={form.supplierGSTIN}
                    onChange={(e) => setForm({ ...form, supplierGSTIN: e.target.value })}
                    className="w-full text-xs font-mono font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Assessable Value (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.assessableValue}
                    onChange={(e) => setForm({ ...form, assessableValue: e.target.value })}
                    className="w-full text-xs font-mono font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    IGST Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.igstAmount}
                    onChange={(e) => setForm({ ...form, igstAmount: e.target.value })}
                    className="w-full text-xs font-mono font-bold text-[#0096c7] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-[#00b4d8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Cess Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.cessAmount}
                    onChange={(e) => setForm({ ...form, cessAmount: e.target.value })}
                    className="w-full text-xs font-mono font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="Optional customs or shipment notes"
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#00b4d8]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMut.isPending}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {saveMut.isPending ? 'Saving…' : editingId ? 'Update Bill of Entry' : 'Save Bill of Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { BillOfEntry as BillOfEntryPage, BillOfEntry as default };
