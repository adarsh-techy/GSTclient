import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCompanies } from '../../../api';
import { getActiveCompanyId, setActiveCompanyId } from '../../../api';

export function CompanySelector() {
  const qc = useQueryClient();
  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: 60_000,
    retry: false,
  });

  const [active, setActive] = useState<number | null>(getActiveCompanyId());

  useEffect(() => {
    const onChange = () => setActive(getActiveCompanyId());
    window.addEventListener('gstautopilot:company-changed', onChange);
    return () => window.removeEventListener('gstautopilot:company-changed', onChange);
  }, []);

  const change = (value: string) => {
    const next = value === 'all' ? null : Number(value);
    setActiveCompanyId(next);
    setActive(next);
    
    qc.invalidateQueries();
  };

  const companies = companiesQuery.data ?? [];
  
  if (companies.length <= 1) {
    const only = companies[0];
    return only ? (
      <div
        className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 px-3 py-2 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl truncate border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
        title={`${only.coName} · ${only.gstNo ?? 'no GST'}`}
      >
        <span className="text-slate-400">🏢</span>
        <span className="truncate">{only.coName}</span>
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-0.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Organization Filter
        </label>
        <span className="text-[9.5px] font-medium text-slate-400 dark:text-slate-500">
          {companies.length} entities
        </span>
      </div>
      <div className="relative flex items-center">
        <span className="absolute left-2.5 text-slate-400 pointer-events-none">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="9" y1="6" x2="9" y2="6.01" />
            <line x1="15" y1="6" x2="15" y2="6.01" />
            <line x1="9" y1="10" x2="9" y2="10.01" />
            <line x1="15" y1="10" x2="15" y2="10.01" />
            <line x1="9" y1="14" x2="9" y2="14.01" />
            <line x1="15" y1="14" x2="15" y2="14.01" />
            <line x1="9" y1="18" x2="15" y2="18" />
          </svg>
        </span>
        <select
          className="w-full text-xs font-semibold pl-8 pr-7 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/90 bg-slate-50/70 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 outline-none cursor-pointer focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 shadow-2xs appearance-none transition-all"
          value={active ?? 'all'}
          onChange={(e) => change(e.target.value)}
        >
          <option value="all">All Companies ({companies.reduce((a, c) => a + c.billCount, 0).toLocaleString('en-IN')})</option>
          {companies.map((c) => (
            <option key={c.coId} value={c.coId}>
              {c.coName} ({c.billCount.toLocaleString('en-IN')})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}
