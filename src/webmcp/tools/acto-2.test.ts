import { beforeEach, describe, expect, it } from 'vitest';
import { addToCart, setFilters } from '../../store/actions';
import { resetStore } from '../../store/store';
import { getActiveFiltersTool } from './get-active-filters';
import { getCartTool } from './get-cart';
import { getProductDetailsTool } from './get-product-details';
import { getProductReviewsTool } from './get-product-reviews';
import { searchProductsTool } from './search-products';
import { run } from './test-utils';

beforeEach(resetStore);

describe('Act 2 · read tools (eyes)', () => {
  it('all read tools declare readOnlyHint', () => {
    for (const tool of [searchProductsTool, getProductDetailsTool, getProductReviewsTool, getCartTool, getActiveFiltersTool]) {
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(true);
    }
  });

  it('search_products combines filters like the filters bar', async () => {
    const result = await run(searchProductsTool, {
      category: 'cascos',
      certification: 'ECE 22.06',
      size: 'M',
      maxPrice: 1200000,
      inStockOnly: true,
    });
    expect(result.count).toBe(1);
    expect(result.products[0]).toMatchObject({ productId: 'casco-altamira-gtr', priceCop: 980000, inStock: true });
  });

  it('search_products excludes products whose requested size is sold out', async () => {
    const result = await run(searchProductsTool, { query: 'Nimbo Sport', category: 'cascos', size: 'M' });
    expect(result.count).toBe(0);
  });

  it('search_products does not change the UI filters', async () => {
    await run(searchProductsTool, { category: 'botas' });
    const active = await run(getActiveFiltersTool, {});
    expect(active.filters.category).toBeNull();
  });

  it('get_product_details returns variants with stock, and a recoverable error for unknown ids', async () => {
    const details = await run(getProductDetailsTool, { productId: 'botas-ruta-touring' });
    expect(details.variants).toContainEqual({ size: '45', color: 'Negro', stock: 0 });
    expect(await run(getProductDetailsTool, { productId: 'casco-inventado' })).toMatchObject({ ok: false, code: 'PRODUCT_NOT_FOUND' });
  });

  it('get_product_reviews returns the reviews', async () => {
    const result = await run(getProductReviewsTool, { productId: 'casco-altamira-gtr' });
    expect(result.reviews).toHaveLength(3);
  });

  it('get_cart and get_active_filters reflect the shared store', async () => {
    addToCart({ productId: 'soporte-faro-grip', size: 'Única', color: 'Negro', quantity: 2 });
    setFilters({ category: 'accesorios' });
    expect(await run(getCartTool, {})).toMatchObject({ itemCount: 2, total: 190000 });
    expect(await run(getActiveFiltersTool, {})).toMatchObject({ filters: { category: 'accesorios' }, resultCount: 4 });
  });
});
