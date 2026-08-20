import { apiClient } from '../core/client';
import type { CompanySummary } from '../../types/api';

export async function fetchCompanies(): Promise<CompanySummary[]> {
  const { data } = await apiClient.get<CompanySummary[]>('/companies');
  return data;
}
