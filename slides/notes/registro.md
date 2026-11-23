# Anatomía + registerTool

**Tiempo:** ~50 s · **Reloj:** 3:40 → 4:30

**Guion:**
Una herramienta tiene cinco partes. [señalar la columna derecha mientras recorres el código]
- `name`: único, en snake_case y sin tildes.
- `description`: **para el modelo, no para humanos**. Es lo que más influye en que la elija bien.
- `inputSchema`: JSON Schema de lo que recibe.
- `execute()`: tu código de siempre.
- `annotations`: pistas como `readOnlyHint`. [pausa]
Y lo más importante de la slide: **no existe `unregisterTool()`**. Pasas un `signal` y, para quitarla, abortas el controller. Registrar dos veces el mismo nombre lanza un error.

**Por qué importa (lo van a escribir en 6 minutos):** React StrictMode monta, limpia y vuelve a montar. Sin `controller.abort()` en la limpieza, el segundo montaje revienta con "already registered".

**Dato del repo:** las descripciones van en inglés porque son contrato técnico; el `title` visible en el panel va en español.

**Transición:** "Eso hace la página. ¿Qué ve el agente?"
