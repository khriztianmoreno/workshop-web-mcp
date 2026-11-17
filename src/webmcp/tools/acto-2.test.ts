import { describe, it } from 'vitest';

// TODO(acto-2): these tests arrive with the solution. To check your work early:
//   git checkout acto-3 -- src/webmcp/tools/acto-2.test.ts && npm test
describe('Act 2 · read tools (eyes)', () => {
  it.todo('all read tools declare readOnlyHint');
  it.todo('search_products combines filters like the filters bar');
  it.todo('search_products excludes products whose requested size is sold out');
  it.todo('search_products does not change the UI filters');
  it.todo('get_product_details returns variants with stock, and a recoverable error for unknown ids');
  it.todo('get_product_reviews returns the reviews');
  it.todo('get_cart and get_active_filters reflect the shared store');
});
