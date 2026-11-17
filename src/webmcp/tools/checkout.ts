import { checkout } from '../../store/actions';
import { formatCop, getCartSummary } from '../../store/selectors';
import { getState } from '../../store/store';
import { requestConfirmation } from '../../ui/confirmation';
import { defineTool } from '../types';

export const checkoutTool = defineTool<Record<string, never>>({
  name: 'checkout',
  title: 'Finalizar compra',
  description:
    'Places the order with the current cart. The page will ask the human to confirm in its own dialog; ' +
    'if they decline, the order is not placed and ok=false with code USER_DECLINED is returned.',
  inputSchema: { type: 'object', properties: {} },
  // consequentialHint: real-world effect (money). Agents should confirm with the user first.
  annotations: { consequentialHint: true },
  async execute(_input, { signal }) {
    const summary = getCartSummary(getState());
    if (summary.lines.length === 0) {
      return { ok: false, code: 'EMPTY_CART', message: 'El carrito está vacío.' };
    }

    // Defense in depth: the PAGE asks the human. It never trusts that the agent already asked.
    const approved = await requestConfirmation(
      {
        title: 'Un agente quiere finalizar tu compra',
        message: `Total a pagar: ${formatCop(summary.total)}. ¿Confirmas el pedido?`,
        details: summary.lines.map((line) => `${line.quantity} × ${line.name} (${line.size}, ${line.color})`),
        confirmLabel: 'Sí, finalizar compra',
      },
      signal,
    );
    if (!approved) {
      return { ok: false, code: 'USER_DECLINED', message: 'El usuario no confirmó la compra. No se realizó ningún pedido.' };
    }
    return checkout();
  },
});
