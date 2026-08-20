import { Link } from 'react-router-dom';
import { useIrnList } from '../../../hooks/useGstSummary';

export function IrnDeadlineBanner() {
  const { data } = useIrnList();
  const approaching = (data ?? []).filter((i) => {
    if (i.lifecycleStatus !== 'Cancellable') return false;
    const remaining = 24 - i.ageHours;
    return remaining > 0 && remaining < 2;
  });
  if (approaching.length === 0) return null;
  return (
    <div className="flex items-center justify-between p-3.5 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold">
      <span className="flex items-center gap-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        {approaching.length} e-Invoice(s) approaching the 24-hour cancellation deadline!
      </span>
      <Link to="/einvoice-history" className="text-xs px-2.5 py-1 rounded-lg border border-amber-500/30 hover:bg-amber-500/20 transition-all font-bold">Review Now →</Link>
    </div>
  );
}
