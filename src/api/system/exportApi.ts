import { apiClient } from '../core/client';

export type ExportKind = 'gstr1' | 'gstr3b' | 'invoices' | 'recon';

const FALLBACK_FILE_NAMES: Record<ExportKind, string> = {
  gstr1: 'GSTR1.xlsx',
  gstr3b: 'GSTR3B.xlsx',
  invoices: 'Invoices.xlsx',
  recon: 'Recon.xlsx',
};

export async function downloadGstnJson(kind: 'gstr1' | 'gstr3b', period: string): Promise<void> {
  const res = await apiClient.get(`/filings/${kind}/${period}/json`, { responseType: 'blob' });
  const disposition = (res.headers['content-disposition'] ?? '') as string;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fileName = match ? decodeURIComponent(match[1]) : `${kind.toUpperCase()}_${period}.json`;
  const blob = new Blob([res.data as BlobPart], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

export async function downloadExport(kind: ExportKind, period: string, section?: string): Promise<void> {
  const res = await apiClient.get(`/export/${kind}/${period}`, {
    responseType: 'blob',
    params: section ? { section } : undefined,
  });
  const disposition = (res.headers['content-disposition'] ?? '') as string;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fileName = match ? decodeURIComponent(match[1]) : FALLBACK_FILE_NAMES[kind].replace('.xlsx', `_${period}.xlsx`);
  const blob = new Blob([res.data as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}
