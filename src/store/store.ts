import { useSyncExternalStore } from 'react';
import type { Category, Certification } from '../data/types';

/**
 * A tiny external store. UI components and WebMCP tools read and write the SAME state
 * through the SAME action functions (see ./actions.ts). There is no "agent version" of the logic.
 */

export interface Filters {
  query: string;
  category: Category | null;
  certification: Certification | null;
  maxPrice: number | null;
  size: string | null;
  inStockOnly: boolean;
}

export interface CartLine {
  lineId: string;
  productId: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  orderId: string;
  createdAt: string;
  lines: CartLine[];
  total: number;
}

export interface StoreState {
  filters: Filters;
  cart: CartLine[];
  couponCode: string | null;
  cartOpen: boolean;
  selectedProductId: string | null;
  lastOrder: Order | null;
}

export const DEFAULT_FILTERS: Filters = {
  query: '',
  category: null,
  certification: null,
  maxPrice: null,
  size: null,
  inStockOnly: false,
};

export function createInitialState(): StoreState {
  return {
    filters: { ...DEFAULT_FILTERS },
    cart: [],
    couponCode: null,
    cartOpen: false,
    selectedProductId: null,
    lastOrder: null,
  };
}

let state: StoreState = createInitialState();
const listeners = new Set<() => void>();

export function getState(): StoreState {
  return state;
}

export function setState(updater: (current: StoreState) => StoreState): void {
  const next = updater(state);
  if (next === state) return;
  state = next;
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test helper: start every test from a clean store. */
export function resetStore(): void {
  state = createInitialState();
  for (const listener of listeners) listener();
}

export function useStore<T>(selector: (current: StoreState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}
