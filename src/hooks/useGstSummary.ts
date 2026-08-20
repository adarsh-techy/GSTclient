import { useQuery } from '@tanstack/react-query';
import { fetchGstSummary, fetchIrnList } from '../api';

export function useGstSummary(period: string) {
  return useQuery({
    queryKey: ['gst-summary', period],
    queryFn: () => fetchGstSummary(period),
    enabled: Boolean(period),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useIrnList() {
  return useQuery({
    queryKey: ['irns'],
    queryFn: fetchIrnList,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
