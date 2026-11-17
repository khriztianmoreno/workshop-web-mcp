import { defineTool } from '../types';

export interface GetProductDetailsInput {
  productId: string;
}

/**
 * TODO(acto-2): implement the get_product_details tool.
 *   required productId, readOnlyHint, findProduct() + toProductDetails().
 *   Unknown id → { ok: false, code: "PRODUCT_NOT_FOUND", message }.
 * Guide: docs/02-acto-2-ojos.md
 */
export const getProductDetailsTool = defineTool<GetProductDetailsInput>({
  name: 'get_product_details',
  description: 'TODO(acto-2): describe this tool for the model.',
  async execute() {
    throw new Error('TODO(acto-2): implement get_product_details');
  },
});
