import { formatPeriod } from '../../../hooks/usePeriod';
import type { CarolErpPeriod } from '../../../types/api';

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: CarolErpPeriod[];
}

export function PeriodSelector({ value, onChange, options }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="period-select">
        Period
      </label>
      <select
        id="period-select"
        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border bg-surface text-[var(--text)] outline-none cursor-pointer focus:border-blue-600 dark:focus:border-blue-500"
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
  );
}
