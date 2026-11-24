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

**Dato del repo:** las descripciones van en inglés porque son contrato técnico; el `title` visible en el panel va en español. El segundo argumento acepta `{ signal, exposedTo }`; `exposedTo` (otros orígenes que pueden ver la herramienta) es opcional y hoy no lo usamos.

**Si quieres una anécdota (Acto 3, del ensayo):** sin `inputSchema` ni `description`, el modelo inventa los nombres y valores de los argumentos: mandó `{"couponCode":"BIENVENIDA"}`. Y "cupón de bienvenida" llega a `BIENVENIDA10` solo porque la descripción de `apply_coupon` da ese ejemplo. La descripción es la interfaz.

**Transición:** "Eso hace la página. ¿Qué ve el agente?"
