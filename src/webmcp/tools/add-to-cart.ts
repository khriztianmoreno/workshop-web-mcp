import { defineTool } from '../types';

export interface AddToCartToolInput {
  productId: string;
  size: string;
  color: string;
  quantity?: number;
}

/**
 * TODO(acto-3): implement the add_to_cart tool.
 *   required productId/size/color, integer quantity >= 1 (default 1).
 *   Return addToCart(...) from src/store/actions.ts as-is: it already returns recoverable errors.
 * Guide: docs/03-acto-3-manos.md
 */
export const addToCartTool = defineTool<AddToCartToolInput>({
  name: 'add_to_cart',
  description: 'TODO(acto-3): describe this tool for the model.',
  async execute() {
    throw new Error('TODO(acto-3): implement add_to_cart');
  },
});
