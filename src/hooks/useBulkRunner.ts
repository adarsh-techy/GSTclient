import { useCallback, useRef, useState } from 'react';
import { apiError } from '../api';

export type BulkItemState = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export interface BulkItemResult<T> {
  item: T;
  state: BulkItemState;
  message?: string;
}

export interface BulkRunState<T> {
  running: boolean;
  
  waitingSeconds: number;
  results: BulkItemResult<T>[];
  completed: number;
  succeeded: number;
  failed: number;
  total: number;
}

const idle = <T,>(): BulkRunState<T> => ({
  running: false, waitingSeconds: 0, results: [], completed: 0, succeeded: 0, failed: 0, total: 0,
});

export function useBulkRunner<T>() {
  const [state, setState] = useState<BulkRunState<T>>(idle<T>());

  const cancelRef = useRef(false);

  const cancel = useCallback(() => { cancelRef.current = true; }, []);
  const reset = useCallback(() => { cancelRef.current = false; setState(idle<T>()); }, []);

  const run = useCallback(async (items: T[], action: (item: T) => Promise<unknown>) => {
    cancelRef.current = false;
    setState({
      running: true, waitingSeconds: 0, total: items.length, completed: 0, succeeded: 0, failed: 0,
      results: items.map((item) => ({ item, state: 'pending' as BulkItemState })),
    });

    const patch = (index: number, result: Partial<BulkItemResult<T>>) =>
      setState((s) => {
        const results = s.results.slice();
        results[index] = { ...results[index], ...result };
        const completed = results.filter((r) => r.state !== 'pending' && r.state !== 'running').length;
        return {
          ...s,
          results,
          completed,
          succeeded: results.filter((r) => r.state === 'done').length,
          failed: results.filter((r) => r.state === 'failed').length,
        };
      });

    for (let i = 0; i < items.length; i++) {
      if (cancelRef.current) {

        setState((s) => ({
          ...s,
          results: s.results.map((r) => (r.state === 'pending' ? { ...r, state: 'skipped', message: 'Cancelled' } : r)),
        }));
        break;
      }

      patch(i, { state: 'running' });

      let attempted = false;
      while (!attempted && !cancelRef.current) {
        try {
          await action(items[i]);
          patch(i, { state: 'done', message: undefined });
          attempted = true;
        } catch (e) {
          const err = e as { response?: { status?: number; data?: { retryAfterSeconds?: number } } };
          if (err?.response?.status === 429) {
            const wait = Math.max(1, err.response?.data?.retryAfterSeconds ?? 60);
            await countdown(wait, (left) => setState((s) => ({ ...s, waitingSeconds: left })), cancelRef);
            setState((s) => ({ ...s, waitingSeconds: 0 }));
            continue; 
          }
          patch(i, { state: 'failed', message: apiError(e).message });
          attempted = true;
        }
      }
      if (cancelRef.current && !attempted) patch(i, { state: 'skipped', message: 'Cancelled' });
    }

    setState((s) => ({ ...s, running: false, waitingSeconds: 0 }));
  }, []);

  return { state, run, cancel, reset };
}

async function countdown(seconds: number, onTick: (left: number) => void, cancelRef: { current: boolean }) {
  for (let left = seconds; left > 0; left--) {
    if (cancelRef.current) return;
    onTick(left);
    await new Promise((r) => setTimeout(r, 1000));
  }
}
