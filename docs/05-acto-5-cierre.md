# Acto 5 · Cierre

| Duración | Tag |
| --- | --- |
| **5 minutos** | `final` |

**Objetivo:** ubicar WebMCP frente a MCP de servidor y llevarte una lista corta para producción.

---

## Lo que construiste

```text
Acto 1  document.modelContext + registerTool con AbortSignal (StrictMode-safe)
Acto 2  Ojos: 5 herramientas de lectura, readOnlyHint, una sola fuente de verdad
Acto 3  Manos: herramientas de escritura que reutilizan las acciones de la UI
Acto 4  Defensa en profundidad: untrustedContentHint, límites en la página, consequentialHint + confirmación propia
```

## WebMCP vs. MCP de servidor

| | WebMCP (`document.modelContext`) | MCP de servidor |
| --- | --- | --- |
| Dónde corre la herramienta | En la página, en el navegador del usuario | En un proceso o servicio remoto |
| Sesión y permisos | Los del usuario en esa pestaña (cookies, estado de la UI) | Credenciales propias del servidor (OAuth, tokens) |
| Ciclo de vida | Vive mientras la página/componente esté montado (`AbortSignal`) | Vive mientras el servidor esté arriba |
| Quién lo usa | El agente del navegador o un agente dentro de la página | Clientes MCP (IDE, escritorio, agentes de backend) |
| Contexto visual | El usuario **ve** lo que hace el agente | Normalmente invisible para el usuario |
| Ideal para | Flujos de UI: buscar, filtrar, llenar, revisar antes de confirmar | Integraciones de datos y automatización sin interfaz |

No compiten: muchas empresas tendrán ambas. WebMCP brilla cuando **el humano está presente** y la tarea ocurre en la interfaz.

## Accesibilidad y semántica

- Una herramienta bien descrita se parece mucho a un control accesible bien etiquetado: nombre claro, propósito explícito, estados visibles.
- WebMCP **no reemplaza** una UI accesible. Si un flujo solo funciona por agente, excluyes a quien no lo usa.
- Haz visible lo que hace el agente (aquí: brillo, insignia y `aria-live`) y respeta `prefers-reduced-motion`.
- Reutiliza las acciones de la UI: si el agente y el teclado llegan al mismo lugar, ambos caminos se prueban juntos.

## Checklist para producción

- [ ] **Origin trial** (Chrome 149–156): registra tu origen y agrega el token como `<meta http-equiv="origin-trial" content="…">` o cabecera `Origin-Trial`. Ver `index.html`.
- [ ] **Detección de la API**: `document.modelContext ?? navigator.modelContext`; degrada con elegancia si no existe.
- [ ] **Contexto seguro**: solo HTTPS (o `localhost`).
- [ ] **`exposedTo`**: por defecto, mismo origen. Abre herramientas a otros orígenes solo cuando lo necesites.
- [ ] **Anotaciones honestas**: `readOnlyHint` solo si de verdad no cambia nada; `untrustedContentHint` en todo contenido de terceros; `consequentialHint` en todo lo que mueva dinero, envíe mensajes o borre datos.
- [ ] **La página valida siempre**: autorización, límites y confirmaciones viven en la página o el backend, nunca solo en la descripción.
- [ ] **Observabilidad**: escucha `toolactivated` y `toolcancel`; registra nombre, duración, errores y tasa de `USER_DECLINED`. Nunca registres datos personales en claro.
- [ ] **Salidas pequeñas**: ids, números y textos cortos. Menos tokens, menos superficie de ataque.
- [ ] **Ciclo de vida**: registra herramientas donde viven sus datos (por ejemplo, `add_to_cart` solo en páginas con catálogo) y abórtalas al desmontar.
- [ ] **Pruebas**: cada `execute` es una función pura sobre tu estado; pruébala como cualquier otra (mira `src/webmcp/tools/*.test.ts`).

## Para seguir aprendiendo

- Borrador de la especificación WebMCP (W3C WebML Community Group).
- `docs/cheatsheet.md` de este repositorio.
- Experimenta: agrega `compare_products` o `remove_from_cart`, o prueba la app con `chrome://flags/#enable-webmcp-testing` y el agente nativo del navegador.

**Gracias por venir al DevFest Bogotá 2026.**
