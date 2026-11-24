# WebMCP · Hoja de referencia

Basada en el borrador del W3C WebML CG (13 nov 2026). Solo herramientas: `provideContext`, `clearContext` y los recursos fueron eliminados.

## Detección

```js
const modelContext = document.modelContext ?? navigator.modelContext; // navigator.* obsoleto desde Chrome 150
if (!modelContext) { /* degrada con elegancia */ }
```

**Cómo funciona**

- `document.modelContext` es el punto de entrada de la especificación; `navigator.modelContext` solo se mantiene como respaldo para navegadores que aún lo exponen.
- Si ninguno existe, el navegador no soporta WebMCP: no registres nada y deja que la página funcione igual para las personas.

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

**Cómo funciona**

- **`name`, `title`, `description`**: identificador para el agente, etiqueta para personas y manual para el modelo. La `description` es lo que más influye en cuándo y cómo se usa la herramienta.
- **`inputSchema`**: JSON Schema de los argumentos que el modelo debe enviar (`required`, tipos, `minimum`, `enum`). `outputSchema` describe opcionalmente la forma de la respuesta.
- **`annotations`**: pistas para el agente. `readOnlyHint` = no cambia estado; `untrustedContentHint` = la salida trae contenido de terceros; `consequentialHint` = efectos reales difíciles de deshacer; `debugging` = solo para depurar.
- **`execute(input, { signal })`**: corre en la página cuando un agente llama la herramienta; `signal` se aborta si el agente cancela esa ejecución.
- **`{ signal, exposedTo }`**: `signal` controla la vida del registro (abortarlo desregistra); `exposedTo` lista otros orígenes que pueden ver la herramienta (por defecto, solo el mismo origen).

Registrar dos veces el mismo `name` **lanza un error**.

## En React (StrictMode-safe)

```ts
useEffect(() => {
  const mc = document.modelContext ?? navigator.modelContext;
  if (!mc) return; // no WebMCP: no-op
  const controller = new AbortController(); // one per effect run
  for (const tool of tools) mc.registerTool(tool, { signal: controller.signal }).catch(console.error);
  return () => controller.abort(); // cleanup unregisters every tool at once
}, [tools]); // `tools` must be a stable (module-level) array
```

**Cómo funciona**

- `useEffect` ata el registro al ciclo de vida del componente: se registra al montar y se desregistra en la limpieza.
- Un `AbortController` por ejecución del efecto; abortarlo retira todas sus herramientas, porque no existe `unregisterTool()`.
- En StrictMode React monta, limpia y vuelve a montar: gracias a la limpieza no hay nombres duplicados. La versión del taller (`src/webmcp/useWebMcpTools.ts`) además ignora los errores de registros que ya fueron abortados.
- `[tools]` compara por referencia: define el arreglo fuera del componente o cada render volverá a registrar todo.

## Listar y ejecutar (agentes dentro de la página)

```js
const tools = await modelContext.getTools();                    // RegisteredTool[]
const mine  = await modelContext.getTools({ fromOrigins: [location.origin] });
const text  = await modelContext.executeTool(tools[0], { productId: 'x' }, { signal }); // Promise<string>
```

**Cómo funciona**

- Esta es la mitad del **agente**, no la de la página: así es como nuestro panel descubre y ejecuta herramientas.
- `getTools()` devuelve las herramientas registradas (nombre, descripción, esquema, origen); `fromOrigins` filtra por origen.
- `executeTool(tool, input, { signal })` ejecuta la herramienta en la página y resuelve con un **string**: el resultado serializado que el agente le pasa al modelo. `signal` permite cancelar la ejecución.

## Eventos

| Evento | Cuándo | Propiedad |
| --- | --- | --- |
| `toolchange` | Se registró o se desregistró una herramienta | — |
| `toolactivated` | Un agente empezó a ejecutar una herramienta | `event.toolName` |
| `toolcancel` | Se canceló una ejecución | `event.toolName` |

```js
// Light up the UI the agent is about to touch (the workshop's "Ejecutado por agente" glow).
modelContext.addEventListener('toolactivated', (e) => highlight(e.toolName));
```

**Cómo funciona:** `modelContext` es un `EventTarget`, así que se escucha con `addEventListener`. `toolactivated` llega cuando un agente empieza a ejecutar una herramienta y trae `toolName`; es ideal para mostrarle al usuario qué está haciendo el agente o para registrar métricas. `highlight` es una función tuya.

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
