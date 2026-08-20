

export type GstnErrorAction =
  | 'none'
  | 'reauthenticate'
  | 'check_settings'
  | 'check_period'
  | 'file_nil'
  | 'show_arn'
  | 'fix_invoices'
  | 'retry';

export interface GstnErrorDetail {
  code?: string | null;
  message?: string | null;
  invoiceNumber?: string | null;
  ctin?: string | null;
}

export interface ApiError {
  
  message: string;
  
  code?: string;
  
  action: GstnErrorAction;
  
  retryable: boolean;
  
  details: GstnErrorDetail[];
  
  reference?: string;
  
  isGstn: boolean;
  httpStatus?: number;

  portalMessage?: string;
  
  operation?: string;
}

interface RawResponse {
  response?: {
    status?: number;
    data?: {
      error?: string;
      code?: string;
      message?: string;
      action?: string;
      retryable?: boolean;
      details?: GstnErrorDetail[];
      reference?: string;
      portalMessage?: string;
      operation?: string;
    };
  };
}

export function apiError(err: unknown): ApiError {
  const res = (err as RawResponse)?.response;
  const raw = res?.data as unknown;
  const httpStatus = res?.status;

  if (typeof raw === 'string' && raw.trim()) {
    return {
      message: raw.trim(), action: 'none', retryable: false, details: [], isGstn: false, httpStatus,
    };
  }
  const data = (raw && typeof raw === 'object' ? raw : undefined) as NonNullable<RawResponse['response']>['data'];

  if (data?.error === 'GSTN_ERROR') {
    return {
      message: data.message || 'The GST portal rejected the request.',
      code: data.code ?? undefined,
      action: (data.action as GstnErrorAction) ?? 'none',
      retryable: data.retryable ?? false,
      details: data.details ?? [],
      reference: data.reference ?? undefined,
      isGstn: true,
      httpStatus,
      portalMessage: data.portalMessage ?? undefined,
      operation: data.operation ?? undefined,
    };
  }

  const serverText = data?.message || data?.error;
  if (!serverText) {
    const transport = describeTransportFailure(httpStatus);
    if (transport) {
      return {
        message: transport.message,
        action: transport.retryable ? 'retry' : 'none',
        retryable: transport.retryable,
        details: [], isGstn: false, httpStatus,
      };
    }
  }

  const message = serverText || (err as Error)?.message || 'Something went wrong.';
  return {
    message,
    code: data?.code ?? (typeof data?.error === 'string' && data.error !== message ? data.error : undefined),
    action: 'none',
    retryable: false,
    details: data?.details ?? [],
    isGstn: false,
    httpStatus,
  };
}

function describeTransportFailure(status?: number): { message: string; retryable: boolean } | null {
  if (status === undefined) {
    return {
      message: 'Could not reach the server. Check that GSTAutoPilot is running and that you are on the network.',
      retryable: true,
    };
  }
  switch (status) {
    case 502:
    case 503:
    case 504:
      return {
        message: `The server did not respond (HTTP ${status}). It may be restarting or unreachable — try again in a moment.`,
        retryable: true,
      };
    case 500:
      return { message: 'The server hit an internal error (HTTP 500). The details are in the server log.', retryable: false };
    case 401:
    case 403:
      return { message: 'Your session is no longer valid. Sign in again.', retryable: false };
    case 404:
      return { message: 'That was not found on the server (HTTP 404).', retryable: false };
    default:
      return null;
  }
}

export function apiErrorMessage(err: unknown): string {
  return apiError(err).message;
}

export function buildErrorReport(err: unknown, context?: { what?: string; where?: string }): string {
  const e = apiError(err);
  const lines: string[] = [
    'GSTAutoPilot error report',
    `Time:      ${new Date().toISOString()}`,
  ];
  if (context?.what) lines.push(`Action:    ${context.what}`);
  lines.push(`Page:      ${context?.where ?? window.location.pathname}`);
  if (e.httpStatus) lines.push(`HTTP:      ${e.httpStatus}`);
  if (e.isGstn) lines.push('Source:    GST portal (GSTN / WhiteBooks)');
  if (e.operation) lines.push(`Operation: ${e.operation}`);
  if (e.code) lines.push(`Code:      ${e.code}`);
  lines.push(`Message:   ${e.message}`);
  if (e.portalMessage && e.portalMessage !== e.message) lines.push(`Portal:    ${e.portalMessage}`);
  if (e.reference) lines.push(`Reference: ${e.reference}   <- quote this; it matches the server log`);

  if (e.details.length) {
    lines.push('', `Validation rows (${e.details.length}):`);
    for (const d of e.details.slice(0, 100)) {
      const bits = [d.code, d.ctin, d.invoiceNumber, d.message].filter(Boolean);
      lines.push(`  - ${bits.join(' | ')}`);
    }
    if (e.details.length > 100) lines.push(`  … and ${e.details.length - 100} more`);
  }
  return lines.join('\n');
}

export const SUPPORT_EMAIL: string | undefined =
  (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || undefined;

export function supportMailto(report: string, subject: string): string {
  return `mailto:${SUPPORT_EMAIL ?? ''}`
    + `?subject=${encodeURIComponent(subject)}`
    + `&body=${encodeURIComponent(report)}`;
}

export function actionLabel(action: GstnErrorAction): string | null {
  switch (action) {
    case 'reauthenticate': return 'Reconnect to GSTN';
    case 'check_settings': return 'Open GST API settings';
    case 'check_period': return 'Choose another period';
    case 'file_nil': return 'File a NIL return instead';
    case 'show_arn': return 'View the filed return';
    case 'fix_invoices': return 'Review the invoices';
    case 'retry': return 'Try again';
    default: return null;
  }
}
