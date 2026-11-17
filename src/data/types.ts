export const CATEGORIES = [
  'cascos',
  'chaquetas',
  'guantes',
  'botas',
  'pantalones',
  'electronica',
  'accesorios',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  cascos: 'Cascos',
  chaquetas: 'Chaquetas',
  guantes: 'Guantes',
  botas: 'Botas',
  pantalones: 'Pantalones',
  electronica: 'Electrónica',
  accesorios: 'Accesorios',
};

export const CERTIFICATIONS = ['ECE 22.06', 'DOT', 'CE nivel 1', 'CE nivel 2'] as const;
export type Certification = (typeof CERTIFICATIONS)[number];

export const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export const BOOT_SIZES = ['39', '40', '41', '42', '43', '44', '45'] as const;
export const ONE_SIZE = 'Única';
export const ALL_SIZES: readonly string[] = [...APPAREL_SIZES, ...BOOT_SIZES, ONE_SIZE];

export interface Variant {
  size: string;
  color: string;
  stock: number;
}

export interface Review {
  id: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  date: string;
  text: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  /** e.g. "integral", "modular", "abierto", "textil", "cuero", "pista", "urbano". */
  style?: string;
  description: string;
  price: number;
  certifications: Certification[];
  features: string[];
  variants: Variant[];
  reviews: Review[];
  /** Visual only: emoji + accent color for the product tile. */
  art: { emoji: string; hue: number };
  popular?: boolean;
}
