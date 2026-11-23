# Anatomía de una herramienta

**Tiempo:** ~45 s · **Reloj:** 7:00 → 7:45

**Guion:**
Cinco partes. [recorrer las tarjetas]
- `name`: el identificador, en snake_case y sin tildes. `get_store_info`.
- `description`: **para el modelo, no para humanos**. Di qué devuelve y cuándo usarla. Es la parte que más impacto tiene en si el modelo la elige bien.
- `inputSchema`: JSON Schema de lo que recibe. Un `enum` evita que el modelo invente categorías.
- `execute()`: la función. Aquí llamas a tu código de siempre.
- `annotations`: pistas para el agente, como `readOnlyHint`.

**Dato del repo:** las descripciones van en inglés porque son contrato técnico; el `title` visible en el panel va en español.

**Transición:** "Así se ve en código."
