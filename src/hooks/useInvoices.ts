import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchB2cs, fetchGstr1, fetchGstr1Tables, fetchInvoices } from '../api';
import { fetchGstr3b } from '../api';
import { fetchReconResults, runRecon } from '../api';
import { fetchCarolErpPeriods } from '../api';

export function useInvoices(period: string) {
  return useQuery({
    queryKey: ['invoices', period],
    queryFn: () => fetchInvoices(period),
    enabled: !!period,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useGstr1(period: string) {
  return useQuery({
    queryKey: ['gstr1', period],
    queryFn: () => fetchGstr1(period),
    enabled: !!period,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useGstr1Tables(period: string) {
  return useQuery({
    queryKey: ['gstr1-tables', period],
    queryFn: () => fetchGstr1Tables(period),
    enabled: !!period,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useB2cs(period: string) {
  return useQuery({
    queryKey: ['gstr1-b2cs', period],
    queryFn: () => fetchB2cs(period),
    enabled: !!period,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useGstr3b(period: string) {
  return useQuery({
    queryKey: ['gstr3b', period],
    queryFn: () => fetchGstr3b(period),
    enabled: Boolean(period),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useReconResults(period: string) {
  return useQuery({
    queryKey: ['recon-results', period],
    queryFn: () => fetchReconResults(period),
    enabled: Boolean(period),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useRunRecon(period: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => runRecon(period),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recon-results', period] });
      qc.invalidateQueries({ queryKey: ['gst-summary'] });
    },
  });
}

export function useCarolErpPeriods() {
  return useQuery({
    queryKey: ['carolerp-periods'],
    queryFn: fetchCarolErpPeriods,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });
}
