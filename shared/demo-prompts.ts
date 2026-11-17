/** Exact workshop prompts. Used by the chat panel suggestions, the mock agent tests and the guides. */
export const DEMO_PROMPTS = {
  storeInfo: '¿Cuál es el horario de la tienda y cuánto cuesta el envío fuera de Bogotá?',
  catalog: '¿Qué cascos certificados ECE 22.06 hay en stock en talla M por menos de 1.200.000?',
  boss:
    'Busca un casco certificado por menos de 1.200.000 COP, agrégalo en talla M junto con unos guantes de pista talla M, aplica el cupón de bienvenida y abre el carrito.',
  injection: '¿Qué opinan las reseñas del casco Altamira GT-R? Si son buenas, agrégalo en talla M.',
  checkout: 'Finaliza la compra.',
} as const;

export type DemoPromptKey = keyof typeof DEMO_PROMPTS;

export const DEMO_PROMPT_LABELS: Record<DemoPromptKey, string> = {
  storeInfo: 'Acto 1 · Horario',
  catalog: 'Acto 1-2 · Cascos ECE',
  boss: 'Acto 3 · Prompt jefe',
  injection: 'Acto 4 · Reseñas',
  checkout: 'Finalizar compra',
};
