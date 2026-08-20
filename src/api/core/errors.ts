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
    data?: unknown;
  };
}

function extractMessageString(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') return raw.trim() || undefined;
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message.trim();
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error.trim();
    if (typeof obj.detail === 'string' && obj.detail.trim()) return obj.detail.trim();
    if (typeof obj.title === 'string' && obj.title.trim()) {
      return typeof obj.detail === 'string' ? `${obj.title}: ${obj.detail}` : obj.title;
    }
    if (obj.error && typeof obj.error === 'object') {
      const nested = extractMessageString(obj.error);
      if (nested) return nested;
    }
    if (obj.errors && typeof obj.errors === 'object') {
      const errList = Object.values(obj.errors as Record<string, unknown>).flat();
      const first = errList.find((item) => typeof item === 'string' && item.trim());
      if (typeof first === 'string') return first.trim();
    }
  }
  return undefined;
}

function describeTransportFailure(status?: number): { message: string; retryable: boolean } | null {
  if (status === undefined) {
    return {
      message: 'Could not reach the server. Check that your connection is active and backend is running.',
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
      return { message: 'The server hit an internal error (HTTP 500). Please check backend logs.', retryable: false };
    case 401:
    case 403:
      return { message: 'Your session is no longer valid. Sign in again.', retryable: false };
    case 404:
      return { message: 'The requested resource or endpoint was not found on the server (HTTP 404).', retryable: false };
    default:
      return null;
  }
}

export function apiError(err: unknown): ApiError {
  const res = (err as RawResponse)?.response;
  const raw = res?.data;
  const httpStatus = res?.status;

  if (typeof raw === 'string' && raw.trim()) {
    return {
      message: raw.trim(),
      action: 'none',
      retryable: false,
      details: [],
      isGstn: false,
      httpStatus,
    };
  }

  const data = (raw && typeof raw === 'object' ? raw : undefined) as Record<string, any> | undefined;

  if (data?.error === 'GSTN_ERROR' || data?.code === 'GSTN_ERROR') {
    return {
      message: extractMessageString(data) || 'The GST portal rejected the request.',
      code: typeof data.code === 'string' ? data.code : undefined,
      action: (data.action as GstnErrorAction) ?? 'none',
      retryable: data.retryable ?? false,
      details: Array.isArray(data.details) ? data.details : [],
      reference: typeof data.reference === 'string' ? data.reference : undefined,
      isGstn: true,
      httpStatus,
      portalMessage: typeof data.portalMessage === 'string' ? data.portalMessage : undefined,
      operation: typeof data.operation === 'string' ? data.operation : undefined,
    };
  }

  const serverText = extractMessageString(data);
  if (!serverText) {
    const transport = describeTransportFailure(httpStatus);
    if (transport) {
      return {
        message: transport.message,
        action: transport.retryable ? 'retry' : 'none',
        retryable: transport.retryable,
        details: [],
        isGstn: false,
        httpStatus,
      };
    }
  }

  const fallbackMsg = (err as Error)?.message;
  const message = serverText || (typeof fallbackMsg === 'string' ? fallbackMsg : 'Something went wrong.');
  const codeStr = typeof data?.code === 'string' ? data.code : (typeof data?.error === 'string' && data.error !== message ? data.error : undefined);

  return {
    message,
    code: codeStr,
    action: 'none',
    retryable: false,
    details: Array.isArray(data?.details) ? data.details : [],
    isGstn: false,
    httpStatus,
  };
}

export function apiErrorMessage(err: unknown): string {
  const msg = apiError(err).message;
  return typeof msg === 'string' ? msg : 'An unexpected error occurred.';
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
