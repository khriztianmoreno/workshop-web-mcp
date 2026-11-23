# Arquitectura del taller

**Tiempo:** ~45 s · **Reloj:** 11:30 → 12:15

**Guion:**
Cuatro piezas, de izquierda a derecha.
1. **La tienda Rodada** (`src/store`): React. Los botones y las herramientas usan las mismas acciones. Una sola fuente de verdad.
2. **El polyfill** (`src/webmcp`): instala `document.modelContext` con la forma de la especificación. Si Chrome trae la API nativa, la usa.
3. **El panel de chat** (`src/agent`): corre el ciclo del agente **en el navegador**. `getTools()`, llama al modelo, `executeTool()`, repite. Máximo 8 pasos.
4. **El proxy** (`server/`): Hono en el puerto 8787. Llama a Gemini una vez por solicitud y guarda la clave. Sin clave, entra en **Modo simulado**: un agente determinista que reconoce los prompts del taller. [pausa]
El proxy no toca la página y la página nunca ve la clave.

**Dato del repo:** `npm run dev` levanta dos procesos: web (Vite, 5173) y proxy (8787). La insignia del panel dice qué modo está activo.

**Transición:** "Con eso claro, esta es la misión."
