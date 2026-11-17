import type { Category, Certification } from '../../data/types';
import { defineTool } from '../types';

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

/**
 * TODO(acto-3): implement the set_filters tool.
 *   call setFilters(changes, { reset }) from src/store/actions.ts (the same action as <FiltersBar>).
 * Guide: docs/03-acto-3-manos.md
 */
export const setFiltersTool = defineTool<SetFiltersInput>({
  name: 'set_filters',
  description: 'TODO(acto-3): describe this tool for the model.',
  async execute() {
    throw new Error('TODO(acto-3): implement set_filters');
  },
});
