import { defineTool } from '../types';

/**
 * TODO(acto-2): implement the get_active_filters tool.
 *   readOnlyHint. Return { filters, resultCount } from getState() and searchProducts().
 * Guide: docs/02-acto-2-ojos.md
 */
export const getActiveFiltersTool = defineTool<Record<string, never>>({
  name: 'get_active_filters',
  description: 'TODO(acto-2): describe this tool for the model.',
  async execute() {
    throw new Error('TODO(acto-2): implement get_active_filters');
  },
});
