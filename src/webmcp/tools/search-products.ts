import type { Category, Certification } from '../../data/types';
import { searchProducts } from '../../store/selectors';
import { defineTool } from '../types';
import { categorySchema, certificationSchema, sizeSchema } from './schemas';
import { toProductSummary } from './serializers';

export interface SearchProductsInput {
  query?: string;
  category?: Category;
  certification?: Certification;
  maxPrice?: number;
  size?: string;
  inStockOnly?: boolean;
}

export const searchProductsTool = defineTool<SearchProductsInput>({
  name: 'search_products',
  title: 'Buscar productos',
  description:
    'Searches the Rodada motorcycle gear catalog. All filters are optional and combined with AND. ' +
    'Returns product ids, prices in COP, certifications and which sizes are in stock. ' +
    'Does not change what the user sees; use set_filters for that.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Free text, e.g. "integral", "pista", "Altamira".' },
      category: categorySchema,
      certification: certificationSchema,
      maxPrice: { type: 'number', description: 'Maximum price in COP, e.g. 1200000.' },
      size: { ...sizeSchema, description: 'Only products with stock in this size.' },
      inStockOnly: { type: 'boolean', description: 'Only products with stock in at least one variant.' },
    },
  },
  annotations: { readOnlyHint: true },
  async execute(input) {
    // Same function the filters bar uses: one source of truth.
    const results = searchProducts(input);
    return { count: results.length, products: results.map(toProductSummary) };
  },
});
