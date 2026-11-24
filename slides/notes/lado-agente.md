# Lado del agente + estado de la especificación

**Tiempo:** ~25 s · **Reloj:** 5:00 → 5:25

**Guion:**
Del otro lado, el agente hace muy poco: pregunta qué herramientas hay con `getTools()` y llama una con `executeTool()`. Así funciona nuestro panel de chat.
Y la página se entera: el evento `toolactivated` avisa cuando el agente usó una herramienta, y la tienda lo usa para iluminar lo que tocó. [pausa]
[señalar la franja de abajo, sin leerla entera] Seamos honestos: esto es experimental. Es un borrador del grupo comunitario WebML del W3C (13 de noviembre de 2026), no un estándar. Hay origin trial de Chrome 149 a 156, y si ven `navigator.modelContext` en código viejo, está obsoleto desde Chrome 150. Hoy no necesitan la flag (`chrome://flags/#enable-webmcp-testing`): el repo trae un polyfill.

**Si preguntan por más eventos:** también existen `toolchange` (cambió la lista) y `toolcancel` (se canceló una ejecución). Están en la guía.

**Dato del repo:** la consola muestra `[webmcp] mode: polyfill`, `native` o `native-wrapped` (`src/webmcp/polyfill.ts`). Solo funciona en contextos seguros: `https://` o `localhost`. `provideContext` y los recursos se eliminaron de la especificación.

**Transición:** "Ahora, si el agente lee lo que hay en la página… ¿qué pasa si alguien le escribe órdenes ahí?"
