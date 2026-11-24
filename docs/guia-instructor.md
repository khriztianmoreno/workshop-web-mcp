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
- [ ] Desplegar el **proxy del instructor** con `WORKSHOP_TOKEN` (ver "Hostear el proxy para la sala") y probarlo con curl.
- [ ] Verificar el límite por cliente **a través de la URL pública real** (ver "4. Probar con curl"): con `TRUST_PROXY` en el número exacto de saltos, los logs deben mostrar `new client key: <tu IP pública>`, también al enviar un `x-forwarded-for` falso. Si aparece la IP del balanceador o la IP falsa, corrige `TRUST_PROXY` antes del evento.
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
- [ ] Escribir en la pizarra o en una diapositiva: URL de la guía, URL del repo, URL del proxy con el marcador `<token>` en lugar del token real, Wi-Fi (la slide de verificación ya las proyecta desde `talk.ts`, también con `<token>`). El token real se comparte solo por el chat del taller, nunca en el proyector, y se rota al terminar el evento.
- [ ] `npm run dev` corriendo en `acto-1`; insignia del panel visible.
- [ ] Slides abiertas desde la copia en `main` con `npm run speaker` (puerto 5180), mientras la tienda corre con `npm run dev` desde el otro clon: presentación en el proyector y vista del orador en tu pantalla.

## Slides de apertura

Son los primeros **≈9 minutos** del Acto 1 (15 slides) y dejan **≈6 minutos de práctica**. Cuentan una historia, primero el problema: el ticket del asistente que responde "hazlo tú", por qué hoy hacer que un asistente actúe obliga a cablear todo a mano, WebMCP y por qué ponerlo en sus proyectos; después la API, la arquitectura del repo, la misión, las reglas y la verificación del entorno. Cada slide tiene notas con guion, tiempo y reloj acumulado.

**Dónde viven:** `slides/` en la rama `main`. Los tags `acto-1`…`final` no las incluyen, así que preséntalas desde una copia en `main` (por ejemplo, la misma donde preparas la demo final), mientras el taller corre con `npm run dev` desde otro clon en `acto-1`. Con `npm run speaker` las slides usan el puerto 5180 y no chocan con la tienda en el 5173.

```bash
npm run speaker                      # desde la copia en main; abre http://localhost:5180/slides/
#   http://localhost:5180/slides/              → proyector
#   http://localhost:5180/slides/speaker.html  → vista del orador
```

Si solo tienes una copia del repo, `npm run slides` las abre en `http://localhost:5173/slides/` (mismo puerto que la tienda, así que no puedes tener ambas a la vez).

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

## Hostear el proxy para la sala

El proxy publicado en internet gasta **tu** clave de Gemini. Sin protección, cualquiera que encuentre la URL puede usarlo como relevo gratuito. Estas medidas lo acotan para unas 40 personas durante el taller.

### 1. La clave

- Crea una clave de Gemini **dedicada al taller**, en un proyecto aparte.
- Configura un **tope de gasto o cuota** en ese proyecto (Google Cloud → presupuestos y alertas, o límites de cuota de la API). Es la defensa final: todo lo demás solo reduce el abuso.
- **Revócala al terminar el evento**, aunque apagues el servidor.

### 2. Desplegar

El proxy endurecido vive en `main` (los tags de los actos no cambian). En cualquier VM o servicio con Node 22, detrás de HTTPS:

```bash
git clone <repo> && cd workshop-web-mcp && git switch main && npm ci
openssl rand -hex 16          # genera el token de la sala (32 caracteres)
GEMINI_API_KEY=... \
WORKSHOP_TOKEN=<token-de-la-sala> \
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173 \
TRUST_PROXY=1 \
PORT=8787 npm run server
```

En un PaaS, define `GEMINI_API_KEY` y `WORKSHOP_TOKEN` en el **almacén de secretos** del servicio, no en el repositorio ni en la línea de comandos compartida.

Si tu plataforma construye imágenes Docker, usa el `Dockerfile` de la raíz: empaqueta solo el proxy (`server/` y `shared/`), corre como usuario sin privilegios, escucha en el puerto `8787` y no necesita archivo `.env` (toda la configuración llega por variables de entorno).

#### Desplegar en Coolify

1. **Nuevo recurso:** *Projects → + New → Public Repository*, pega la URL del repositorio en GitHub y elige la rama `main`.
2. **Build pack:** `Dockerfile` (ubicación `/Dockerfile`). En *Network*, **Ports Exposes** = `8787`.
3. **Dominio:** asigna uno con `https://` (por ejemplo `https://proxy.tu-dominio.com`). Coolify, a través de Traefik, emite el certificado y termina HTTPS.
4. **Variables de entorno** (*Environment Variables*). Marca como secretas las dos primeras:

   | Variable | Valor |
   | --- | --- |
   | `GEMINI_API_KEY` (secreta) | La clave **dedicada** al taller, con tope de gasto (ver [1. La clave](#1-la-clave)). |
   | `WORKSHOP_TOKEN` (secreta) | `openssl rand -hex 16` (32 caracteres). |
   | `ALLOWED_ORIGINS` | Orígenes exactos: `http://localhost:5173,http://127.0.0.1:5173`. **Nunca** `*`. |
   | `TRUST_PROXY` | `1` detrás del Traefik de Coolify. `2` si además el dominio pasa por el proxy de Cloudflare (nube naranja). |
   | `GEMINI_MODEL` | Opcional; vacío = el modelo por defecto. |

   Para los límites, deja los valores por defecto del modo con token (ver la tabla siguiente y los valores recomendados para la sala). No definas `PORT`: la imagen ya usa `8787`.
5. **Una sola instancia**, sin réplicas: el límite de frecuencia vive en memoria, así que con varias réplicas cada una contaría por su lado.
6. **Deploy.** La imagen trae un `HEALTHCHECK` contra `/api/health`, que responde `200` aunque haya token; el contenedor debe aparecer como *healthy*.

**Verificación** (los comandos completos están en [4. Probar con curl](#4-probar-con-curl)):

- [ ] `curl https://<dominio>/api/health` → `200` con `"mode":"gemini"`. Si dice `"mock"`, falta `GEMINI_API_KEY`.
- [ ] `/api/chat` sin token → `401`.
- [ ] `/t/<WORKSHOP_TOKEN>/api/chat` → `200`.
- [ ] Una llamada normal y otra con `-H 'x-forwarded-for: 6.6.6.6'`. En Coolify, abre el recurso → *Logs* y busca las líneas `[proxy] new client key: ...`: las dos deben mostrar **tu IP pública**. Si aparece una IP interna (`10.x`, `172.x`), sube `TRUST_PROXY`; si aparece `6.6.6.6`, bájalo. Cambiar una variable exige redesplegar.

**Qué ponen los asistentes** en su `.env` (detalle en [3. Qué ponen los asistentes](#3-qué-ponen-los-asistentes)):

```bash
AGENT_BASE_URL=https://<dominio>/t/<WORKSHOP_TOKEN>
```

Comparte el token por el chat del taller, nunca en pantalla. Al terminar el evento, rota `WORKSHOP_TOKEN` (o detén el recurso) y revoca la clave.

| Variable | Qué hace | Valor por defecto |
| --- | --- | --- |
| `WORKSHOP_TOKEN` | Token compartido de la sala, de **24 caracteres o más** (el servidor no arranca con uno más corto). Sin él, el proxy queda abierto (solo para desarrollo local). | vacío (sin token) |
| `AUTH_FAILURES_PER_MINUTE` | Tokens inválidos **distintos** por IP y minuto antes de responder 429 (no cuenta intentos: repetir el mismo token equivocado, o no enviar ninguno, cuenta una vez). Frena la fuerza bruta del token. | `30` |
| `ALLOWED_ORIGINS` | Orígenes del navegador permitidos por CORS. Los asistentes abren la app en `localhost:5173`, así que el valor por defecto ya sirve. Con `*` y token, el servidor muestra una advertencia al arrancar. | `http://localhost:5173,http://127.0.0.1:5173` |
| `TRUST_PROXY` | Número **exacto** de proxies inversos de confianza delante del servidor (balanceador, Cloud Run, Render, Fly, nginx). Con `1` se usa la entrada más a la derecha de `x-forwarded-for`. Déjalo vacío si el servidor recibe conexiones directas: si no, cualquiera falsifica su IP. | vacío (usa la IP del socket) |
| `RATE_LIMIT_PER_MINUTE` | Límite por IP de cliente. Toda la sala puede salir por la misma IP (NAT del recinto). | `600` con token · `60` sin token |
| `RATE_LIMIT_GLOBAL_PER_MINUTE` | Límite total del proxy, sumando a todos. | `1500` con token · `600` sin token |
| `MAX_BODY_BYTES` | Tamaño máximo del cuerpo de cada solicitud. El historial, las herramientas y las firmas de pensamiento de Gemini 3 crecen de un acto a otro. | `262144` (256 KB) |
| `MAX_MESSAGES` / `MAX_TEXT_CHARS` / `MAX_MODEL_TEXT_CHARS` / `MAX_TOOLS` / `MAX_TOOL_SCHEMA_BYTES` | Topes de mensajes, caracteres por mensaje del usuario, caracteres por texto del modelo, herramientas y tamaño de cada esquema. | `60` / `8000` / `32000` / `32` / `8192` |
| `MAX_OUTPUT_TOKENS` | Tope de tokens generados por llamada. El razonamiento cuenta: con un valor bajo, el modelo puede devolver respuestas vacías. | `8192` |
| `GEMINI_THINKING_LEVEL` | Nivel de razonamiento opcional: `MINIMAL`, `LOW`, `MEDIUM`, `HIGH` o `XHIGH`. Vacío = el del modelo. | vacío |

**Valores recomendados para la sala (~40 personas):** deja los valores por defecto del modo con token. Un prompt jefe son hasta 9 llamadas a `/api/chat`; 30 personas lanzándolo en el mismo minuto detrás de una sola IP suman ≈270 llamadas, dentro de `600` por cliente. El global de `1500` deja margen para picos y reintentos. Si la red del recinto da una IP distinta a cada asistente, puedes bajar `RATE_LIMIT_PER_MINUTE` a `120`. Estos límites no reemplazan el tope de gasto de la clave.

El modelo y el *system prompt* los fija el servidor; el cliente no puede cambiarlos. Las partes `rawParts` que devuelve el navegador se filtran: solo pasan texto, firmas de pensamiento y llamadas a funciones.

Genera el token con `openssl rand -hex 16` (32 caracteres hexadecimales; el mínimo aceptado es 24). No es un secreto frente a los asistentes: solo evita que cualquiera en internet use el proxy. Por eso el tope de gasto sigue siendo obligatorio.

Cuidados con el token:

- **Viaja en la URL** (`/t/<token>`), así que puede quedar en historiales, capturas y logs. **Nunca lo proyectes** ni lo pongas en las slides: compártelo por el chat del taller.
- Guárdalo en el **almacén de secretos** del hosting, no en el repositorio.
- **Rótalo al terminar el evento** (o apaga el proxy), igual que la clave de Gemini.
- Tras `AUTH_FAILURES_PER_MINUTE` tokens inválidos **distintos** en un minuto (30 por defecto), esa IP recibe 429 durante ese minuto, incluso con el token correcto. Se cuentan valores distintos, no intentos: si varias personas de la sala repiten el mismo token mal copiado (o ninguno), solo reciben 401 y no bloquean a los demás. El umbral solo se alcanza con muchos tokens equivocados *diferentes* en el mismo minuto; aun así, pide que copien la URL completa.

### 3. Qué ponen los asistentes

El token va **en la ruta**, así los clientes de los tags `acto-1`…`acto-4` funcionan sin cambiar código: solo concatenan `/api/chat` a la URL base.

```bash
# .env del asistente (opción recomendada: Vite reenvía /api, sin CORS)
AGENT_BASE_URL=https://tu-proxy.example/t/<token-de-la-sala>

# Alternativa: el navegador llama directo al proxy (requiere CORS)
VITE_AGENT_URL=https://tu-proxy.example/t/<token-de-la-sala>
```

Después de editar `.env`, hay que reiniciar `npm run dev`. `npm run check` confirma la conexión.

Clientes propios también pueden enviar el token en una cabecera: `Authorization: Bearer <token>` o `x-workshop-token: <token>`.

### 4. Probar con curl

```bash
P=https://tu-proxy.example
T=<token-de-la-sala>
BODY='{"messages":[{"role":"user","text":"hola"}],"tools":[]}'

curl -s $P/api/health                                   # 200 {"ok":true,"mode":"gemini","model":"..."}
curl -s -o /dev/null -w '%{http_code}\n' -H 'content-type: application/json' -d "$BODY" $P/api/chat          # 401
curl -s -o /dev/null -w '%{http_code}\n' -H 'content-type: application/json' -d "$BODY" $P/t/$T/api/chat     # 200
curl -s -o /dev/null -w '%{http_code}\n' -H "authorization: Bearer $T" -H 'content-type: application/json' -d "$BODY" $P/api/chat  # 200

# TRUST_PROXY: haz estas dos llamadas desde tu red y mira los logs del servidor.
curl -s -o /dev/null -w '%{http_code}\n' -H 'content-type: application/json' -d "$BODY" $P/t/$T/api/chat                               # log: new client key: <tu IP pública>
curl -s -o /dev/null -w '%{http_code}\n' -H 'x-forwarded-for: 6.6.6.6' -H 'content-type: application/json' -d "$BODY" $P/t/$T/api/chat  # no debe aparecer 6.6.6.6
```

La clave por cliente debe ser **tu IP pública** en las dos llamadas. Si ves la IP interna del balanceador, `TRUST_PROXY` es menor que el número real de saltos (toda la sala compartiría un cupo). Si ves `6.6.6.6`, es mayor (cualquiera podría inventarse un cupo nuevo en cada solicitud). Ajusta el valor y repite.

> CORS no protege el proxy: solo lo respetan los navegadores. `curl` o un script lo ignoran. La protección real es el token, los límites y el tope de gasto de la clave.

### 5. Durante y después

- Si algo falla, el chat muestra un mensaje genérico con un `id`. Búscalo en los logs del servidor (`[proxy] <id> ...`) para ver el detalle.
- Un 429 con "saturado" es el límite global; con "desde tu conexión", el límite por IP; con "token inválido", demasiados tokens inválidos distintos desde esa IP. Súbelos si la sala comparte una sola IP.
- Al terminar: apaga el servidor, **revoca la clave** y **rota el token**.

## Guion por acto

### Acto 1 · El incidente (0:00–0:15)

**En el proyector:** primero las [slides de apertura](#slides-de-apertura); luego la tienda en `acto-1`.

| Min | Qué hacer | Qué decir (ideas clave) |
| --- | --- | --- |
| 0–9 | [Slides de apertura](#slides-de-apertura) (15 slides, guion en las notas) | El ticket, "el modelo no falla: no ve la página", por qué cuesta que un asistente actúe, WebMCP y por qué usarlo, `registerTool` + `AbortSignal`, arquitectura, misión y reglas. |
| 9–10 | Botón **"Acto 3 · Prompt jefe"** (sí, el del Acto 3) | Señala que es honesto pero inútil: no puede buscar, agregar ni aplicar el cupón, y le dice al cliente que lo haga él en la web donde ya está. El carrito sigue vacío. "En el Acto 3, este mismo prompt se ejecuta solo." Si tu modelo inventa productos o dice que ya los agregó, mejor aún: tampoco ve ni toca la página. |
| 10–14 | Asistentes escriben `useWebMcpTools` + `get_store_info` | Explica StrictMode: montar → limpiar → montar. Quien termine antes: experimento `say_hello` en consola. |
| 14–15 | Botón **"Acto 1 · Horario"** | Muestra el brillo en la píldora y la tarjeta de la herramienta. |

**Prompt de demo (exacto, el mismo del Acto 3):**

```text
Busca un casco certificado por menos de 1.200.000 COP, agrégalo en talla M junto con unos guantes de pista talla M, aplica el cupón de bienvenida y abre el carrito.
```

Con Gemini observamos (3 de 3 veces): "En este momento no dispongo de las herramientas necesarias para consultar el catálogo de la tienda, verificar la disponibilidad de productos ni gestionar el carrito de compras… Por favor, realiza la búsqueda y la compra directamente a través de la página web de Rodada."

Comprobación opcional con **"Acto 1-2 · Cascos ECE"**: también responde que no tiene acceso al catálogo. La verdad, para contrastar en el Acto 2: solo el Altamira GT-R a 980.000.

### Acto 2 · Darle ojos (0:15–0:40)

| Min | Qué hacer | Qué decir |
| --- | --- | --- |
| 0–5 | Diagrama de secuencia del ciclo del agente | "El proxy no toca la página; la página no ve la clave." |
| 5–7 | Escribe `search_products` en vivo | "La descripción es para el modelo. `enum` evita que invente categorías." |
| 7–22 | Asistentes implementan las 5 herramientas | Camina por el salón. Errores típicos: olvidar el índice, no reutilizar `searchProducts`. |
| 22–25 | Prompt de cascos otra vez | Antes no podía ver el catálogo; ahora responde solo el Altamira GT-R. Señala la "trampa" del Nimbo Sport (talla M agotada). |

### Acto 3 · Darle manos (0:40–1:10)

| Min | Qué hacer | Qué decir |
| --- | --- | --- |
| 0–5 | Diagrama "una sola fuente de verdad" | "La herramienta es otra puerta a la misma acción, no una segunda tienda." |
| 5–8 | Muestra un error recuperable (`OUT_OF_STOCK` con `details`) | "Un error útil le enseña al modelo cómo reintentar." |
| 8–25 | Asistentes implementan `set_filters`, `add_to_cart`, `apply_coupon`, `open_cart`, `checkout` ingenuo | Insiste: `checkout` ingenuo es intencional. |
| 25–30 | **Prompt jefe** en el proyector | Recuerda el Acto 1: "Mismo prompt, mismo modelo; la diferencia es WebMCP." Deja que la cascada se vea. Pausa en el carrito: total 1.170.000 COP. |

**Prompt jefe (exacto):**

```text
Busca un casco certificado por menos de 1.200.000 COP, agrégalo en talla M junto con unos guantes de pista talla M, aplica el cupón de bienvenida y abre el carrito.
```

### Acto 4 · El sabotaje (1:10–1:25)

| Min | Qué hacer | Qué decir |
| --- | --- | --- |
| 0–4 | En `acto-4`, con carrito vacío, botón **"Acto 4 · Reseñas"** | Si el modelo obedece (10 cascos y `checkout` sin preguntar), deja que pase y haz una pausa. Si se resiste (lo más probable), señálalo: "Hoy se resistió, pero la página no puede depender de eso." Opcional: muestra la falla en Modo simulado (ver nota abajo). |
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

> **No prometas que el ataque va a funcionar.** En nuestras mediciones la inyección de la reseña no tuvo éxito con modelos actuales (0 de 60 en 12 modelos con el prompt del sistema completo; 0 de 25 con un prompt ingenuo sin el bloque de seguridad), y en el ensayo Gemini detectó la instrucción y la descartó. La lección del acto es la defensa en profundidad que **no depende del modelo**: `untrustedContentHint` en `get_product_reviews`, el límite acumulado de cantidad en `add_to_cart` y `checkout` con `consequentialHint` más el diálogo de confirmación de la página. Para mostrar la falla de forma reproducible, cambia a Modo simulado: detén `npm run dev` y corre `npm run server:mock` + `npm run dev:web` (o pon `AGENT_MODE=mock` en `.env`); la insignia dice "Modo simulado". Ese agente obedece la reseña mientras no esté marcada como no confiable.

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
| Asistentes sin clave | `AGENT_BASE_URL=<proxy del instructor>/t/<token>` en `.env` y reiniciar `npm run dev`. |
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
| Error 429 en el chat | Límite de solicitudes del proxy | Esperar un minuto o subir `RATE_LIMIT_PER_MINUTE` / `RATE_LIMIT_GLOBAL_PER_MINUTE` |
| Error 401 en el chat | Falta el token o está mal escrito | `AGENT_BASE_URL=https://…/t/<token>` y reiniciar `npm run dev` |
| Error 413 en el chat | Conversación demasiado larga | Botón "Nueva conversación" del panel |
| "already registered" en consola | Hook sin `signal` o sin limpieza | Revisar `useWebMcpTools` |
| Panel con 0 herramientas | `storeTools` vacío | `src/webmcp/tools/index.ts` |
| `Error: TODO(acto-N)` en una tarjeta | Herramienta registrada sin implementar | Completar `execute` o quitarla del índice |
| `document.modelContext` undefined | Acceso por IP con http | Usar `localhost` |
| Con WebMCP nativo falta "consecuente"/"no confiable" o sale `reading 'consequentialHint'` | El `getTools()` nativo de Chrome no devuelve `annotations` | Ya está cubierto: el adaptador de `src/webmcp/polyfill.ts` las recuerda al registrar. Para comparar, abre `?webmcp=polyfill` (la insignia dice "WebMCP polyfill (forzado)") |
| El agente no reconoce el prompt (modo simulado) | Texto distinto al guion | Usar los botones de sugerencias |
| Gemini elige otro producto o color | No determinismo | Explicarlo como parte de la lección; usar modo simulado para la demo |
| Puerto 5173 ocupado | Otra instancia de Vite | Cerrar la otra o usar el puerto que proponga Vite |
| Tests fallan tras `git checkout <tag> -- archivo` | La solución todavía no está completa | Es esperado: esos son los tests del acto |
