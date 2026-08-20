import { useState } from 'react';
import { downloadGstnJson } from '../../../api';
import { apiErrorMessage } from '../../../api';
import { useToast } from '../../';

interface Props {
  kind: 'gstr1' | 'gstr3b';
  period: string;
}

export function GstnJsonButton({ kind, period }: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    if (busy || !period) return;
    setBusy(true);
    try {
      await downloadGstnJson(kind, period);
    } catch (err) {
      toast.show(`GSTN JSON failed: ${apiErrorMessage(err)}`, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" className="btn-ghost" onClick={handle} disabled={busy || !period}
      title="Download portal-uploadable GSTN JSON">
      {busy ? <><span className="spinner" aria-hidden="true" />Building…</> : <>🧾 GSTN JSON</>}
    </button>
  );
}
