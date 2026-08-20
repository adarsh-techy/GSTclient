import { apiClient } from '../core/client';
import type { Filing, FilingDetail, FilingType, GstnSubmitResponse, MarkFiledCommand } from '../../types/api';

function typeNumeric(t: FilingType): number {
  return t === 'Gstr1' ? 1 : 2;
}

export interface ValidationIssue {
  severity: 'Error' | 'Warning';
  code: string;
  message: string;
  invoiceNo?: string;
  section?: string;
}

export interface ReturnValidationResult {
  period: string;
  returnType: string;
  invoicesChecked: number;
  errorCount: number;
  warningCount: number;
  canFile: boolean;
  issues: ValidationIssue[];
  issuesTruncated: boolean;
}

export async function validateGstr1(period: string): Promise<ReturnValidationResult> {
  const { data } = await apiClient.get<ReturnValidationResult>(`/filings/gstr1/${period}/validate`);
  return data;
}

export interface NilCheckResult {
  period: string;
  type: FilingType;
  isNil: boolean;
  invoiceCount: number;
  taxableValue: number;
  tax: number;
  reason: string;
}

export async function nilCheck(period: string, type: FilingType): Promise<NilCheckResult> {
  const path = type === 'Gstr1' ? 'gstr1' : 'gstr3b';
  const { data } = await apiClient.get<NilCheckResult>(`/filings/${path}/${period}/nil-check`);
  return data;
}

export async function lockGstr1(period: string, confirmNil = false): Promise<Filing> {
  const { data } = await apiClient.post<Filing>(`/filings/gstr1/${period}/lock`, null, {
    params: confirmNil ? { confirmNil: true } : undefined,
  });
  return data;
}

export async function lockGstr3b(period: string, confirmNil = false): Promise<Filing> {
  const { data } = await apiClient.post<Filing>(`/filings/gstr3b/${period}/lock`, null, {
    params: confirmNil ? { confirmNil: true } : undefined,
  });
  return data;
}

export async function markFiled(filingId: string, cmd: MarkFiledCommand): Promise<Filing> {
  const { data } = await apiClient.post<Filing>(`/filings/${filingId}/file`, cmd);
  return data;
}

export async function submitToGstn(filingId: string): Promise<GstnSubmitResponse> {
  const { data } = await apiClient.post<GstnSubmitResponse>(`/filings/${filingId}/gstn/submit`);
  return data;
}

export async function fileWithEvc(
  filingId: string,
  otp: string,
  opts: { cin?: string } = {},
): Promise<Filing> {
  const { data } = await apiClient.post<Filing>(`/filings/${filingId}/gstn/file`, {
    otp,
    cin: opts.cin,
  });
  return data;
}

export async function listFilings(params: { period?: string; type?: FilingType } = {}): Promise<Filing[]> {
  const query: Record<string, string | number> = {};
  if (params.period) query.period = params.period;
  if (params.type) query.type = typeNumeric(params.type);
  const { data } = await apiClient.get<Filing[]>('/filings', { params: query });
  return data;
}

export async function getFiling(filingId: string): Promise<FilingDetail> {
  const { data } = await apiClient.get<FilingDetail>(`/filings/${filingId}`);
  return data;
}

export async function latestFiling(period: string, type: FilingType): Promise<Filing | null> {
  try {
    const { data } = await apiClient.get<Filing>('/filings/latest', {
      params: { period, type: typeNumeric(type) },
    });
    return data;
  } catch (err) {
    if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
    throw err;
  }
}
