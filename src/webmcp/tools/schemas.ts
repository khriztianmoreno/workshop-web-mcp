import { ALL_SIZES, CATEGORIES, CERTIFICATIONS } from '../../data/types';

/** Reusable JSON Schema fragments for tool inputSchemas (provided). */

export const categorySchema = {
  type: 'string',
  enum: [...CATEGORIES],
  description: 'Product category.',
} as const;

export const certificationSchema = {
  type: 'string',
  enum: [...CERTIFICATIONS],
  description: 'Safety certification. Helmets: "ECE 22.06" or "DOT". Apparel and boots: "CE nivel 1" or "CE nivel 2".',
} as const;

export const sizeSchema = {
  type: 'string',
  enum: [...ALL_SIZES],
  description: 'Size. Apparel and helmets: XS-XXL. Boots: 39-45. Accessories: "Única".',
} as const;

export const productIdSchema = {
  type: 'string',
  description: 'Product id as returned by search_products (e.g. "casco-altamira-gtr").',
} as const;
