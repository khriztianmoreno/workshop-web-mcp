# Qué es WebMCP

**Tiempo:** ~1 min · **Reloj:** 6:00 → 7:00

**Guion:**
Tres actores. [recorrer de izquierda a derecha]
**La página** registra lo que sabe hacer. Por ejemplo, `search_products`. No es scraping ni un robot haciendo clic: son funciones con nombre, descripción y esquema.
**El navegador** las guarda en `document.modelContext`.
**El agente**, el del navegador o uno dentro de la página como nuestro panel, las lista y las llama como funciones. [pausa]
Y lo más importante: todo corre **en la pestaña**, con la sesión del usuario y la misma lógica de la UI. No hay un segundo backend.

**Transición:** "¿Qué hay dentro de una herramienta?"
