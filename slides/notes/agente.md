# Agente y MCP

**Tiempo:** ~50 s · **Reloj:** 1:40 → 2:30

**Guion:**
Un agente es tres cosas: un **modelo** que decide, **herramientas** (funciones con nombre y esquema) y un **ciclo**: pide una herramienta, alguien la ejecuta, el resultado vuelve al modelo, y repite. [pausa]
El modelo nunca ejecuta nada: solo pide. Quien ejecuta es el código que corre el ciclo.
[señalar la franja de abajo] ¿Y de dónde salen las herramientas? Lo más popular hoy es **MCP**: un protocolo estándar. Un cliente pregunta `tools/list` y llama `tools/call` a un **servidor MCP**, un proceso aparte con su propia autenticación.

**Si el público ya lo sabe:** "Esto es function calling y MCP; lo interesante es *dónde* viven las herramientas." Y avanza.

**Dato del repo:** nuestro ciclo vive en `src/agent/agent-loop.ts` y corta en 8 pasos (`MAX_AGENT_STEPS`).

**Callback para el Acto 3 (no lo digas ahora):** en el ensayo, una herramienta que lanzaba una excepción hacía que el modelo reintentara a ciegas hasta chocar con el tope de 8 pasos. Con `{ ok: false, code, message }` se recupera: ante un `add_to_cart` sin stock, ofreció alternativas.

**Transición:** "Ahora piensen en una tienda web…"
