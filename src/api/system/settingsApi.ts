import { apiClient } from '../core/client';
import type {
  CompanyInfo,
  DocTypeDiscoveryResponse,
  DocumentMapping,
  ErpProfile,
  KnownTablesResponse,
  SmtpConfigCommand,
  SmtpStatus,
  SpProfile,
  TenantSettings,
  WhiteBooksConfigCommand,
  WhiteBooksGstConfigCommand,
  WhiteBooksGstStatus,
  WhiteBooksSandboxInfo,
  WhiteBooksStatus,
} from '../../types/api';

export async function fetchTenantSettings(): Promise<TenantSettings> {
  const { data } = await apiClient.get<TenantSettings>('/settings');
  return data;
}

export async function updateTenantSettings(dto: TenantSettings): Promise<TenantSettings> {
  const { data } = await apiClient.put<TenantSettings>('/settings', dto);
  return data;
}

export async function uploadLogo(file: File): Promise<TenantSettings> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<TenantSettings>('/settings/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function removeLogo(): Promise<TenantSettings> {
  const { data } = await apiClient.delete<TenantSettings>('/settings/logo');
  return data;
}

export async function fetchCompany(): Promise<CompanyInfo> {
  const { data } = await apiClient.get<CompanyInfo>('/company');
  return data;
}

export async function fetchErpProfile(): Promise<ErpProfile> {
  const { data } = await apiClient.get<ErpProfile>('/settings/erp-profile');
  return data;
}

export async function updateErpProfile(dto: ErpProfile): Promise<ErpProfile> {
  const { data } = await apiClient.put<ErpProfile>('/settings/erp-profile', dto);
  return data;
}

export async function fetchSpProfile(): Promise<SpProfile> {
  const { data } = await apiClient.get<SpProfile>('/settings/sp-profile');
  return data;
}

export async function updateSpProfile(dto: SpProfile): Promise<SpProfile> {
  const { data } = await apiClient.put<SpProfile>('/settings/sp-profile', dto);
  return data;
}

export type SpDiagnosticStatus = 'NotConfigured' | 'Green' | 'Amber' | 'Red';

export interface SpDirectionDiagnostics {
  spName: string | null;
  configured: boolean;
  tested: boolean;
  ok: boolean;
  invoiceCount: number;
  periodCount: number;
  error: string | null;
  status: SpDiagnosticStatus;
}

export interface SpDiagnostics {
  tenantName: string | null;
  outward: SpDirectionDiagnostics;
  inward: SpDirectionDiagnostics;
}

export async function fetchSpDiagnostics(): Promise<SpDiagnostics> {
  const { data } = await apiClient.get<SpDiagnostics>('/diagnostics/sp-profile');
  return data;
}

export async function fetchDocumentMappings(): Promise<DocumentMapping[]> {
  const { data } = await apiClient.get<DocumentMapping[]>('/settings/document-mappings');
  return data;
}

export async function updateDocumentMappings(mappings: DocumentMapping[]): Promise<DocumentMapping[]> {
  const { data } = await apiClient.put<DocumentMapping[]>('/settings/document-mappings', { mappings });
  return data;
}

export async function discoverDocTypes(headerTable?: string): Promise<DocTypeDiscoveryResponse> {

  const { data } = await apiClient.get<DocTypeDiscoveryResponse>('/settings/discover-doctypes', {
    params: headerTable ? { headerTable } : undefined,
  });
  return data;
}

export async function fetchKnownLineTables(): Promise<KnownTablesResponse> {
  const { data } = await apiClient.get<KnownTablesResponse>('/settings/known-line-tables');
  return data;
}

export async function fetchWhiteBooks(): Promise<WhiteBooksStatus> {
  const { data } = await apiClient.get<WhiteBooksStatus>('/settings/whitebooks');
  return data;
}

export async function saveWhiteBooks(cmd: WhiteBooksConfigCommand): Promise<WhiteBooksStatus> {
  const { data } = await apiClient.post<WhiteBooksStatus>('/settings/whitebooks', cmd);
  return data;
}

export async function disableWhiteBooks(): Promise<void> {
  await apiClient.delete('/settings/whitebooks');
}

export async function fetchWhiteBooksSandboxInfo(): Promise<WhiteBooksSandboxInfo> {
  const { data } = await apiClient.get<WhiteBooksSandboxInfo>('/settings/whitebooks/sandbox');
  return data;
}

export async function testWhiteBooksSandbox(): Promise<void> {
  await apiClient.post('/settings/whitebooks/sandbox/test');
}

export async function setWhiteBooksEnvironment(useSandbox: boolean): Promise<WhiteBooksStatus> {
  const { data } = await apiClient.put<WhiteBooksStatus>('/settings/whitebooks/environment', { useSandbox });
  return data;
}

export async function fetchGstApi(): Promise<WhiteBooksGstStatus> {
  const { data } = await apiClient.get<WhiteBooksGstStatus>('/settings/gst-api');
  return data;
}

export async function saveGstApi(cmd: WhiteBooksGstConfigCommand): Promise<WhiteBooksGstStatus> {
  const { data } = await apiClient.post<WhiteBooksGstStatus>('/settings/gst-api', cmd);
  return data;
}

export async function disableGstApi(): Promise<void> {
  await apiClient.delete('/settings/gst-api');
}

export async function fetchEmailSettings(): Promise<SmtpStatus> {
  const { data } = await apiClient.get<SmtpStatus>('/settings/email');
  return data;
}

export async function saveEmailSettings(cmd: SmtpConfigCommand): Promise<SmtpStatus> {
  const { data } = await apiClient.post<SmtpStatus>('/settings/email', cmd);
  return data;
}

export async function sendTestEmail(cmd: SmtpConfigCommand): Promise<{ sentTo: string }> {
  const { data } = await apiClient.post<{ sentTo: string }>('/settings/email/test', cmd);
  return data;
}

export async function fetchInvoicePdf(billId: number): Promise<Blob> {
  const res = await apiClient.get(`/invoice/${billId}/pdf`, { responseType: 'blob' });
  return res.data as Blob;
}

export function openInvoicePdfInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  if (!win) {
    console.warn('[GSTAutoPilot] Pop-up blocked. URL kept alive for 60s:', url);
  }
}
