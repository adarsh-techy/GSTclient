import React from 'react';

type Accent = 'output' | 'itc' | 'payable' | 'recon' | 'irn' | 'neutral';

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
  accent?: Accent;
}

const ACCENT_BORDER_CLASSES: Record<Accent, string> = {
  output: 'border-t-[3.5px] border-t-blue-600',
  itc: 'border-t-[3.5px] border-t-emerald-600',
  payable: 'border-t-[3.5px] border-t-purple-600',
  recon: 'border-t-[3.5px] border-t-teal-600',
  irn: 'border-t-[3.5px] border-t-sky-600',
  neutral: 'border-t-[3.5px] border-t-slate-400',
};

export function KpiCard({ label, value, hint, icon, accent = 'neutral' }: KpiCardProps) {
  return (
    <div className={`relative flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all ${ACCENT_BORDER_CLASSES[accent]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        {icon ? <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{icon}</span> : null}
      </div>
      <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 my-2 tracking-tight">{value}</div>
      {hint ? <div className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400">{hint}</div> : null}
    </div>
  );
}
