import { defineTool } from '../types';

export interface ApplyCouponInput {
  code: string;
}

/**
 * TODO(acto-3): implement the apply_coupon tool.
 *   call applyCoupon(code); on success return { ok, couponCode, description, subtotal, discount, total }.
 * Guide: docs/03-acto-3-manos.md
 */
export const applyCouponTool = defineTool<ApplyCouponInput>({
  name: 'apply_coupon',
  description: 'TODO(acto-3): describe this tool for the model.',
  async execute() {
    throw new Error('TODO(acto-3): implement apply_coupon');
  },
});
