import { STORE_INFO } from '../../data/products';
import { defineTool } from '../types';

export const getStoreInfoTool = defineTool<Record<string, never>>({
  name: 'get_store_info',
  title: 'Información de la tienda',
  description:
    'Returns general information about the Rodada store: opening hours, address, shipping costs and delivery times, free-shipping threshold, payment methods, returns policy and contact.',
  inputSchema: { type: 'object', properties: {} },
  annotations: { readOnlyHint: true },
  async execute() {
    return STORE_INFO;
  },
});
