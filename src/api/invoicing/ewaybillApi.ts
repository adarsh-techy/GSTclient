import { apiClient } from '../core/client';
import type { EWayBillResponse, GenerateEWayBillRequest } from '../../types/api';

export async function generateEWayBillForBill(
  billId: number,
  body: GenerateEWayBillRequest,
): Promise<EWayBillResponse> {
  const { data } = await apiClient.post<EWayBillResponse>(`/ewaybill/generate/bill/${billId}`, body);
  return data;
}

export async function listEWayBills(): Promise<EWayBillResponse[]> {
  const { data } = await apiClient.get<EWayBillResponse[]>('/ewaybill/list');
  return data;
}

export async function cancelEWayBill(ewbId: string, reason: string): Promise<EWayBillResponse> {
  const { data } = await apiClient.post<EWayBillResponse>(`/ewaybill/cancel/${ewbId}`, { reason });
  return data;
}

export async function updateEWayBillVehicle(ewbId: string, vehicleNumber: string): Promise<EWayBillResponse> {
  const { data } = await apiClient.post<EWayBillResponse>(`/ewaybill/update-vehicle/${ewbId}`, { vehicleNumber });
  return data;
}
