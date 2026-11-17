import { addToCart } from '../../store/actions';
import { defineTool } from '../types';
import { productIdSchema, sizeSchema } from './schemas';

export interface AddToCartToolInput {
  productId: string;
  size: string;
  color: string;
  quantity?: number;
}

// TODO(acto-4): an agent can be tricked into adding absurd quantities.
//   Export AGENT_MAX_UNITS_PER_PRODUCT = 3 and, before calling addToCart(), reject requests where
//   quantityInCart(getState().cart, productId) + quantity exceeds it, with
//   { ok: false, code: 'AGENT_QUANTITY_LIMIT', message }. Guide: docs/04-acto-4-sabotaje.md
export const addToCartTool = defineTool<AddToCartToolInput>({
  name: 'add_to_cart',
  title: 'Agregar al carrito',
  description:
    'Adds a product variant (size + color) to the cart. Validates stock per variant. ' +
    'On error it returns ok=false with a code, a message and the available variants so you can retry with a valid one.',
  inputSchema: {
    type: 'object',
    properties: {
      productId: productIdSchema,
      size: sizeSchema,
      color: { type: 'string', description: 'Exact color name from the product variants, e.g. "Negro mate".' },
      quantity: { type: 'integer', minimum: 1, description: 'Units to add. Defaults to 1.' },
    },
    required: ['productId', 'size', 'color'],
  },
  async execute({ productId, size, color, quantity = 1 }) {
    // The exact same action the "Agregar al carrito" button calls.
    return addToCart({ productId, size, color, quantity });
  },
});
