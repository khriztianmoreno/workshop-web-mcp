import { defineTool } from '../types';

/**
 * TODO(acto-3): implement the open_cart tool.
 *   call openCart() and return { ok: true, cart: getCartSummary(getState()) }.
 * Guide: docs/03-acto-3-manos.md
 */
export const openCartTool = defineTool<Record<string, never>>({
  name: 'open_cart',
  description: 'TODO(acto-3): describe this tool for the model.',
  async execute() {
    throw new Error('TODO(acto-3): implement open_cart');
  },
});
