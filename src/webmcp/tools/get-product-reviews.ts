import { defineTool } from '../types';

export interface GetProductReviewsInput {
  productId: string;
}

/**
 * TODO(acto-2): implement the get_product_reviews tool.
 *   required productId, readOnlyHint. Return { productId, productName, reviews: [{ author, rating, date, text }] }.
 * Guide: docs/02-acto-2-ojos.md
 */
export const getProductReviewsTool = defineTool<GetProductReviewsInput>({
  name: 'get_product_reviews',
  description: 'TODO(acto-2): describe this tool for the model.',
  async execute() {
    throw new Error('TODO(acto-2): implement get_product_reviews');
  },
});
