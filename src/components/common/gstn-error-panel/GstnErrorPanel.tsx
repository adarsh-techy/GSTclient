import { useState } from 'react';
import { actionLabel, buildErrorReport, SUPPORT_EMAIL, supportMailto, type ApiError } from '../../../api';

export function GstnErrorPanel({
  error,
  onAction,
  compact = false,
  what,
}: {
  error: ApiError;

  onAction?: (action: ApiError['action']) => void;
  compact?: boolean;
  
  what?: string;
}) {
  const label = actionLabel(error.action);
  const showDetails = error.details.length > 0;
  const [copied, setCopied] = useState(false);

  const report = () => buildErrorReport(error, { what });
  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {

      window.prompt('Copy this error report:', report());
    }
  };

  return (
    <div className="filing-validation has-errors" style={{ marginTop: 8 }}>
      <div className="filing-error-head">
        <strong>{error.message}</strong>
        {error.code ? <span className="v-badge" style={{ marginLeft: 8 }}>{error.code}</span> : null}
      </div>

      {showDetails && !compact ? (
        <ul className="filing-validation-list">
          {error.details.map((d, i) => (
            <li key={i} className="v-error">
              <span className="v-badge">{d.code ?? 'GSTN'}</span>
              {d.invoiceNumber ? <span className="v-inv">{d.invoiceNumber}</span> : null}
              {d.ctin && !d.invoiceNumber ? <span className="v-inv">{d.ctin}</span> : null}
              <span className="v-msg">{d.message ?? '(no description given)'}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {showDetails && compact ? (
        <div className="filing-status-sub" style={{ marginTop: 6 }}>
          {error.details.length} validation error{error.details.length === 1 ? '' : 's'} from GSTN.
        </div>
      ) : null}

      <div className="filing-validation-actions">
        {label && !onAction ? (
          <span className="filing-status-sub" style={{ marginRight: 'auto' }}>
            Next step: {label.toLowerCase()}.
          </span>
        ) : null}

        <button type="button" className="btn-ghost" onClick={copyReport}
          title="Copies the code, the portal's own message and the support reference">
          {copied ? 'Copied ✓' : 'Copy error report'}
        </button>

        {SUPPORT_EMAIL ? (
          <a className="btn-ghost" href={supportMailto(report(), `GSTAutoPilot error${error.code ? ` ${error.code}` : ''}`)}>
            Email support
          </a>
        ) : null}

        {label && onAction ? (
          <button type="button" className="btn-primary" onClick={() => onAction(error.action)}>
            {label}
          </button>
        ) : null}
      </div>

      {error.reference ? (
        <div className="filing-status-sub" style={{ marginTop: 6 }}>
          Support reference: <code>{error.reference}</code>
        </div>
      ) : null}
    </div>
  );
}
