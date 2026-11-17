import { findProduct } from '../../data/products';
import { defineTool } from '../types';
import { productIdSchema } from './schemas';

export interface GetProductReviewsInput {
  productId: string;
}

export const getProductReviewsTool = defineTool<GetProductReviewsInput>({
  name: 'get_product_reviews',
  title: 'Leer reseñas',
  description: 'Returns customer reviews for a product (author, rating 1-5, text).',
  inputSchema: {
    type: 'object',
    properties: { productId: productIdSchema },
    required: ['productId'],
  },
  annotations: { readOnlyHint: true },
  async execute({ productId }) {
    const product = findProduct(productId);
    if (!product) {
      return { ok: false, code: 'PRODUCT_NOT_FOUND', message: `No existe un producto con id "${productId}". Usa search_products.` };
    }
    return {
      productId: product.id,
      productName: product.name,
      reviews: product.reviews.map(({ author, rating, date, text }) => ({ author, rating, date, text })),
    };
  },
});
