import { formatPeriod } from '../../../hooks/usePeriod';
import type { CarolErpPeriod } from '../../../types/api';

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: CarolErpPeriod[];
}

export function PeriodSelector({ value, onChange, options }: Props) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 max-w-full">
      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0" htmlFor="period-select">
        Period
      </label>
      <div className="relative min-w-0 max-w-full">
        <select
          id="period-select"
          className="text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer focus:border-blue-600 dark:focus:border-blue-500 shadow-2xs max-w-[200px] sm:max-w-[280px] md:max-w-none truncate"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={options.length === 0}
        >
          {options.length === 0 ? (
            <option value={value}>{formatPeriod(value)}</option>
          ) : (
            options.map((p) => (
              <option key={p.period} value={p.period}>
                {formatPeriod(p.period)} — {p.salesCount} sales · {p.purchaseCount} purch.
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
}
