import { beforeEach, describe, expect, it } from 'vitest';
import { getState, resetStore } from '../../store/store';
import { addToCartTool } from './add-to-cart';
import { applyCouponTool } from './apply-coupon';
import { openCartTool } from './open-cart';
import { setFiltersTool } from './set-filters';
import { run } from './test-utils';

beforeEach(resetStore);

describe('Act 3 · write tools (hands)', () => {
  it('set_filters changes what the user sees', async () => {
    const result = await run(setFiltersTool, { category: 'cascos', certification: 'ECE 22.06', maxPrice: 1200000 });
    expect(result.ok).toBe(true);
    expect(getState().filters).toMatchObject({ category: 'cascos', certification: 'ECE 22.06', maxPrice: 1200000 });
    expect(result.visibleProducts.map((p: { productId: string }) => p.productId)).toEqual(['casco-altamira-gtr', 'casco-nimbo-sport']);
  });

  it('set_filters with reset clears previous filters', async () => {
    await run(setFiltersTool, { category: 'botas', size: '42' });
    await run(setFiltersTool, { reset: true, category: 'guantes' });
    expect(getState().filters).toMatchObject({ category: 'guantes', size: null });
  });

  it('add_to_cart adds a valid variant to the shared cart', async () => {
    const result = await run(addToCartTool, { productId: 'casco-altamira-gtr', size: 'M', color: 'Negro mate', quantity: 1 });
    expect(result.ok).toBe(true);
    expect(getState().cart).toHaveLength(1);
  });

  it('add_to_cart returns recoverable errors with the available variants', async () => {
    const result = await run(addToCartTool, { productId: 'casco-nimbo-sport', size: 'M', color: 'Rojo' });
    expect(result).toMatchObject({ ok: false, code: 'OUT_OF_STOCK' });
    expect(result.details.availableVariants).toContainEqual({ size: 'L', color: 'Rojo', stock: 3 });

    const wrongColor = await run(addToCartTool, { productId: 'casco-altamira-gtr', size: 'M', color: 'Verde' });
    expect(wrongColor).toMatchObject({ ok: false, code: 'INVALID_VARIANT' });
    expect(getState().cart).toHaveLength(0);
  });

  it('apply_coupon applies BIENVENIDA10 and rejects unknown codes', async () => {
    await run(addToCartTool, { productId: 'guantes-altamira-track', size: 'M', color: 'Negro / blanco' });
    expect(await run(applyCouponTool, { code: 'BIENVENIDA10' })).toMatchObject({ ok: true, discount: 32000, total: 288000 });
    expect(await run(applyCouponTool, { code: 'DESCUENTO99' })).toMatchObject({ ok: false, code: 'INVALID_COUPON' });
  });

  it('open_cart opens the drawer', async () => {
    await run(openCartTool, {});
    expect(getState().cartOpen).toBe(true);
  });
});
