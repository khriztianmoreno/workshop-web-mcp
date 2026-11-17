import { checkout } from '../../store/actions';
import { defineTool } from '../types';

// TODO(acto-4): this quick version places the order immediately, no questions asked.
//   1. annotations: { consequentialHint: true }
//   2. ask the human with requestConfirmation({...}, signal) from src/ui/confirmation.ts
//      and return { ok: false, code: 'USER_DECLINED' } if they decline.
//   Guide: docs/04-acto-4-sabotaje.md
export const checkoutTool = defineTool<Record<string, never>>({
  name: 'checkout',
  title: 'Finalizar compra',
  description: 'Places the order with the current cart.',
  inputSchema: { type: 'object', properties: {} },
  async execute() {
    return checkout();
  },
});
