import { apiClient } from '../core/client';
import type { Gstr3bResponse } from '../../types/api';

export async function fetchGstr3b(period: string): Promise<Gstr3bResponse> {
  const { data } = await apiClient.get<Gstr3bResponse>('/gstr3b', { params: { period } });
  return data;
}
