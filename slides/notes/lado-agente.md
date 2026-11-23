# Lado del agente + estado de la especificación

**Tiempo:** ~40 s · **Reloj:** 4:30 → 5:10

**Guion:**
El agente usa `getTools()` y `executeTool()`: así funciona nuestro panel.
Hay tres eventos; el que van a ver es `toolactivated`: la tienda lo escucha para iluminar lo que toca el agente.
Y tres anotaciones: solo lee, devuelve texto ajeno, tiene consecuencias. Son **pistas, no controles**. [pausa]
[señalar la franja de abajo, sin leerla entera] Seamos honestos: es experimental. Borrador del W3C del 13 de noviembre de 2026, origin trial de Chrome 149 a 156, y si ven `navigator.modelContext` en código viejo, está obsoleto desde Chrome 150. Hoy no necesitan la flag: el repo trae un polyfill.

**Dato del repo:** la consola muestra `[webmcp] mode: polyfill`, `native` o `native-wrapped` (`src/webmcp/polyfill.ts`). Solo funciona en contextos seguros: `https://` o `localhost`. `provideContext` y los recursos se eliminaron de la especificación.

**Transición:** "¿Entonces WebMCP reemplaza a MCP? No."
