import { beforeEach, describe, expect, it } from 'vitest';
import { getState, resetStore } from '../../store/store';
import { getPendingConfirmation, respondToConfirmation } from '../../ui/confirmation';
import { AGENT_MAX_UNITS_PER_PRODUCT, addToCartTool } from './add-to-cart';
import { checkoutTool } from './checkout';
import { getProductReviewsTool } from './get-product-reviews';
import { run } from './test-utils';

beforeEach(() => {
  respondToConfirmation(false);
  resetStore();
});

const helmet = { productId: 'casco-altamira-gtr', size: 'M', color: 'Negro mate' };

describe('Act 4 · defenses against prompt injection', () => {
  it('reviews are flagged as untrusted content', () => {
    expect(getProductReviewsTool.annotations?.untrustedContentHint).toBe(true);
  });

  it('add_to_cart caps agent quantities per product', async () => {
    expect(AGENT_MAX_UNITS_PER_PRODUCT).toBe(3);
    expect(await run(addToCartTool, { ...helmet, quantity: 10 })).toMatchObject({ ok: false, code: 'AGENT_QUANTITY_LIMIT' });

    expect(await run(addToCartTool, { ...helmet, quantity: 2 })).toMatchObject({ ok: true });
    // Cumulative: 2 already in cart + 2 more would exceed the cap.
    expect(await run(addToCartTool, { ...helmet, quantity: 2 })).toMatchObject({ ok: false, code: 'AGENT_QUANTITY_LIMIT' });
    expect(getState().cart[0].quantity).toBe(2);
  });

  it('checkout is flagged as consequential', () => {
    expect(checkoutTool.annotations?.consequentialHint).toBe(true);
  });

  it('checkout asks the human and does nothing if they decline', async () => {
    await run(addToCartTool, helmet);
    const pending = run(checkoutTool, {});

    await Promise.resolve();
    expect(getPendingConfirmation()?.title).toMatch(/agente/i);
    respondToConfirmation(false);

    expect(await pending).toMatchObject({ ok: false, code: 'USER_DECLINED' });
    expect(getState().cart).toHaveLength(1);
    expect(getState().lastOrder).toBeNull();
  });

  it('checkout places the order only after the human confirms', async () => {
    await run(addToCartTool, helmet);
    const pending = run(checkoutTool, {});
    await Promise.resolve();
    respondToConfirmation(true);

    const result = await pending;
    expect(result.ok).toBe(true);
    expect(result.order.total).toBe(980000);
    expect(getState().cart).toHaveLength(0);
  });

  it('checkout is cancelled when the agent aborts', async () => {
    await run(addToCartTool, helmet);
    const controller = new AbortController();
    const pending = run(checkoutTool, {}, controller.signal);
    await Promise.resolve();
    controller.abort();
    expect(await pending).toMatchObject({ ok: false, code: 'USER_DECLINED' });
    expect(getPendingConfirmation()).toBeNull();
  });

  it('checkout refuses an empty cart without asking', async () => {
    expect(await run(checkoutTool, {})).toMatchObject({ ok: false, code: 'EMPTY_CART' });
    expect(getPendingConfirmation()).toBeNull();
  });
});
