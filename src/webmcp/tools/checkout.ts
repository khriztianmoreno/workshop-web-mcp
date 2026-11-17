import { defineTool } from '../types';

/**
 * TODO(acto-3): implement the checkout tool.
 *   quick version: call checkout() from src/store/actions.ts and return its result.
 * Guide: docs/03-acto-3-manos.md
 */
export const checkoutTool = defineTool<Record<string, never>>({
  name: 'checkout',
  description: 'TODO(acto-3): describe this tool for the model.',
  async execute() {
    throw new Error('TODO(acto-3): implement checkout');
  },
});
