import type { Category, Certification } from '../../data/types';
import { defineTool } from '../types';

export interface SearchProductsInput {
  query?: string;
  category?: Category;
  certification?: Certification;
  maxPrice?: number;
  size?: string;
  inStockOnly?: boolean;
}

/**
 * TODO(acto-2): implement the search_products tool.
 *   inputSchema with the 6 optional filters, readOnlyHint, and reuse searchProducts() from src/store/selectors.ts.
 *   Return { count, products: results.map(toProductSummary) } (./serializers).
 * Guide: docs/02-acto-2-ojos.md
 */
export const searchProductsTool = defineTool<SearchProductsInput>({
  name: 'search_products',
  description: 'TODO(acto-2): describe this tool for the model.',
  async execute() {
    throw new Error('TODO(acto-2): implement search_products');
  },
});
