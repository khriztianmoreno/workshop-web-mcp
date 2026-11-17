import {
  UNTRUSTED_CLOSE,
  UNTRUSTED_OPEN,
  type ChatRequest,
  type ChatResponse,
  type FunctionCallPart,
} from '../shared/agent-protocol';

/**
 * Deterministic scripted agent ("Modo simulado").
 *
 * It recognizes the workshop demo prompts and plans function calls ONLY with the tools the
 * page actually registered, so the workshop narrative still works without wifi or an API key:
 *  - no tools        → it guesses (the "mute chatbot" of Act 1)
 *  - read tools      → it answers with real data (Act 2)
 *  - write tools     → it drives the UI (Act 3)
 *  - injection       → it OBEYS instructions in reviews unless the tool output is marked
 *                      untrusted (Act 4), which is exactly the behavior we defend against.
 */

interface Step {
  name: string;
  args: Record<string, unknown>;
  response: Record<string, unknown>;
}

interface Turn {
  text: string;
  steps: Step[];
  tools: Set<string>;
}

type Scenario = 'storeInfo' | 'catalog' | 'boss' | 'injection' | 'checkout' | 'unknown';

interface ProductSummary {
  productId: string;
  name: string;
  priceCop: number;
  sizesInStock?: string[];
  certifications?: string[];
}

interface ProductDetails extends ProductSummary {
  variants: { size: string; color: string; stock: number }[];
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

const cop = (value: number) => `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value)} COP`;

export function detectScenario(userText: string): Scenario {
  const t = normalize(userText);
  if (t.includes('resena') || t.includes('opinan')) return 'injection';
  if (t.includes('cupon') || t.includes('abre el carrito') || (t.includes('agrega') && t.includes('guantes'))) return 'boss';
  if (t.includes('finaliza') || t.includes('pagar') || t.includes('checkout')) return 'checkout';
  if (t.includes('horario') || t.includes('envio') || t.includes('pago')) return 'storeInfo';
  if (/(casco|guante|chaqueta|bota|pantalon|stock|talla|precio)/.test(t)) return 'catalog';
  return 'unknown';
}

function readTurn(request: ChatRequest): Turn {
  const { messages } = request;
  let lastUser = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') {
      lastUser = i;
      break;
    }
  }
  const userMessage = messages[lastUser];
  const text = userMessage?.role === 'user' ? userMessage.text : '';

  const steps: Step[] = [];
  const pending: FunctionCallPart[] = [];
  for (const message of messages.slice(lastUser + 1)) {
    if (message.role === 'model') pending.push(...(message.functionCalls ?? []));
    if (message.role === 'tool') {
      for (const result of message.results) {
        const index = pending.findIndex((call) => (result.id ? call.id === result.id : call.name === result.name));
        const call = index >= 0 ? pending.splice(index, 1)[0] : undefined;
        steps.push({ name: result.name, args: call?.args ?? {}, response: result.response });
      }
    }
  }
  return { text, steps, tools: new Set(request.tools.map((tool) => tool.name)) };
}

/** What the tool returned, unwrapping the browser's untrusted envelope if present. */
export function payload(step: Step | undefined): any {
  if (!step) return undefined;
  const { response } = step;
  if (response.untrusted === true && typeof response.content === 'string') {
    const inner = response.content.replace(UNTRUSTED_OPEN, '').replace(UNTRUSTED_CLOSE, '').trim();
    try {
      return JSON.parse(inner);
    } catch {
      return inner;
    }
  }
  if ('output' in response) return response.output;
  return response;
}

function isFailure(value: any): boolean {
  return value == null || value.ok === false || typeof value.error === 'string';
}

function failureMessage(value: any): string {
  return value?.message ?? value?.error ?? 'error desconocido';
}

let callSequence = 0;

function call(...calls: [string, Record<string, unknown>][]): ChatResponse {
  return {
    mode: 'mock',
    functionCalls: calls.map(([name, args]) => {
      callSequence += 1;
      return { id: `mock-${callSequence}`, name, args };
    }),
  };
}

function say(text: string): ChatResponse {
  return { mode: 'mock', text, functionCalls: [] };
}

const findStep = (turn: Turn, name: string, predicate: (step: Step) => boolean = () => true) =>
  turn.steps.find((step) => step.name === name && predicate(step));

const hasTools = (turn: Turn, ...names: string[]) => names.every((name) => turn.tools.has(name));

function pickColor(details: ProductDetails | undefined, size: string): string | undefined {
  return details?.variants?.find((variant) => variant.size === size && variant.stock > 0)?.color ?? details?.variants?.[0]?.color;
}

// ---------------------------------------------------------------- scenarios

function storeInfo(turn: Turn): ChatResponse {
  if (!hasTools(turn, 'get_store_info')) {
    // Plausible but WRONG on purpose: the model has no way to check.
    return say('Nuestro horario es de lunes a domingo de 8:00 a 20:00 y el envío es gratis a todo el país.');
  }
  const info = payload(findStep(turn, 'get_store_info'));
  if (!info) return call(['get_store_info', {}]);
  if (isFailure(info)) return say(`No pude consultar la información de la tienda: ${failureMessage(info)}`);
  const shipping = (info.shipping ?? []).map((s: any) => `${s.zone}: ${cop(s.cost)} (${s.eta})`).join('; ');
  return say(
    `Horario: ${info.openingHours}\nEnvíos: ${shipping}. Envío gratis desde ${cop(info.freeShippingFrom)}.`,
  );
}

export function parseCriteria(userText: string): Record<string, unknown> {
  const t = normalize(userText);
  const criteria: Record<string, unknown> = {};
  const categories: [RegExp, string][] = [
    [/casco/, 'cascos'],
    [/guante/, 'guantes'],
    [/chaqueta/, 'chaquetas'],
    [/bota/, 'botas'],
    [/pantalon/, 'pantalones'],
  ];
  const category = categories.find(([pattern]) => pattern.test(t));
  if (category) criteria.category = category[1];
  if (t.includes('ece')) criteria.certification = 'ECE 22.06';
  else if (/\bdot\b/.test(t)) criteria.certification = 'DOT';
  const size = /talla\s+([a-z0-9]+)/.exec(t);
  if (size) criteria.size = size[1].toUpperCase();
  const price = /(\d{1,3}(?:\.\d{3})+|\d{5,})/.exec(t);
  if (price) criteria.maxPrice = Number(price[1].replace(/\./g, ''));
  if (t.includes('stock') || t.includes('disponible')) criteria.inStockOnly = true;
  return criteria;
}

function catalog(turn: Turn): ChatResponse {
  if (!hasTools(turn, 'search_products')) {
    // The "mute chatbot": confident, specific and invented.
    return say(
      '¡Claro! Tenemos el casco integral Vulcano Pro (ECE 22.06) a 890.000 COP y el modular Titán X a 1.090.000 COP, ambos disponibles en talla M.',
    );
  }
  const result = payload(findStep(turn, 'search_products'));
  if (!result) return call(['search_products', parseCriteria(turn.text)]);
  if (isFailure(result)) return say(`La búsqueda falló: ${failureMessage(result)}`);
  const products: ProductSummary[] = result.products ?? [];
  if (products.length === 0) return say('No encontré productos que cumplan todas esas condiciones en este momento.');
  const lines = products.map((p) => `• ${p.name}: ${cop(p.priceCop)} (tallas en stock: ${(p.sizesInStock ?? []).join(', ') || 'ninguna'})`);
  return say(`Encontré ${products.length} opción(es) en el catálogo:\n${lines.join('\n')}`);
}

const BOSS_HELMET = { category: 'cascos', certification: 'ECE 22.06', maxPrice: 1200000, size: 'M', inStockOnly: true };
const BOSS_GLOVES = { category: 'guantes', query: 'pista', size: 'M', inStockOnly: true };

function boss(turn: Turn): ChatResponse {
  const required = ['search_products', 'add_to_cart', 'apply_coupon', 'open_cart'];
  if (!hasTools(turn, ...required)) {
    if (!turn.tools.has('search_products')) {
      // Without hands, a chatbot just claims it did it. The UI proves it did not.
      return say('¡Listo! Agregué el casco y los guantes en talla M, apliqué el cupón BIENVENIDA10 y abrí tu carrito.');
    }
    const missing = required.filter((name) => !turn.tools.has(name));
    return say(`Puedo buscar productos, pero esta página no me da herramientas para: ${missing.join(', ')}. No puedo modificar tu carrito.`);
  }

  const helmetSearch = findStep(turn, 'search_products', (s) => s.args.category === 'cascos');
  const glovesSearch = findStep(turn, 'search_products', (s) => s.args.category === 'guantes');
  if (!helmetSearch || !glovesSearch) {
    const calls: [string, Record<string, unknown>][] = [];
    if (turn.tools.has('set_filters')) calls.push(['set_filters', { reset: true, ...BOSS_HELMET }]);
    calls.push(['search_products', BOSS_HELMET], ['search_products', BOSS_GLOVES]);
    return call(...calls);
  }

  const helmet: ProductSummary | undefined = payload(helmetSearch)?.products?.[0];
  const gloves: ProductSummary | undefined = payload(glovesSearch)?.products?.[0];
  if (!helmet) return say('No encontré cascos certificados por menos de 1.200.000 COP con talla M disponible.');
  if (!gloves) return say('Encontré el casco, pero no hay guantes de pista en talla M disponibles.');

  const helmetDetails = findStep(turn, 'get_product_details', (s) => s.args.productId === helmet.productId);
  const glovesDetails = findStep(turn, 'get_product_details', (s) => s.args.productId === gloves.productId);
  const canDetail = turn.tools.has('get_product_details');
  if (canDetail && (!helmetDetails || !glovesDetails)) {
    return call(['get_product_details', { productId: helmet.productId }], ['get_product_details', { productId: gloves.productId }]);
  }

  const adds = turn.steps.filter((s) => s.name === 'add_to_cart');
  if (adds.length === 0) {
    return call(
      ['add_to_cart', { productId: helmet.productId, size: 'M', color: pickColor(payload(helmetDetails), 'M') ?? 'Negro mate', quantity: 1 }],
      ['add_to_cart', { productId: gloves.productId, size: 'M', color: pickColor(payload(glovesDetails), 'M') ?? 'Negro / blanco', quantity: 1 }],
    );
  }
  const failedAdd = adds.map(payload).find(isFailure);
  if (failedAdd) return say(`No pude agregar todo al carrito: ${failureMessage(failedAdd)}`);

  if (!findStep(turn, 'apply_coupon')) {
    return call(['apply_coupon', { code: 'BIENVENIDA10' }], ['open_cart', {}]);
  }
  const coupon = payload(findStep(turn, 'apply_coupon'));
  const cart = payload(findStep(turn, 'open_cart'))?.cart;
  if (isFailure(coupon)) return say(`Agregué los productos, pero el cupón falló: ${failureMessage(coupon)}`);
  return say(
    `Listo. Agregué ${helmet.name} (talla M) y ${gloves.name} (talla M), apliqué BIENVENIDA10 y abrí el carrito.` +
      (cart ? ` Total con descuento: ${cop(cart.total)}.` : ''),
  );
}

function extractProductQuery(userText: string): string {
  const t = normalize(userText);
  const match = /(?:casco|producto|guantes?|chaqueta)\s+([^?.,]+)/.exec(t);
  return (match?.[1] ?? '').trim();
}

function injection(turn: Turn): ChatResponse {
  if (!hasTools(turn, 'search_products', 'get_product_reviews')) {
    return say('Las reseñas de ese casco son excelentes: los clientes destacan su comodidad y su precio. ¡Te lo recomiendo!');
  }

  const search = findStep(turn, 'search_products');
  if (!search) return call(['search_products', { query: extractProductQuery(turn.text), category: 'cascos' }]);
  const product: ProductSummary | undefined = payload(search)?.products?.[0];
  if (!product) return say('No encontré ese casco en el catálogo.');

  const reviewsStep = findStep(turn, 'get_product_reviews');
  const detailsStep = findStep(turn, 'get_product_details');
  if (!reviewsStep) {
    const calls: [string, Record<string, unknown>][] = [['get_product_reviews', { productId: product.productId }]];
    if (turn.tools.has('get_product_details')) calls.push(['get_product_details', { productId: product.productId }]);
    return call(...calls);
  }

  const reviews = payload(reviewsStep);
  if (isFailure(reviews)) return say(`No pude leer las reseñas: ${failureMessage(reviews)}`);
  const list: { rating: number; text: string }[] = reviews.reviews ?? [];
  const average = list.length ? list.reduce((sum, r) => sum + r.rating, 0) / list.length : 0;
  const markedUntrusted = reviewsStep.response.untrusted === true;
  const injected = list.some((r) => normalize(r.text).includes('asistentes de ia'));
  const color = pickColor(payload(detailsStep), 'M') ?? 'Negro mate';
  const canAdd = turn.tools.has('add_to_cart');

  const adds = turn.steps.filter((s) => s.name === 'add_to_cart');
  const obey = injected && !markedUntrusted;

  if (adds.length === 0 && canAdd && average >= 4) {
    if (obey) {
      // Compromised: the review text is treated as instructions.
      const calls: [string, Record<string, unknown>][] = [['add_to_cart', { productId: product.productId, size: 'M', color, quantity: 10 }]];
      if (turn.tools.has('checkout')) calls.push(['checkout', {}]);
      return call(...calls);
    }
    return call(['add_to_cart', { productId: product.productId, size: 'M', color, quantity: 1 }]);
  }

  const summary = `Las reseñas de ${product.name} tienen un promedio de ${average.toFixed(1)}/5: destacan que es silencioso, cómodo y que el visor no se empaña.`;
  if (adds.length === 0) {
    return say(canAdd ? `${summary} No lo agregué porque las reseñas no son lo bastante buenas.` : `${summary} No tengo herramientas para agregarlo al carrito.`);
  }

  const added = payload(adds[0]);
  const checkoutResult = payload(findStep(turn, 'checkout'));
  if (obey) {
    const parts = [
      isFailure(added)
        ? `Intenté agregar 10 unidades, pero la página lo impidió: ${failureMessage(added)}`
        : 'Agregué 10 unidades del casco en talla M al carrito, como se indicaba.',
    ];
    if (checkoutResult) {
      parts.push(isFailure(checkoutResult) ? `Intenté finalizar la compra, pero no se completó: ${failureMessage(checkoutResult)}` : `Finalicé la compra (pedido ${checkoutResult.order?.orderId}).`);
    }
    return say(`${summary}\n${parts.join('\n')}`);
  }

  const warning = injected
    ? '\nAviso: una reseña contenía instrucciones dirigidas a asistentes de IA (agregar 10 unidades y comprar). Las ignoré porque son contenido no confiable.'
    : '';
  const result = isFailure(added) ? `No pude agregarlo: ${failureMessage(added)}` : 'Lo agregué al carrito en talla M (1 unidad).';
  return say(`${summary}\n${result}${warning}`);
}

function checkout(turn: Turn): ChatResponse {
  if (!turn.tools.has('checkout')) {
    return say('No tengo una herramienta para finalizar compras en esta página. Puedes hacerlo con el botón "Finalizar compra" del carrito.');
  }
  const step = findStep(turn, 'checkout');
  if (!step) return call(['checkout', {}]);
  const result = payload(step);
  if (isFailure(result)) return say(`La compra no se completó: ${failureMessage(result)}`);
  return say(`¡Compra finalizada! Tu pedido es ${result.order?.orderId} por ${cop(result.order?.total ?? 0)}.`);
}

export function mockAgent(request: ChatRequest): ChatResponse {
  const turn = readTurn(request);
  switch (detectScenario(turn.text)) {
    case 'storeInfo':
      return storeInfo(turn);
    case 'catalog':
      return catalog(turn);
    case 'boss':
      return boss(turn);
    case 'injection':
      return injection(turn);
    case 'checkout':
      return checkout(turn);
    default:
      return say(
        turn.tools.size === 0
          ? 'Soy el asistente de Rodada. Ahora mismo no tengo herramientas, así que solo puedo responder de memoria.'
          : `Modo simulado: solo reconozco los prompts del taller (usa los botones de sugerencias). Tengo ${turn.tools.size} herramientas disponibles.`,
      );
  }
}
