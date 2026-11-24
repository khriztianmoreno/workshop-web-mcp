# La misión y las reglas

**Tiempo:** ~50 s · **Reloj:** 6:40 → 7:30

**Guion:**
Cinco actos, 90 minutos. [recorrer la fila rápido]
Incidente: su primera herramienta. Ojos: herramientas de lectura. Manos: herramientas de escritura. Sabotaje: alguien ataca a su agente. Cierre: producción. [pausa]
Regla de oro: **cada acto termina a tiempo**. Debajo de cada acto está su tag de git, que es el punto de partida del acto y la solución del anterior. ¿Te quedaste atrás? Guardas tu avance y saltas con `git switch -c mi-acto-N acto-N`. [señalar el bloque]
Las guías están en `docs/` y cada una termina con "Solución completa del Acto N", con todos los archivos del acto. Si se atascan, levanten la mano o trabajen con su vecino. Sin clave propia: el proxy del instructor. Sin clave ni Wi-Fi: Modo simulado, el taller funciona igual con los botones de sugerencias.

**Tip:** para validar su solución con las pruebas reales del acto: `git checkout acto-2 -- src/webmcp/tools/acto-1.test.ts && npm test`.

**Dilo al cierre de cada acto:** "Quien no terminó, salta al tag siguiente."

**Transición:** "Revisemos que todos tengan el entorno listo."
