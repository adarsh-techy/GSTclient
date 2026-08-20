import { apiClient } from '../core/client';

export interface TenantSummary {
  tenantId: string;
  name: string;
  gstin?: string;
  flavor?: string;
  isActive?: boolean;
}

export async function fetchTenants(): Promise<TenantSummary[]> {
  const { data } = await apiClient.get<TenantSummary[]>('/tenants');
  return data;
}

export async function fetchPublicTenants(): Promise<TenantSummary[]> {
  const { data } = await apiClient.get<TenantSummary[]>('/tenants/public');
  return data;
}

export interface CreateTenantRequest {
  name: string;
  gstin: string;
  appDbConnection: string;
  carolErpConnection: string;
  carolErpFlavor: string;
  
  outwardSP: string | null;
  inwardSP: string | null;
  
  salesHeaderTable: string;
  salesDocId: number | null;
  salesLineTable: string;
}

export interface CreateTenantResponse {
  tenantId: string;
}

export interface TestConnectionResult {
  ok: boolean;
  message: string;
}

export async function createTenant(req: CreateTenantRequest): Promise<CreateTenantResponse> {
  const { data } = await apiClient.post<CreateTenantResponse>('/tenants', req);
  return data;
}

export async function testTenantConnection(
  connectionString: string,
  kind: 'app' | 'carolerp',
): Promise<TestConnectionResult> {
  const { data } = await apiClient.post<TestConnectionResult>('/tenants/test-connection', {
    connectionString,
    kind,
  });
  return data;
}

export async function activateTenant(tenantId: string): Promise<void> {
  await apiClient.post(`/tenants/${tenantId}/activate`);
}
