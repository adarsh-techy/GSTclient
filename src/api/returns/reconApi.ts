import { apiClient } from '../core/client';
import type { ReconReportResponse, ReconRunResponse } from '../../types/api';

export async function fetchReconResults(period: string): Promise<ReconReportResponse> {
  const { data } = await apiClient.get<ReconReportResponse>(`/recon/results/${period}`);
  return data;
}

export async function runRecon(period: string): Promise<ReconRunResponse> {
  const { data } = await apiClient.post<ReconRunResponse>(`/recon/run/${period}`);
  return data;
}
