# Qué es WebMCP

**Tiempo:** ~45 s · **Reloj:** 2:45 → 3:30

**Guion:**
WebMCP es eso: que la página declare sus acciones una sola vez, usando el estado y las funciones que ya tiene. Tres actores. [recorrer de izquierda a derecha]
**La página** declara sus herramientas, como `search_products`: funciones con nombre, descripción y los datos que piden. Por dentro llaman a las mismas funciones que usan los botones.
**El navegador** las guarda en `document.modelContext`.
**Su asistente**, el panel de chat dentro de la página, las lista y las llama como funciones. [pausa]
[señalar la franja de abajo] ¿Conocen MCP? Es la misma idea: herramientas que un modelo puede llamar. La diferencia es quién las ofrece. En MCP, un servidor aparte. En WebMCP, la página misma, en la pestaña, con la sesión del usuario y con el usuario presente, viendo lo que pasa.

**Si el público no conoce MCP:** "Un agente es un modelo que, en vez de solo responder, pide usar herramientas, y alguien las ejecuta por él. MCP es la forma estándar de ofrecerle esas herramientas." Y avanza.

**Dato del repo:** nuestro asistente vive en `src/agent/agent-loop.ts`: pide herramientas, las ejecuta y le devuelve el resultado al modelo, con un tope de 8 pasos (`MAX_AGENT_STEPS`). El modelo nunca ejecuta nada: solo pide.

**Callback para el Acto 3 (no lo digas ahora):** en el ensayo, una herramienta que lanzaba una excepción hacía que el modelo reintentara a ciegas hasta chocar con el tope de 8 pasos. Con `{ ok: false, code, message }` se recupera: ante un `add_to_cart` sin stock, ofreció alternativas.

**Transición:** "¿Y qué gana su proyecto con esto?"
