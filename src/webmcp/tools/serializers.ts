import type { Product } from '../../data/types';
import { isInStock, sizesInStock } from '../../store/selectors';

/**
 * Compact, model-friendly views of a product. Keep tool outputs small and explicit:
 * ids the model can reuse, prices as numbers in COP, and stock per variant.
 */

export function toProductSummary(product: Product) {
  return {
    productId: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    style: product.style ?? null,
    priceCop: product.price,
    certifications: product.certifications,
    inStock: isInStock(product),
    sizesInStock: sizesInStock(product),
    colors: [...new Set(product.variants.map((v) => v.color))],
  };
}

export function toProductDetails(product: Product) {
  const ratings = product.reviews.map((review) => review.rating);
  return {
    ...toProductSummary(product),
    description: product.description,
    features: product.features,
    variants: product.variants.map(({ size, color, stock }) => ({ size, color, stock })),
    averageRating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
    reviewCount: ratings.length,
  };
}
