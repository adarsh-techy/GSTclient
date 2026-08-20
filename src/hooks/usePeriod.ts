import { useCallback, useEffect, useMemo } from 'react';
import { useCarolErpPeriods } from './useInvoices';
import { useAppDispatch, useAppSelector } from '../store';
import { setGlobalPeriod } from '../store/slices/uiSlice';

const FALLBACK_PERIOD = '202604';

export function usePeriod() {
  const dispatch = useAppDispatch();
  const globalPeriod = useAppSelector((state) => state.ui.period);
  const periodsQuery = useCarolErpPeriods();

  const options = periodsQuery.data ?? [];

  const defaultPeriod = useMemo(() => {
    if (options.length === 0) return globalPeriod || FALLBACK_PERIOD;
    const populated = options.find((p) => p.salesCount + p.purchaseCount > 0);
    return populated?.period ?? options[0]?.period ?? FALLBACK_PERIOD;
  }, [options, globalPeriod]);

  useEffect(() => {
    if (!globalPeriod && defaultPeriod) {
      dispatch(setGlobalPeriod(defaultPeriod));
    }
  }, [defaultPeriod, globalPeriod, dispatch]);

  const activePeriod = globalPeriod || defaultPeriod;

  const setPeriod = useCallback(
    (p: string) => {
      dispatch(setGlobalPeriod(p));
    },
    [dispatch],
  );

  return {
    period: activePeriod,
    setPeriod,
    options,
    isLoading: periodsQuery.isLoading,
    isError: periodsQuery.isError,
    error: periodsQuery.error as Error | null | undefined,
  };
}

export function formatPeriod(period: string) {
  if (!period || period.length !== 6) return period;
  const year = period.slice(0, 4);
  const month = parseInt(period.slice(4, 6), 10);
  const monthName = new Date(Number(year), month - 1, 1).toLocaleString('en-IN', { month: 'short' });
  return `${monthName} ${year}`;
}
