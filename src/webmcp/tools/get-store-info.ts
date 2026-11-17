import { defineTool } from '../types';

/**
 * TODO(acto-1): implement the get_store_info tool.
 *   return STORE_INFO (src/data/products.ts). Read-only: annotations.readOnlyHint = true.
 * Guide: docs/01-acto-1-incidente.md
 */
export const getStoreInfoTool = defineTool<Record<string, never>>({
  name: 'get_store_info',
  description: 'TODO(acto-1): describe this tool for the model.',
  async execute() {
    throw new Error('TODO(acto-1): implement get_store_info');
  },
});
