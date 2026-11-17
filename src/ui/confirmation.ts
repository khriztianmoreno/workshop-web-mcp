import { useSyncExternalStore } from 'react';

/**
 * Page-owned confirmation dialog. The PAGE asks the human; the agent cannot click it,
 * cannot see it, and cannot answer it. Rendered by <ConfirmationDialog />.
 */

export interface ConfirmationRequest {
  id: number;
  title: string;
  message: string;
  details?: string[];
  confirmLabel?: string;
}

let pending: ConfirmationRequest | null = null;
let resolvePending: ((approved: boolean) => void) | null = null;
let sequence = 0;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function requestConfirmation(
  request: Omit<ConfirmationRequest, 'id'>,
  signal?: AbortSignal,
): Promise<boolean> {
  // Only one dialog at a time: a newer request rejects the older one.
  resolvePending?.(false);
  return new Promise<boolean>((resolve) => {
    if (signal?.aborted) {
      resolve(false);
      return;
    }
    sequence += 1;
    pending = { ...request, id: sequence };
    const finish = (approved: boolean) => {
      if (resolvePending !== finish) return;
      pending = null;
      resolvePending = null;
      emit();
      resolve(approved);
    };
    resolvePending = finish;
    signal?.addEventListener('abort', () => finish(false), { once: true });
    emit();
  });
}

export function respondToConfirmation(approved: boolean): void {
  resolvePending?.(approved);
}

export function getPendingConfirmation(): ConfirmationRequest | null {
  return pending;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePendingConfirmation(): ConfirmationRequest | null {
  return useSyncExternalStore(subscribe, getPendingConfirmation, getPendingConfirmation);
}
