import type { ModelContextTool } from '../types';
import { addToCartTool } from './add-to-cart';
import { applyCouponTool } from './apply-coupon';
import { checkoutTool } from './checkout';
import { getActiveFiltersTool } from './get-active-filters';
import { getCartTool } from './get-cart';
import { getProductDetailsTool } from './get-product-details';
import { getProductReviewsTool } from './get-product-reviews';
import { getStoreInfoTool } from './get-store-info';
import { openCartTool } from './open-cart';
import { searchProductsTool } from './search-products';
import { setFiltersTool } from './set-filters';

/** Every tool the store exposes. Registered by useWebMcpTools() in <App />. */
export const storeTools: readonly ModelContextTool[] = [
  // Act 1: first tool
  getStoreInfoTool,
  // Act 2: eyes (read-only)
  searchProductsTool,
  getProductDetailsTool,
  getProductReviewsTool,
  getCartTool,
  getActiveFiltersTool,
  // Act 3: hands (write)
  setFiltersTool,
  addToCartTool,
  applyCouponTool,
  openCartTool,
  checkoutTool,
];
