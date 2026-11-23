# registerTool y AbortSignal

**Tiempo:** ~1 min · **Reloj:** 7:45 → 8:45

**Guion:**
Esto lo pueden pegar en la consola de la tienda. [señalar el bloque]
`registerTool` recibe la herramienta y, como segundo argumento, un `signal`.
Y abajo, lo más importante de toda la slide: **no existe `unregisterTool()`**. Para quitar una herramienta, abortas la señal. [pausa]
Segunda regla: los nombres son únicos. Si registras dos veces `get_store_info`, la especificación lanza un error.

**Por qué importa (adelanto del Acto 1):** React StrictMode monta, limpia y vuelve a montar. Sin `controller.abort()` en la limpieza, el segundo montaje revienta con "already registered". Eso es exactamente lo que van a resolver en `useWebMcpTools`.

**Tip:** si hay tiempo, haz el experimento `say_hello` de `docs/01-acto-1-incidente.md` en vivo: el panel pasa de 0 a 1 herramienta y vuelve a 0 con `abort()`.

**Transición:** "Eso es lo que hace la página. ¿Y qué ve el agente?"
