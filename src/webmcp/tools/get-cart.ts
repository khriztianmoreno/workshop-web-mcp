import { defineTool } from '../types';

/**
 * TODO(acto-2): implement the get_cart tool.
 *   readOnlyHint. Return getCartSummary(getState()).
 * Guide: docs/02-acto-2-ojos.md
 */
export const getCartTool = defineTool<Record<string, never>>({
  name: 'get_cart',
  description: 'TODO(acto-2): describe this tool for the model.',
  async execute() {
    throw new Error('TODO(acto-2): implement get_cart');
  },
});
