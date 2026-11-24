# Anatomía + registerTool

**Tiempo:** ~45 s · **Reloj:** 4:15 → 5:00

**Guion:**
Así se ve una herramienta: una función normal, con instrucciones para el modelo. Tiene cinco partes. [señalar la columna derecha mientras recorres el código]
- `name`: único, en snake_case y sin tildes.
- `description`: **para el modelo, no para humanos**. Es lo que más influye en que la elija bien.
- `inputSchema`: JSON Schema de los datos que recibe.
- `execute()`: su código de siempre.
- `annotations`: las pistas que acabamos de ver, como `readOnlyHint`. [pausa]
Se registra con `document.modelContext.registerTool(tool, { signal })`. Y ojo con esto: **no existe `unregisterTool()`**. Para quitarla, abortan la señal. Registrar dos veces el mismo nombre lanza un error.

**Por qué importa (lo van a escribir en 6 minutos):** React StrictMode monta, limpia y vuelve a montar. Sin `controller.abort()` en la limpieza, el segundo montaje revienta con "already registered".

**Dato del repo:** las descripciones van en inglés porque son contrato técnico; el `title` visible en el panel va en español. El segundo argumento acepta `{ signal, exposedTo }`; `exposedTo` (otros orígenes que pueden ver la herramienta) es opcional y hoy no lo usamos.

**Si quieres una anécdota (Acto 3, del ensayo):** sin `inputSchema` ni `description`, el modelo inventa los nombres y valores de los argumentos: mandó `{"couponCode":"BIENVENIDA"}`. Y "cupón de bienvenida" llega a `BIENVENIDA10` solo porque la descripción de `apply_coupon` da ese ejemplo. La descripción es la interfaz.

**Transición:** "Eso hace la página. ¿Y el agente qué hace con eso?"
