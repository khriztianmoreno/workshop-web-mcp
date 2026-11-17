import { applyCoupon } from '../../store/actions';
import { getCartSummary } from '../../store/selectors';
import { getState } from '../../store/store';
import { defineTool } from '../types';

export interface ApplyCouponInput {
  code: string;
}

export const applyCouponTool = defineTool<ApplyCouponInput>({
  name: 'apply_coupon',
  title: 'Aplicar cupón',
  description: 'Applies a discount coupon code to the cart (e.g. the welcome coupon BIENVENIDA10). Returns the new totals in COP.',
  inputSchema: {
    type: 'object',
    properties: { code: { type: 'string', description: 'Coupon code, e.g. "BIENVENIDA10".' } },
    required: ['code'],
  },
  async execute({ code }) {
    const result = applyCoupon(code);
    if (!result.ok) return result;
    const { subtotal, discount, total } = getCartSummary(getState());
    return { ok: true, couponCode: result.couponCode, description: result.description, subtotal, discount, total };
  },
});
