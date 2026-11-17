# WebMCP · Hoja de referencia

Basada en el borrador del W3C WebML CG (13 nov 2026). Solo herramientas: `provideContext`, `clearContext` y los recursos fueron eliminados.

## Detección

```js
const modelContext = document.modelContext ?? navigator.modelContext; // navigator.* obsoleto desde Chrome 150
if (!modelContext) { /* degrada con elegancia */ }
```

Requiere contexto seguro (HTTPS o `localhost`). Flag local: `chrome://flags/#enable-webmcp-testing`. Origin trial: Chrome 149–156.

## Registrar y desregistrar

```js
const controller = new AbortController();

await modelContext.registerTool(
  {
    name: 'add_to_cart',                 // único; letras, dígitos, _ - .
    title: 'Agregar al carrito',         // opcional, para humanos
    description: 'Adds a product variant to the cart…', // para el modelo
    inputSchema: {                       // JSON Schema (opcional)
      type: 'object',
      properties: { productId: { type: 'string' }, quantity: { type: 'integer', minimum: 1 } },
      required: ['productId'],
    },
    outputSchema: { /* opcional */ },
    annotations: {                       // todas boolean, por defecto false
      readOnlyHint: false,
      untrustedContentHint: false,
      consequentialHint: false,
      debugging: false,
    },
    async execute(input, { signal }) {   // devuelve cualquier valor serializable
      return { ok: true };
    },
  },
  { signal: controller.signal, exposedTo: ['https://agent.example'] }, // ambos opcionales
);

controller.abort(); // desregistra (NO existe unregisterTool)
```

Registrar dos veces el mismo `name` **lanza un error**.

## En React (StrictMode-safe)

```ts
useEffect(() => {
  const mc = document.modelContext ?? navigator.modelContext;
  if (!mc) return;
  const controller = new AbortController();
  for (const tool of tools) mc.registerTool(tool, { signal: controller.signal }).catch(console.error);
  return () => controller.abort();
}, [tools]);
```

## Listar y ejecutar (agentes dentro de la página)

```js
const tools = await modelContext.getTools();                    // RegisteredTool[]
const mine  = await modelContext.getTools({ fromOrigins: [location.origin] });
const text  = await modelContext.executeTool(tools[0], { productId: 'x' }, { signal }); // Promise<string>
```

## Eventos

| Evento | Cuándo | Propiedad |
| --- | --- | --- |
| `toolchange` | Se registró o se desregistró una herramienta | — |
| `toolactivated` | Un agente empezó a ejecutar una herramienta | `event.toolName` |
| `toolcancel` | Se canceló una ejecución | `event.toolName` |

```js
modelContext.addEventListener('toolactivated', (e) => highlight(e.toolName));
```

## Anotaciones: cuándo usar cada una

| Anotación | Úsala si… | Ejemplo |
| --- | --- | --- |
| `readOnlyHint` | No cambia ningún estado | `search_products`, `get_cart` |
| `untrustedContentHint` | La salida incluye contenido de terceros | `get_product_reviews`, leer correos |
| `consequentialHint` | Tiene efectos reales difíciles de deshacer | `checkout`, enviar, borrar |
| `debugging` | Solo existe para depurar | `dump_state` |

Las anotaciones son **pistas** para el agente. La garantía es que la página valide: límites, permisos y confirmaciones propias.

## Diseño de herramientas en una línea cada uno

- Nombres como verbos en `snake_case`.
- Descripciones para el modelo: qué hace, qué devuelve, qué **no** hace.
- `enum` siempre que haya un conjunto cerrado de valores.
- Errores recuperables: `{ ok: false, code, message, details }`.
- Reutiliza las acciones de la UI: una sola fuente de verdad.
- Salidas pequeñas, con ids reutilizables.
