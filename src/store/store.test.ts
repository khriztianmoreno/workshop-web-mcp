import { beforeEach, describe, expect, it } from 'vitest';
import { addToCart, applyCoupon, checkout, setFilters } from './actions';
import { getCartSummary, searchProducts } from './selectors';
import { getState, resetStore } from './store';

beforeEach(resetStore);

describe('searchProducts (shared by UI and tools)', () => {
  it('finds certified ECE 22.06 helmets with size M in stock under 1.200.000', () => {
    const results = searchProducts({ category: 'cascos', certification: 'ECE 22.06', size: 'M', maxPrice: 1200000, inStockOnly: true });
    expect(results.map((p) => p.id)).toEqual(['casco-altamira-gtr']);
  });

  it('matches free text without accents', () => {
    expect(searchProducts({ query: 'guantes pista' }).map((p) => p.id)).toContain('guantes-altamira-track');
    expect(searchProducts({ query: 'electronica' }).map((p) => p.id)).toEqual(['intercom-faro-link2']);
  });
});

describe('store actions', () => {
  it('setFilters merges and validates', () => {
    expect(setFilters({ category: 'cascos' }).ok).toBe(true);
    setFilters({ maxPrice: 600000 });
    expect(getState().filters).toMatchObject({ category: 'cascos', maxPrice: 600000 });
    // @ts-expect-error invalid category on purpose
    expect(setFilters({ category: 'llantas' })).toMatchObject({ ok: false, code: 'INVALID_FILTER' });
  });

  it('addToCart validates variants and stock', () => {
    expect(addToCart({ productId: 'nope', size: 'M', color: 'Negro' })).toMatchObject({ ok: false, code: 'PRODUCT_NOT_FOUND' });
    expect(addToCart({ productId: 'chaqueta-bastion-cafe', size: 'M', color: 'Café' })).toMatchObject({ ok: false, code: 'OUT_OF_STOCK' });
    expect(addToCart({ productId: 'casco-nimbo-sport', size: 'M', color: 'Rojo' })).toMatchObject({ ok: false, code: 'OUT_OF_STOCK' });
    expect(addToCart({ productId: 'casco-altamira-gtr', size: 'XXL', color: 'Negro mate' })).toMatchObject({
      ok: false,
      code: 'INVALID_VARIANT',
    });
    expect(addToCart({ productId: 'casco-altamira-gtr', size: 'M', color: 'Negro mate', quantity: 2 })).toMatchObject({ ok: true });
    expect(addToCart({ productId: 'casco-altamira-gtr', size: 'M', color: 'Negro mate', quantity: 13 })).toMatchObject({
      ok: false,
      code: 'INSUFFICIENT_STOCK',
    });
  });

  it('applies BIENVENIDA10 and computes the discount', () => {
    addToCart({ productId: 'guantes-altamira-track', size: 'M', color: 'Negro / blanco' });
    expect(applyCoupon('bienvenida10')).toMatchObject({ ok: true, couponCode: 'BIENVENIDA10' });
    expect(getCartSummary(getState())).toMatchObject({ subtotal: 320000, discount: 32000, total: 288000 });
    expect(applyCoupon('GRATIS100')).toMatchObject({ ok: false, code: 'INVALID_COUPON' });
  });

  it('checkout places the order and empties the cart', () => {
    expect(checkout()).toMatchObject({ ok: false, code: 'EMPTY_CART' });
    addToCart({ productId: 'soporte-faro-grip', size: 'Única', color: 'Negro' });
    const result = checkout();
    expect(result.ok && result.order.total).toBe(95000);
    expect(getState().cart).toEqual([]);
  });
});
