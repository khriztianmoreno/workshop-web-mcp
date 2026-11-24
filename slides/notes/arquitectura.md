# Arquitectura del taller

**Tiempo:** ~40 s · **Reloj:** 6:00 → 6:40

**Guion:**
Cuatro piezas, de izquierda a derecha.
1. **La tienda** (`src/store`): los botones y las herramientas usan las mismas acciones. Una sola fuente de verdad.
2. **El polyfill** (`src/webmcp`): instala `document.modelContext` con la forma de la especificación; si Chrome trae la API nativa, la usa.
3. **El panel de chat** (`src/agent`): el ciclo del agente corre en el navegador. Máximo 8 pasos.
4. **El proxy** (`server/`): Hono en el 8787, guarda la clave de Gemini. Quien no tenga clave puede apuntar al proxy del instructor; sin ninguna de las dos entra en **Modo simulado**, un agente determinista que solo reconoce los prompts de los botones de sugerencias. [pausa]
El proxy no toca la página y la página nunca ve la clave.

**Dato del repo:** `npm run dev` levanta web (Vite, 5173) y proxy (8787). Con `AGENT_BASE_URL` en `.env`, Vite reenvía `/api` al proxy del instructor en lugar del local. La insignia del panel dice qué modo está activo ("Gemini · …" o "Modo simulado").

**Transición:** "Esta es la misión."
