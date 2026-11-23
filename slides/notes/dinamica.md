# Reglas del juego

**Tiempo:** ~1 min · **Reloj:** 13:00 → 14:00

**Guion:**
Regla de oro: **cada acto termina a tiempo**. [pausa]
1. Cada tag (`acto-1` … `acto-4`, `final`) es el punto de partida de un acto y, a la vez, la solución del anterior.
2. ¿Te quedaste atrás? Guarda tu avance y salta: `git switch -c mi-acto-N acto-N`. [señalar el bloque]
3. Las guías están en `docs/`, una por acto, con la solución plegada al final.
4. ¿Atascado? Levanten la mano o trabajen con su vecino. Yo camino por el salón.
5. ¿Sin clave de Gemini o sin Wi-Fi? Modo simulado: `npm run server:mock`, o dejen `GEMINI_API_KEY` vacía. El taller funciona igual.

**Tip:** para validar su solución con las pruebas reales del acto: `git checkout acto-2 -- src/webmcp/tools/acto-1.test.ts && npm test`.

**Dilo al cierre de cada acto:** "Quien no terminó, salta al tag siguiente."

**Transición:** "Revisemos que todos tengan el entorno listo."
