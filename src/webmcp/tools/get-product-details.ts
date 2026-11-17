import { findProduct } from '../../data/products';
import { defineTool } from '../types';
import { productIdSchema } from './schemas';
import { toProductDetails } from './serializers';

export interface GetProductDetailsInput {
  productId: string;
}

export const getProductDetailsTool = defineTool<GetProductDetailsInput>({
  name: 'get_product_details',
  title: 'Ver detalle de producto',
  description:
    'Returns the full details of one product: description, features, certifications, price in COP and stock for every size/color variant. Reviews are NOT included; use get_product_reviews.',
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
    return toProductDetails(product);
  },
});
