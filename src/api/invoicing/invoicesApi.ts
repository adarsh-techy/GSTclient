import { apiClient } from '../core/client';
import type { Gstr1B2csRow, Gstr1SummaryRow, Gstr1TablesResponse, InvoiceResponse } from '../../types/api';

export async function fetchInvoices(period: string): Promise<InvoiceResponse[]> {
  const { data } = await apiClient.get<InvoiceResponse[]>('/invoice', { params: { period } });
  return data;
}

export async function fetchGstr1(period: string): Promise<Gstr1SummaryRow[]> {
  const { data } = await apiClient.get<Gstr1SummaryRow[]>('/invoice/gstr1', { params: { period } });
  return data;
}

export async function fetchGstr1Tables(period: string): Promise<Gstr1TablesResponse> {
  const { data } = await apiClient.get<Gstr1TablesResponse>('/invoice/gstr1/tables', { params: { period } });
  return data;
}

export async function fetchB2cs(period: string): Promise<Gstr1B2csRow[]> {
  const { data } = await apiClient.get<Gstr1B2csRow[]>('/invoice/gstr1/b2cs', { params: { period } });
  return data;
}
