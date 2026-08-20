import { apiClient } from '../core/client';
import type { FilingType } from '../../types/api';

export interface BulkCandidate {
  billId: number;
  invoiceNumber: string;
  invoiceDate: string;
  partyName: string;
  partyGSTIN: string;
  invoiceValue: number;
  partyEmail?: string | null;
  blockedReason?: string | null;
}

export interface BulkCandidates {
  operation: string;
  period: string;
  ready: BulkCandidate[];
  blocked: BulkCandidate[];
  rateLimitMax: number;
  rateLimitPeriodSeconds: number;
  rateLimitRemaining: number;
}

export interface PendingReturn {
  type: FilingType;
  period: string;
  status?: string | null;
  filingId?: string | null;
  ackNo?: string | null;
  needsAction: boolean;
  nextStep: 'lock' | 'submit' | 'file' | 'done';
}

export interface PendingReturns {
  period: string;
  returns: PendingReturn[];
  hasGstnSession: boolean;
  gstnConfigured: boolean;
}

export async function pendingIrn(period: string): Promise<BulkCandidates> {
  const { data } = await apiClient.get<BulkCandidates>(`/bulk/pending-irn/${period}`);
  return data;
}

export async function pendingEmail(period: string): Promise<BulkCandidates> {
  const { data } = await apiClient.get<BulkCandidates>(`/bulk/pending-email/${period}`);
  return data;
}

export async function pendingReturns(period: string): Promise<PendingReturns> {
  const { data } = await apiClient.get<PendingReturns>(`/bulk/pending-returns/${period}`);
  return data;
}
