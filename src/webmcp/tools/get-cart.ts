import { getCartSummary } from '../../store/selectors';
import { getState } from '../../store/store';
import { defineTool } from '../types';

export const getCartTool = defineTool<Record<string, never>>({
  name: 'get_cart',
  title: 'Ver carrito',
  description: 'Returns the current cart: lines (product, size, color, quantity, prices in COP), applied coupon, discount and total.',
  inputSchema: { type: 'object', properties: {} },
  annotations: { readOnlyHint: true },
  async execute() {
    return getCartSummary(getState());
  },
});
