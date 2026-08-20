import { apiClient } from '../core/client';
import type { CarolErpPeriod } from '../../types/api';

export async function fetchCarolErpPeriods(): Promise<CarolErpPeriod[]> {
  const { data } = await apiClient.get<CarolErpPeriod[]>('/carolerp/periods');
  return data;
}
