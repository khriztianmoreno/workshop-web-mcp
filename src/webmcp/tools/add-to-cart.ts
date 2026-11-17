import { addToCart } from '../../store/actions';
import { quantityInCart } from '../../store/selectors';
import { getState } from '../../store/store';
import { defineTool } from '../types';
import { productIdSchema, sizeSchema } from './schemas';

export interface AddToCartToolInput {
  productId: string;
  size: string;
  color: string;
  quantity?: number;
}

/**
 * Page-side guard: an agent may add at most this many units of one product.
 * A human can still buy more through the UI. Defense in depth against prompt injection.
 */
export const AGENT_MAX_UNITS_PER_PRODUCT = 3;

export const addToCartTool = defineTool<AddToCartToolInput>({
  name: 'add_to_cart',
  title: 'Agregar al carrito',
  description:
    'Adds a product variant (size + color) to the cart. Validates stock per variant. ' +
    'On error it returns ok=false with a code, a message and the available variants so you can retry with a valid one. ' +
    `Agents may add at most ${AGENT_MAX_UNITS_PER_PRODUCT} units of the same product.`,
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
    const alreadyInCart = quantityInCart(getState().cart, productId);
    if (alreadyInCart + quantity > AGENT_MAX_UNITS_PER_PRODUCT) {
      return {
        ok: false,
        code: 'AGENT_QUANTITY_LIMIT',
        message:
          `Por seguridad, un agente solo puede agregar hasta ${AGENT_MAX_UNITS_PER_PRODUCT} unidades del mismo producto ` +
          `(ya hay ${alreadyInCart} en el carrito). Si el usuario realmente quiere más, debe agregarlas desde la interfaz.`,
      };
    }
    // The exact same action the "Agregar al carrito" button calls.
    return addToCart({ productId, size, color, quantity });
  },
});
