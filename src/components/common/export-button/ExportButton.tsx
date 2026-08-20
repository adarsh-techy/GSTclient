import { useState } from 'react';
import { downloadExport, type ExportKind } from '../../../api';
import { apiErrorMessage } from '../../../api';
import { useToast } from '../../';

interface Props {
  kind: ExportKind;
  period: string;
  label?: string;
  section?: string;
}

export function ExportButton({ kind, period, label = 'Download Excel', section }: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    if (busy || !period) return;
    setBusy(true);
    try {
      await downloadExport(kind, period, section);
    } catch (err) {
      toast.show(`Export failed: ${apiErrorMessage(err)}`, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-slate-700 dark:text-slate-200 bg-surface hover:bg-surface-2 transition-all cursor-pointer disabled:opacity-50"
      onClick={handle}
      disabled={busy || !period}
    >
      {busy ? (
        <><span className="spinner w-3 h-3" aria-hidden="true" />Exporting…</>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
