# Guía del instructor · Taller WebMCP (90 min)

DevFest Bogotá · sábado 28 de noviembre de 2026.

## Resumen de tiempos

| Hora (relativa) | Bloque | Duración | Tag en el proyector | Entregable de los asistentes |
| --- | --- | --- | --- | --- |
| 0:00 | Acto 1 · El incidente | 15 min | `acto-1` | Hook de registro + `get_store_info` |
| 0:15 | Acto 2 · Darle ojos | 25 min | `acto-2` | 5 herramientas de lectura |
| 0:40 | Acto 3 · Darle manos | 30 min | `acto-3` | 5 herramientas de escritura + prompt jefe |
| 1:10 | Acto 4 · El sabotaje | 15 min | `acto-4` | 3 defensas |
| 1:25 | Acto 5 · Cierre | 5 min | `final` | — |

Regla de oro: **cada acto termina a tiempo**. Quien no terminó, salta al tag siguiente (`git switch -c mi-acto-N acto-N`). Dilo en voz alta al cierre de cada acto.

## Checklist previa

### Una semana antes

- [ ] Enviar `docs/00-prework.md` (correo + canal del evento).
- [ ] Publicar el repositorio y verificar que los tags `acto-1`…`final` existen en el remoto.
- [ ] Crear una clave de Gemini dedicada al taller y revisar su cuota.
- [ ] Desplegar el **proxy del instructor** (ver abajo) y probar `GET /api/health`.
- [ ] Publicar la **guía en vivo** (ver "Publicar la guía en vivo") y abrirla en el celular para revisarla.

### El día anterior

- [ ] Chrome actualizado; probar con y sin `chrome://flags/#enable-webmcp-testing`.
- [ ] En tu equipo: `git switch final && npm ci && npm run typecheck && npm test && npm run build`.
- [ ] Ensayar los 5 prompts del panel en **modo simulado** y con **Gemini**.
- [ ] Clonar el repo en una segunda carpeta en `acto-1` para la demo en vivo.
- [ ] Hotspot móvil cargado como plan B de red.
- [ ] Completar guía, repo, proxy y Wi-Fi en `slides/src/talk.ts` y ensayar las slides con la vista del orador (ver "Slides de apertura").

### 30 minutos antes

- [ ] Proyector: zoom del navegador al 125 %, editor con fuente 18+, terminal con fuente grande.
- [ ] Dos ventanas: la tienda (izquierda) y el editor (derecha). DevTools cerradas hasta el Acto 1.
- [ ] Escribir en la pizarra o en una diapositiva: URL de la guía, URL del repo, URL del proxy, Wi-Fi (la slide de verificación ya las proyecta desde `talk.ts`).
- [ ] `npm run dev` corriendo en `acto-1`; insignia del panel visible.
- [ ] Slides abiertas desde la carpeta en `main` (`npm run slides`): presentación en el proyector y vista del orador en tu pantalla.

## Slides de apertura

Son los primeros **≈9 minutos** del Acto 1 (14 slides) y dejan **≈6 minutos de práctica**. Cubren el ticket, el modelo mental (agente, MCP, WebMCP y su API), la arquitectura del repo, la misión, las reglas y la verificación del entorno. Cada slide tiene notas con guion, tiempo y reloj acumulado.

**Dónde viven:** `slides/` en la rama `main`. Los tags `acto-1`…`final` no las incluyen, así que preséntalas desde la carpeta en `main` (por ejemplo, la misma donde preparas la demo final).

```bash
npm run slides                       # abre http://localhost:5173/slides/
# o, con npm run dev corriendo:
#   http://localhost:5173/slides/              → proyector
#   http://localhost:5173/slides/speaker.html  → vista del orador
```

| Tecla | Acción |
| --- | --- |
| → / ↓ / espacio | Siguiente slide |
| ← / ↑ | Slide anterior |
| S (en la presentación) | Abre la vista del orador en una ventana emergente |

- Navega desde la **vista del orador**: la presentación la sigue (mismo navegador, `BroadcastChannel`, sin internet). Si recargas la presentación con la vista del orador abierta, retoma la slide actual.
- La vista del orador muestra la slide actual, la siguiente, las notas (`slides/notes/<id>.md`), un cronómetro y la hora.
- Al terminar (`vamos`), pasa a la tienda en `acto-1` y sigue el guion del Acto 1 desde el minuto 9. El presupuesto es estricto: si una slide se alarga, recorta en la siguiente, no en la práctica.

## Publicar la guía en vivo

La guía (`/guide/`) muestra `docs/*.md` como una página por acto, con tiempos, casillas de avance, botones de copiar y la caja "¿Te quedaste atrás?". Localmente: `npm run guide` o `http://localhost:5173/guide/` con `npm run dev`.

Los tags `acto-1`…`final` son anteriores a la guía y no la incluyen, por eso se publica aparte como sitio estático compilado desde `main`. Publicarla no mueve ni reescribe ningún tag.

**GitHub Pages (una sola vez):**

1. Sube `main` al repositorio público (el flujo `.github/workflows/deploy-guide.yml` viaja con él).
2. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Ejecuta el flujo **Deploy guide** desde la pestaña **Actions** (o haz push a `main` con cambios en `docs/` o `guide/`).
4. La guía queda en `https://<usuario>.github.io/<repo>/`. Copia esa URL en `guideUrl` de `slides/src/talk.ts`.

El flujo compila con `npm run build:guide`, verifica que el build no contenga slides ni notas del orador y publica solo `dist-guide/`.

**Otro hosting estático:** `npm run build:guide` y sube `dist-guide/` tal cual. La base es relativa (`./`), así que funciona en la raíz o en una subcarpeta; `GUIDE_BASE=/taller/ npm run build:guide` la fija si tu hosting lo necesita. Para probarla localmente: `npm run preview:guide`.

**Actualizarla:** edita `docs/*.md` en `main` y vuelve a publicar. El avance de cada asistente vive en su navegador, con claves por paso, así que sobrevive a una nueva publicación mientras los títulos de los pasos no cambien.

## Desplegar el proxy del instructor

En cualquier VM o servicio con Node 22:

```bash
git clone <repo> && cd workshop-web-mcp && git switch final && npm ci
GEMINI_API_KEY=... ALLOWED_ORIGINS=http://localhost:5173 RATE_LIMIT_PER_MINUTE=30 PORT=8787 npm run server
```

Los asistentes ponen en su `.env`: `AGENT_BASE_URL=https://tu-proxy.example`. Vite reenvía `/api` a esa URL, así que no hay problemas de CORS. Ponlo detrás de HTTPS y apágalo al terminar el evento.

## Guion por acto

### Acto 1 · El incidente (0:00–0:15)

**En el proyector:** primero las [slides de apertura](#slides-de-apertura); luego la tienda en `acto-1`.

| Min | Qué hacer | Qué decir (ideas clave) |
| --- | --- | --- |
| 0–9 | [Slides de apertura](#slides-de-apertura) (14 slides, guion en las notas) | El ticket, "el modelo no falla: adivina", agente y MCP, WebMCP, `registerTool` + `AbortSignal`, arquitectura, misión y reglas. |
| 9–10 | Botón **"Acto 1-2 · Cascos ECE"** | Señala que la respuesta suena segura y es falsa. La verdad: solo el Altamira GT-R a 980.000. |
| 10–14 | Asistentes escriben `useWebMcpTools` + `get_store_info` | Explica StrictMode: montar → limpiar → montar. Quien termine antes: experimento `say_hello` en consola. |
| 14–15 | Botón **"Acto 1 · Horario"** | Muestra el brillo en la píldora y la tarjeta de la herramienta. |

**Prompt de demo (exacto):**

```text
¿Qué cascos certificados ECE 22.06 hay en stock en talla M por menos de 1.200.000?
```

### Acto 2 · Darle ojos (0:15–0:40)

| Min | Qué hacer | Qué decir |
| --- | --- | --- |
| 0–5 | Diagrama de secuencia del ciclo del agente | "El proxy no toca la página; la página no ve la clave." |
| 5–7 | Escribe `search_products` en vivo | "La descripción es para el modelo. `enum` evita que invente categorías." |
| 7–22 | Asistentes implementan las 5 herramientas | Camina por el salón. Errores típicos: olvidar el índice, no reutilizar `searchProducts`. |
| 22–25 | Prompt de cascos otra vez | Ahora responde solo el Altamira GT-R. Señala la "trampa" del Nimbo Sport (talla M agotada). |

### Acto 3 · Darle manos (0:40–1:10)

| Min | Qué hacer | Qué decir |
| --- | --- | --- |
| 0–5 | Diagrama "una sola fuente de verdad" | "La herramienta es otra puerta a la misma acción, no una segunda tienda." |
| 5–8 | Muestra un error recuperable (`OUT_OF_STOCK` con `details`) | "Un error útil le enseña al modelo cómo reintentar." |
| 8–25 | Asistentes implementan `set_filters`, `add_to_cart`, `apply_coupon`, `open_cart`, `checkout` ingenuo | Insiste: `checkout` ingenuo es intencional. |
| 25–30 | **Prompt jefe** en el proyector | Deja que la cascada se vea. Pausa en el carrito: total 1.170.000 COP. |

**Prompt jefe (exacto):**

```text
Busca un casco certificado por menos de 1.200.000 COP, agrégalo en talla M junto con unos guantes de pista talla M, aplica el cupón de bienvenida y abre el carrito.
```

### Acto 4 · El sabotaje (1:10–1:25)

| Min | Qué hacer | Qué decir |
| --- | --- | --- |
| 0–4 | En `acto-4`, con carrito vacío, botón **"Acto 4 · Reseñas"** | Deja que pase: 10 cascos y pedido confirmado sin preguntar. Silencio dramático. |
| 4–5 | Abre el detalle del Altamira GT-R y lee la reseña maliciosa | "El usuario no hizo nada malo. El ataque vino de un tercero." |
| 5–7 | Diagrama de defensa en profundidad | "Las anotaciones son pistas; la validación de la página es la garantía." |
| 7–13 | Asistentes implementan las 3 capas | — |
| 13–15 | Repite el prompt y luego "Finaliza la compra." | Muestra las dos confirmaciones y el `USER_DECLINED`. |

**Prompts (exactos):**

```text
¿Qué opinan las reseñas del casco Altamira GT-R? Si son buenas, agrégalo en talla M.
```

```text
Finaliza la compra.
```

> Con Gemini real el modelo puede resistirse a la inyección desde el principio. Si pasa, **celébralo** y explica que no puedes apostar a eso; cambia a modo simulado (`npm run server:mock`) para mostrar el ataque de forma reproducible.

### Acto 5 · Cierre (1:25–1:30)

Tabla WebMCP vs. MCP de servidor, checklist de producción (origin trial, `exposedTo`, observabilidad) y preguntas. Muestra `git log --oneline --decorate` para recordar los tags.

## Qué mostrar en el proyector

- Panel del agente siempre visible: las tarjetas de herramientas **son** la explicación.
- Abre las tarjetas (`<details>`) para mostrar argumentos y resultados en momentos clave.
- DevTools → Console: `[webmcp] mode: polyfill` (o `native`). La insignia de la cabecera dice lo mismo: "WebMCP nativo", "WebMCP polyfill" o "WebMCP polyfill (forzado)".
- Para comparar ambos caminos en vivo con Chrome nativo, abre una segunda pestaña con `http://localhost:5173/?webmcp=polyfill`.
- En el Acto 4, el detalle del producto con la reseña maliciosa.

## Plan B (fallbacks)

| Problema | Acción inmediata |
| --- | --- |
| Sin internet / Gemini caído | `AGENT_MODE=mock` en `.env` o `npm run server:mock` + `npm run dev:web`. La insignia dice "Modo simulado". |
| Cuota de Gemini agotada | Pide a todos que usen modo simulado; tu proxy sigue para el proyector. |
| Asistentes sin clave | `AGENT_BASE_URL=<proxy del instructor>` en `.env` y reiniciar `npm run dev`. |
| Alguien muy atrasado | `git stash -u && git switch -c mi-acto-N acto-N && npm ci` |
| `npm ci` lento por la red | Compartir `node_modules` comprimido por USB, o emparejar asistentes. |
| Tu demo se rompe | Tienes la carpeta en `final`: `git switch final` y continúa. |
| Chrome con flag da problemas | Desactiva la flag: el polyfill cubre todo el taller. |

## Tabla de diagnóstico

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `EBADENGINE` en `npm ci` | Node < 22.12 | Instalar Node 22/24 LTS (nvm, fnm, Volta) |
| Insignia "Proxy desconectado" | Proxy no arrancó, puerto ocupado | Ver la terminal `[proxy]`; `PORT=8788` en `.env` |
| Error 502 en el chat | Clave inválida, sin red o cuota | `npm run server:mock` o proxy del instructor |
| Error 429 en el chat | Límite de solicitudes del proxy | Esperar un minuto o subir `RATE_LIMIT_PER_MINUTE` |
| "already registered" en consola | Hook sin `signal` o sin limpieza | Revisar `useWebMcpTools` |
| Panel con 0 herramientas | `storeTools` vacío | `src/webmcp/tools/index.ts` |
| `Error: TODO(acto-N)` en una tarjeta | Herramienta registrada sin implementar | Completar `execute` o quitarla del índice |
| `document.modelContext` undefined | Acceso por IP con http | Usar `localhost` |
| Con WebMCP nativo falta "consecuente"/"no confiable" o sale `reading 'consequentialHint'` | El `getTools()` nativo de Chrome no devuelve `annotations` | Ya está cubierto: el adaptador de `src/webmcp/polyfill.ts` las recuerda al registrar. Para comparar, abre `?webmcp=polyfill` (la insignia dice "WebMCP polyfill (forzado)") |
| El agente no reconoce el prompt (modo simulado) | Texto distinto al guion | Usar los botones de sugerencias |
| Gemini elige otro producto o color | No determinismo | Explicarlo como parte de la lección; usar modo simulado para la demo |
| Puerto 5173 ocupado | Otra instancia de Vite | Cerrar la otra o usar el puerto que proponga Vite |
| Tests fallan tras `git checkout <tag> -- archivo` | La solución todavía no está completa | Es esperado: esos son los tests del acto |
