import type { Category, Certification } from '../../data/types';
import { setFilters } from '../../store/actions';
import { searchProducts } from '../../store/selectors';
import { defineTool } from '../types';
import { categorySchema, certificationSchema, sizeSchema } from './schemas';

export interface SetFiltersInput {
  query?: string;
  category?: Category;
  certification?: Certification;
  maxPrice?: number;
  size?: string;
  inStockOnly?: boolean;
  /** Clear every filter before applying the given ones. */
  reset?: boolean;
}

export const setFiltersTool = defineTool<SetFiltersInput>({
  name: 'set_filters',
  title: 'Aplicar filtros',
  description:
    'Changes the catalog filters the user SEES on screen (same as using the filters bar). ' +
    'Only the given fields change; pass reset=true to clear all filters first. Returns the active filters and the matching products.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Free text search shown in the search box.' },
      category: categorySchema,
      certification: certificationSchema,
      maxPrice: { type: 'number', description: 'Maximum price in COP.' },
      size: sizeSchema,
      inStockOnly: { type: 'boolean' },
      reset: { type: 'boolean', description: 'Clear all filters before applying these.' },
    },
  },
  async execute({ reset, ...changes }) {
    // The exact same action the <FiltersBar> calls.
    const result = setFilters(changes, { reset });
    if (!result.ok) return result;
    const visible = searchProducts(result.filters).map((p) => ({ productId: p.id, name: p.name, priceCop: p.price }));
    return { ok: true, filters: result.filters, resultCount: result.resultCount, visibleProducts: visible };
  },
});
