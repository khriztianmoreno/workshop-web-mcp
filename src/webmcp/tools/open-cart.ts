import { openCart } from '../../store/actions';
import { getCartSummary } from '../../store/selectors';
import { getState } from '../../store/store';
import { defineTool } from '../types';

export const openCartTool = defineTool<Record<string, never>>({
  name: 'open_cart',
  title: 'Abrir carrito',
  description: 'Opens the cart drawer so the user can review it. Returns the cart summary.',
  inputSchema: { type: 'object', properties: {} },
  async execute() {
    openCart();
    return { ok: true, cart: getCartSummary(getState()) };
  },
});
