import { searchProducts } from '../../store/selectors';
import { getState } from '../../store/store';
import { defineTool } from '../types';

export const getActiveFiltersTool = defineTool<Record<string, never>>({
  name: 'get_active_filters',
  title: 'Ver filtros activos',
  description: 'Returns the catalog filters the user currently sees on screen and how many products match them.',
  inputSchema: { type: 'object', properties: {} },
  annotations: { readOnlyHint: true },
  async execute() {
    const { filters } = getState();
    return { filters, resultCount: searchProducts(filters).length };
  },
});
