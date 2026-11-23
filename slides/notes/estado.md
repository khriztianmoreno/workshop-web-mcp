# Estado de la especificación

**Tiempo:** ~45 s · **Reloj:** 9:30 → 10:15

**Guion:**
WebMCP es experimental. Lo que van a usar hoy sigue el borrador del W3C WebML Community Group del 13 de noviembre de 2026.
- La API vive en `document.modelContext`. Si ven código viejo con `navigator.modelContext`: está obsoleto desde Chrome 150.
- Hay origin trial de Chrome 149 a 156. En local se activa con `chrome://flags/#enable-webmcp-testing`.
- `provideContext` y los recursos se eliminaron: solo quedan herramientas. [pausa]
Y la buena noticia: hoy **no necesitan la flag**. El repo trae un polyfill con la forma de la especificación.

**Dato del repo:** la consola muestra `[webmcp] mode: polyfill`, `native` o `native-wrapped` según el navegador (`src/webmcp/polyfill.ts`). Solo funciona en contextos seguros: `https://` o `localhost`.

**Transición:** "Entonces, ¿WebMCP reemplaza a MCP? No."
