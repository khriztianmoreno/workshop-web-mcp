import { findProduct } from '../data/products';
import { CATEGORIES, CERTIFICATIONS, type Category, type Certification } from '../data/types';
import { COUPONS, getCartSummary, quantityInCart, searchProducts } from './selectors';
import { DEFAULT_FILTERS, getState, setState, type CartLine, type Filters, type Order } from './store';

/**
 * Store actions: plain functions shared by UI event handlers AND WebMCP tools.
 * They validate input and return a Result instead of throwing, so both a human
 * (via the UI) and a model (via a tool) get a clear, recoverable error.
 */

export type ActionErrorCode =
  | 'PRODUCT_NOT_FOUND'
  | 'OUT_OF_STOCK'
  | 'INVALID_VARIANT'
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_QUANTITY'
  | 'INVALID_FILTER'
  | 'INVALID_COUPON'
  | 'EMPTY_CART';

export interface ActionError {
  ok: false;
  code: ActionErrorCode;
  message: string;
  /** Extra data that helps the caller recover (e.g. available variants). */
  details?: Record<string, unknown>;
}

export type Result<T> = ({ ok: true } & T) | ActionError;

function fail(code: ActionErrorCode, message: string, details?: Record<string, unknown>): ActionError {
  return { ok: false, code, message, ...(details ? { details } : {}) };
}

// ---------------------------------------------------------------- filters

export interface FilterChanges {
  query?: string;
  category?: Category | null;
  certification?: Certification | null;
  maxPrice?: number | null;
  size?: string | null;
  inStockOnly?: boolean;
}

export function setFilters(changes: FilterChanges, options: { reset?: boolean } = {}): Result<{ filters: Filters; resultCount: number }> {
  if (changes.category != null && !CATEGORIES.includes(changes.category)) {
    return fail('INVALID_FILTER', `La categoría "${changes.category}" no existe.`, { validCategories: CATEGORIES });
  }
  if (changes.certification != null && !CERTIFICATIONS.includes(changes.certification)) {
    return fail('INVALID_FILTER', `La certificación "${changes.certification}" no existe.`, { validCertifications: CERTIFICATIONS });
  }
  if (changes.maxPrice != null && (!Number.isFinite(changes.maxPrice) || changes.maxPrice <= 0)) {
    return fail('INVALID_FILTER', 'El precio máximo debe ser un número positivo en COP.');
  }

  const base = options.reset ? DEFAULT_FILTERS : getState().filters;
  const filters: Filters = { ...base };
  for (const [key, value] of Object.entries(changes) as [keyof Filters, unknown][]) {
    if (value !== undefined) (filters as Record<keyof Filters, unknown>)[key] = value;
  }
  setState((current) => ({ ...current, filters }));
  return { ok: true, filters, resultCount: searchProducts(filters).length };
}

export function resetFilters(): void {
  setState((current) => ({ ...current, filters: { ...DEFAULT_FILTERS } }));
}

// ---------------------------------------------------------------- cart

export interface AddToCartInput {
  productId: string;
  size: string;
  color: string;
  quantity?: number;
}

export function addToCart(input: AddToCartInput): Result<{ line: CartLine; cartItemCount: number }> {
  const quantity = input.quantity ?? 1;
  const product = findProduct(input.productId);
  if (!product) {
    return fail('PRODUCT_NOT_FOUND', `No existe un producto con id "${input.productId}". Usa search_products para obtener ids válidos.`);
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return fail('INVALID_QUANTITY', 'La cantidad debe ser un número entero mayor o igual a 1.');
  }

  const available = product.variants.filter((v) => v.stock > 0).map(({ size, color, stock }) => ({ size, color, stock }));
  if (available.length === 0) {
    return fail('OUT_OF_STOCK', `${product.name} está agotado en todas sus tallas y colores.`);
  }

  const variant = product.variants.find((v) => v.size === input.size && v.color === input.color);
  if (!variant) {
    return fail('INVALID_VARIANT', `${product.name} no existe en talla "${input.size}" y color "${input.color}".`, {
      availableVariants: available,
    });
  }

  const alreadyInCart = quantityInCart(getState().cart, product.id, variant.size, variant.color);
  if (variant.stock - alreadyInCart < quantity) {
    const left = Math.max(variant.stock - alreadyInCart, 0);
    return fail(
      left === 0 ? 'OUT_OF_STOCK' : 'INSUFFICIENT_STOCK',
      left === 0
        ? `${product.name} está agotado en talla ${variant.size}, color ${variant.color}.`
        : `Solo quedan ${left} unidades de ${product.name} en talla ${variant.size}, color ${variant.color}.`,
      { availableQuantity: left, availableVariants: available },
    );
  }

  let line: CartLine | undefined;
  setState((current) => {
    const existing = current.cart.find((l) => l.productId === product.id && l.size === variant.size && l.color === variant.color);
    if (existing) {
      line = { ...existing, quantity: existing.quantity + quantity };
      return { ...current, cart: current.cart.map((l) => (l.lineId === existing.lineId ? line! : l)) };
    }
    line = {
      lineId: `${product.id}:${variant.size}:${variant.color}`,
      productId: product.id,
      size: variant.size,
      color: variant.color,
      quantity,
      unitPrice: product.price,
    };
    return { ...current, cart: [...current.cart, line] };
  });

  return { ok: true, line: line!, cartItemCount: getCartSummary(getState()).itemCount };
}

export function setLineQuantity(lineId: string, quantity: number): Result<{ quantity: number }> {
  const line = getState().cart.find((l) => l.lineId === lineId);
  if (!line) return fail('PRODUCT_NOT_FOUND', 'Esa línea ya no está en el carrito.');
  if (quantity <= 0) {
    removeFromCart(lineId);
    return { ok: true, quantity: 0 };
  }
  const variant = findProduct(line.productId)?.variants.find((v) => v.size === line.size && v.color === line.color);
  if (!variant || quantity > variant.stock) {
    return fail('INSUFFICIENT_STOCK', `Solo hay ${variant?.stock ?? 0} unidades disponibles.`);
  }
  setState((current) => ({ ...current, cart: current.cart.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)) }));
  return { ok: true, quantity };
}

export function removeFromCart(lineId: string): void {
  setState((current) => ({ ...current, cart: current.cart.filter((l) => l.lineId !== lineId) }));
}

// ---------------------------------------------------------------- coupon

export function applyCoupon(code: string): Result<{ couponCode: string; description: string; discount: number }> {
  const normalized = code.trim().toUpperCase();
  const coupon = COUPONS[normalized];
  if (!coupon) {
    return fail('INVALID_COUPON', `El cupón "${code}" no es válido.`);
  }
  setState((current) => ({ ...current, couponCode: normalized }));
  return { ok: true, couponCode: normalized, description: coupon.label, discount: getCartSummary(getState()).discount };
}

export function removeCoupon(): void {
  setState((current) => ({ ...current, couponCode: null }));
}

// ---------------------------------------------------------------- UI state

export function openCart(): void {
  setState((current) => (current.cartOpen ? current : { ...current, cartOpen: true }));
}

export function closeCart(): void {
  setState((current) => (current.cartOpen ? { ...current, cartOpen: false } : current));
}

export function selectProduct(productId: string | null): void {
  setState((current) => ({ ...current, selectedProductId: productId }));
}

// ---------------------------------------------------------------- checkout

let orderSequence = 1000;

/**
 * Places the order. This is the same function the "Finalizar compra" button calls.
 * It does NOT ask for confirmation: the human clicking the button IS the confirmation.
 * Agent-initiated checkouts must confirm first (see src/webmcp/tools/checkout.ts).
 */
export function checkout(): Result<{ order: Order }> {
  const state = getState();
  if (state.cart.length === 0) return fail('EMPTY_CART', 'El carrito está vacío.');
  orderSequence += 1;
  const order: Order = {
    orderId: `RD-${orderSequence}`,
    createdAt: new Date().toISOString(),
    lines: state.cart,
    total: getCartSummary(state).total,
  };
  setState((current) => ({ ...current, cart: [], couponCode: null, lastOrder: order }));
  return { ok: true, order };
}

export function dismissOrder(): void {
  setState((current) => ({ ...current, lastOrder: null }));
}
