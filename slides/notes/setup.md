# Verificación del entorno

**Tiempo:** ~1 min · **Reloj:** 14:00 → 15:00

**Guion:**
Esto ya debería estar hecho desde el prework. Si no, es ahora. [señalar línea por línea]
- Node 22.12 o superior: `node -v`.
- Crear su rama desde `acto-1`.
- `npm ci` y `cp env.example .env`. La clave de Gemini es opcional.
- `npm run check` les dice qué falta.
- `npm run dev` y abren `http://localhost:5173`. [pausa]
¿Quién tiene la tienda abierta? Manos arriba. [contar a ojo; si son menos de la mitad, da un minuto más y camina]

**Antes del evento:** completa repo, proxy y Wi-Fi en `slides/src/talk.ts`; se proyectan tal cual.

**Problemas típicos:**
- `EBADENGINE` → Node viejo.
- Insignia "Proxy desconectado" → revisar la terminal `[proxy]` o usar `PORT=8788`.
- `document.modelContext` undefined → abrieron por IP; usar `localhost`.
- Sin clave → `AGENT_BASE_URL=<proxy del instructor>` en `.env`.

**Transición:** "Listo. A rodar."
