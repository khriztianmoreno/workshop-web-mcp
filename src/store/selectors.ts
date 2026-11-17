import { findProduct, PRODUCTS } from '../data/products';
import type { Product } from '../data/types';
import type { CartLine, Filters, StoreState } from './store';

export const COUPONS: Record<string, { percent: number; label: string }> = {
  BIENVENIDA10: { percent: 10, label: '10 % de descuento de bienvenida' },
};

export function totalStock(product: Product): number {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
}

export function isInStock(product: Product): boolean {
  return totalStock(product) > 0;
}

export function sizesInStock(product: Product): string[] {
  return [...new Set(product.variants.filter((v) => v.stock > 0).map((v) => v.size))];
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * The single catalog query used by BOTH the filters bar and the search_products tool.
 * The size filter means "this size is available" (has stock).
 */
export function searchProducts(filters: Partial<Filters>, catalog: readonly Product[] = PRODUCTS): Product[] {
  const words = normalize(filters.query ?? '')
    .split(/\s+/)
    .filter(Boolean);

  return catalog.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.certification && !product.certifications.includes(filters.certification)) return false;
    if (filters.maxPrice != null && product.price > filters.maxPrice) return false;
    if (filters.size && !product.variants.some((v) => v.size === filters.size && v.stock > 0)) return false;
    if (filters.inStockOnly && !isInStock(product)) return false;
    if (words.length > 0) {
      const haystack = normalize(
        [product.name, product.brand, product.category, product.style ?? '', product.description, ...product.features].join(' '),
      );
      if (!words.every((word) => haystack.includes(word))) return false;
    }
    return true;
  });
}

export function quantityInCart(cart: readonly CartLine[], productId: string, size?: string, color?: string): number {
  return cart
    .filter((line) => line.productId === productId && (size == null || line.size === size) && (color == null || line.color === color))
    .reduce((sum, line) => sum + line.quantity, 0);
}

export interface CartSummaryLine {
  lineId: string;
  productId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartSummary {
  lines: CartSummaryLine[];
  itemCount: number;
  subtotal: number;
  couponCode: string | null;
  discount: number;
  total: number;
}

export function getCartSummary(state: Pick<StoreState, 'cart' | 'couponCode'>): CartSummary {
  const lines = state.cart.map((line) => ({
    lineId: line.lineId,
    productId: line.productId,
    name: findProduct(line.productId)?.name ?? line.productId,
    size: line.size,
    color: line.color,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineTotal: line.unitPrice * line.quantity,
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const coupon = state.couponCode ? COUPONS[state.couponCode] : undefined;
  const discount = coupon ? Math.round((subtotal * coupon.percent) / 100) : 0;
  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal,
    couponCode: state.couponCode,
    discount,
    total: subtotal - discount,
  };
}

export function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}
