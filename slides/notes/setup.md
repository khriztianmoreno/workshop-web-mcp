# Verificación del entorno

**Tiempo:** ~1 min · **Reloj:** 7:30 → 8:30

**Guion:**
Esto ya debería estar hecho desde el prework. [señalar línea por línea, rápido]
Node 22.12 o superior, su rama desde `acto-1`, `npm ci`, copiar el `.env` (la clave de Gemini es opcional), `npm run check` y `npm run dev`. Abren `http://localhost:5173`. [pausa]
La guía paso a paso está en la URL de la pantalla: ábranla al lado del editor, con un acto por página y casillas para marcar su avance. ¿Quién tiene la tienda abierta? Manos arriba. [contar a ojo; si son menos de la mitad, no esperes aquí: arranca el Acto 1 y camina el salón ayudando]

**Antes del evento:** completa guía, repo, proxy y Wi-Fi en `slides/src/talk.ts`; se proyectan tal cual.

**Problemas típicos:**
- `EBADENGINE` → Node viejo.
- Insignia "Proxy desconectado" → revisar la terminal `[proxy]` o usar `PORT=8788`.
- `document.modelContext` undefined → abrieron por IP; usar `localhost`.
- Sin clave → `AGENT_BASE_URL=<proxy del instructor>` en `.env`.

**Transición:** "Listo. A rodar."
