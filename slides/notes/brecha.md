# La brecha

**Tiempo:** ~45 s · **Reloj:** 5:00 → 5:45

**Guion:**
Nuestra app web ya tiene todo lo que el agente necesita. [señalar cada tarjeta]
**El estado**: el catálogo, los filtros, el carrito ya están en memoria.
**La sesión**: el usuario ya inició sesión, sus cookies ya están ahí.
**Las acciones**: el botón "Agregar al carrito" ya llama a `addToCart()`. [pausa]
Si quisiéramos un servidor MCP para la tienda, tendríamos que duplicar lógica, rehacer la autenticación y sincronizar estado que ya existe en la pestaña.
¿Por qué construir otra API solo para el agente?

**Transición:** [avanzar sin decir nada y dejar que lean la pregunta]
