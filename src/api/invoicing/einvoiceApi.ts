import { apiClient } from '../core/client';
import type { IRNResponse } from '../../types/api';

export async function generateIrnForBill(billId: number): Promise<IRNResponse> {
  const { data } = await apiClient.post<IRNResponse>(`/einvoice/generate/bill/${billId}`);
  return data;
}

export async function getIrnForBill(billId: number): Promise<IRNResponse | null> {
  try {
    const { data } = await apiClient.get<IRNResponse>(`/einvoice/status/bill/${billId}`);
    return data;
  } catch (err) {
    if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
    throw err;
  }
}

export async function listIrns(): Promise<IRNResponse[]> {
  const { data } = await apiClient.get<IRNResponse[]>('/einvoice/list');
  return data;
}

export async function cancelIrn(irnId: string, reason: string, remarks: string): Promise<IRNResponse> {
  const { data } = await apiClient.post<IRNResponse>(`/einvoice/cancel/${irnId}`, { reason, remarks });
  return data;
}

export async function emailEinvoiceJson(
  billId: number,
  body: { toEmail: string; ccEmail?: string; remarks?: string },
): Promise<IRNResponse> {
  const { data } = await apiClient.post<IRNResponse>(`/einvoice/email-json/${billId}`, body);
  return data;
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

function safeName(s: string) {
  return (s || 'invoice').replace(/[^A-Za-z0-9]/g, '_');
}

export async function downloadEinvoiceJson(billId: number, invoiceNo: string): Promise<void> {
  const res = await apiClient.get(`/einvoice/download-json/${billId}`, { responseType: 'blob' });
  triggerBlobDownload(res.data as Blob, `${safeName(invoiceNo)}_einvoice.json`);
}

export async function downloadEinvoiceQr(billId: number, invoiceNo: string): Promise<void> {
  const res = await apiClient.get(`/einvoice/download-qr/${billId}`, { responseType: 'blob' });
  triggerBlobDownload(res.data as Blob, `${safeName(invoiceNo)}_qr.png`);
}
