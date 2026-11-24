# Verificación del entorno

**Tiempo:** ~1 min · **Reloj:** 7:30 → 8:30

**Guion:**
Esto ya debería estar hecho desde el prework. [señalar línea por línea, rápido]
Node 22.12 o superior, su rama desde `acto-1`, `npm ci`, copiar el `.env`, `npm run check` y `npm run dev`. Abren `http://localhost:5173`. [pausa]
En el `.env` hay tres caminos: su propia `GEMINI_API_KEY`, el proxy del instructor en `AGENT_BASE_URL` (la URL completa se la paso por el chat del taller), o nada, y entonces queda el Modo simulado.
La guía paso a paso está en la URL de la pantalla: ábranla al lado del editor, con un acto por página y casillas para marcar su avance. ¿Quién tiene la tienda abierta? Manos arriba. [contar a ojo; si son menos de la mitad, no esperes aquí: arranca el Acto 1 y camina el salón ayudando]

**Antes del evento:** completa el Wi-Fi en `slides/src/talk.ts` (guía, repo y proxy ya están); se proyecta tal cual. El proxy aparece **sin token**: `workshop-webmcp.khriztianmoreno.cloud/t/<token>`.

**El token:** nunca lo proyectes ni lo dictes. La URL completa (`https://workshop-webmcp.khriztianmoreno.cloud/t/<token>`) va solo por el chat del taller, y el token se rota al terminar el evento.

**Problemas típicos:**
- `EBADENGINE` → Node viejo.
- Insignia "Proxy desconectado" → revisar la terminal `[proxy]` o usar `PORT=8788`.
- `document.modelContext` undefined → abrieron por IP; usar `localhost`.
- Insignia "Modo simulado" cuando esperaban Gemini → casi siempre olvidaron `cp env.example .env`, o editaron `.env` sin reiniciar `npm run dev`. El Modo simulado solo entiende los botones de sugerencias.
- Sin clave → `AGENT_BASE_URL=https://workshop-webmcp.khriztianmoreno.cloud/t/<token>` en `.env` y reiniciar `npm run dev`. Error 401 → token mal copiado.

**Transición:** "Listo. A rodar."
