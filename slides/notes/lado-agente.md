# El otro lado de la API

**Tiempo:** ~45 s · **Reloj:** 8:45 → 9:30

**Guion:**
Tres grupos. [señalar cada columna]
**El agente usa** `getTools()` para listar lo registrado y `executeTool()` para ejecutar. Así funciona nuestro panel de chat.
**Eventos**: `toolchange` cuando cambia la lista, `toolactivated` cuando el agente usa una, `toolcancel` cuando se cancela. La tienda escucha `toolactivated` para iluminar lo que toca el agente: lo van a ver brillar.
**Anotaciones**: `readOnlyHint` (solo lee), `untrustedContentHint` (devuelve texto de terceros) y `consequentialHint` (tiene consecuencias, como pagar).

**Ojo:** son *hints*. Pistas para el agente, no controles de seguridad. Lo retomamos en el Acto 4.

**Ruta corta:** se puede saltar; el Acto 2 introduce `readOnlyHint` y el Acto 4 las otras dos.

**Transición:** "Antes de seguir, seamos honestos con el estado de todo esto."
