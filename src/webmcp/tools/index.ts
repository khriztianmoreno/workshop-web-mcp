import type { ModelContextTool } from '../types';

/** Every tool the store exposes. Registered by useWebMcpTools() in <App />. */
export const storeTools: readonly ModelContextTool[] = [
  // TODO(acto-1): getStoreInfoTool
  // TODO(acto-2): searchProductsTool, getProductDetailsTool, getProductReviewsTool, getCartTool, getActiveFiltersTool
  // TODO(acto-3): setFiltersTool, addToCartTool, applyCouponTool, openCartTool, checkoutTool
];
