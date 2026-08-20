import { apiClient } from '../core/client';
import type { BillOfEntry, SaveBillOfEntryCommand } from '../../types/api';

export async function listBillsOfEntry(period: string): Promise<BillOfEntry[]> {
  const { data } = await apiClient.get<BillOfEntry[]>('/bill-of-entry', { params: { period } });
  return data;
}

export async function createBillOfEntry(cmd: SaveBillOfEntryCommand): Promise<BillOfEntry> {
  const { data } = await apiClient.post<BillOfEntry>('/bill-of-entry', cmd);
  return data;
}

export async function updateBillOfEntry(boeId: number, cmd: SaveBillOfEntryCommand): Promise<BillOfEntry> {
  const { data } = await apiClient.put<BillOfEntry>(`/bill-of-entry/${boeId}`, cmd);
  return data;
}

export async function deleteBillOfEntry(boeId: number): Promise<void> {
  await apiClient.delete(`/bill-of-entry/${boeId}`);
}
