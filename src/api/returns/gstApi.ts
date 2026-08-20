import { apiClient } from '../core/client';
import type { GstSummaryResponse, IRNResponse } from '../../types/api';

export async function fetchGstSummary(period: string): Promise<GstSummaryResponse> {
  const { data } = await apiClient.get<GstSummaryResponse>(`/gst/summary/${period}`);
  return data;
}

export async function fetchIrnList(): Promise<IRNResponse[]> {
  const { data } = await apiClient.get<IRNResponse[]>(`/einvoice/list`);
  return data;
}

export interface GstSessionStatus {
  configured: boolean;
  hasSession: boolean;
}

export async function getGstSession(): Promise<GstSessionStatus> {
  const { data } = await apiClient.get<GstSessionStatus>('/gst/session');
  return data;
}

export async function requestGstOtp(): Promise<{ txn: string }> {
  const { data } = await apiClient.post<{ txn: string }>('/gst/otp/request');
  return data;
}

export async function verifyGstOtp(txn: string, otp: string): Promise<void> {
  await apiClient.post('/gst/otp/verify', { txn, otp });
}
