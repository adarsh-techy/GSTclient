import { apiClient } from '../core/client';
import type { Gstr2bResponse } from '../../types/api';

export async function getGstr2b(period: string): Promise<Gstr2bResponse> {
  const { data } = await apiClient.get<Gstr2bResponse>(`/gstr2b/${period}`);
  return data;
}

export async function fetchGstr2b(period: string): Promise<Gstr2bResponse> {
  const { data } = await apiClient.get<Gstr2bResponse>(`/gstr2b/fetch/${period}`);
  return data;
}
