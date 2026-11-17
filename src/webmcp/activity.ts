import { useSyncExternalStore } from 'react';
import type { ModelContext, ToolEvent } from './types';

/**
 * Visual feedback for agent actions (provided — attendees do not write this).
 *
 * Source of truth is the spec event `toolactivated` (event.toolName), so it also works
 * when the browser's own agent (native WebMCP) calls a tool. When the in-page chat panel
 * is the caller it also reports the arguments, which lets us glow the exact product card.
 */

export type ActivityArea = 'filters' | 'catalog' | 'cart' | 'info';

const TOOL_AREAS: Record<string, ActivityArea[]> = {
  get_store_info: ['info'],
  search_products: ['catalog'],
  get_product_details: ['catalog'],
  get_product_reviews: ['catalog'],
  get_active_filters: ['filters'],
  set_filters: ['filters', 'catalog'],
  get_cart: ['cart'],
  add_to_cart: ['cart'],
  apply_coupon: ['cart'],
  open_cart: ['cart'],
  checkout: ['cart'],
};

export const HIGHLIGHT_MS = 2200;

export interface ActivityToast {
  id: number;
  toolName: string;
  args?: Record<string, unknown>;
}

interface ActivityState {
  highlighted: ReadonlySet<string>;
  toasts: readonly ActivityToast[];
}

let state: ActivityState = { highlighted: new Set(), toasts: [] };
const listeners = new Set<() => void>();
const pendingArgs = new Map<string, Record<string, unknown>>();
let toastSequence = 0;

function update(next: Partial<ActivityState>): void {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

function highlight(keys: string[]): void {
  if (keys.length === 0) return;
  update({ highlighted: new Set([...state.highlighted, ...keys]) });
  setTimeout(() => {
    const next = new Set(state.highlighted);
    for (const key of keys) next.delete(key);
    update({ highlighted: next });
  }, HIGHLIGHT_MS);
}

/** Called by the chat panel right before executeTool(), so the toast can show the arguments. */
export function reportAgentToolCall(toolName: string, args: Record<string, unknown>): void {
  pendingArgs.set(toolName, args);
}

export function startAgentActivity(modelContext: ModelContext): () => void {
  const onActivated = (event: Event) => {
    const { toolName } = event as ToolEvent;
    const args = pendingArgs.get(toolName);
    pendingArgs.delete(toolName);

    const keys: string[] = [...(TOOL_AREAS[toolName] ?? [])];
    if (typeof args?.productId === 'string') keys.push(`product:${args.productId}`);
    highlight(keys);

    toastSequence += 1;
    const toast: ActivityToast = { id: toastSequence, toolName, args };
    update({ toasts: [...state.toasts, toast].slice(-4) });
    setTimeout(() => update({ toasts: state.toasts.filter((t) => t.id !== toast.id) }), HIGHLIGHT_MS + 800);
  };

  modelContext.addEventListener('toolactivated', onActivated);
  return () => modelContext.removeEventListener('toolactivated', onActivated);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAgentHighlight(key: ActivityArea | `product:${string}`): boolean {
  return useSyncExternalStore(subscribe, () => state.highlighted.has(key));
}

export function useActivityToasts(): readonly ActivityToast[] {
  return useSyncExternalStore(subscribe, () => state.toasts);
}
