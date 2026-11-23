# Rodada · Taller WebMCP

> **DevFest Bogotá · 28 de noviembre de 2026 · 90 minutos**
> Dale ojos y manos a un agente de IA dentro de tu propia página web, sin servidor MCP, con `document.modelContext`.

Rodada es una tienda ficticia de equipo para motociclistas (cascos, chaquetas, guantes, botas y accesorios). Tiene un asistente de compras en un panel lateral que, al comenzar el taller, **no puede ver ni tocar la página**: inventa productos. Durante cinco actos lo convertirás en un agente útil y seguro usando **WebMCP**.

```text
 Acto 1  El incidente        15 min   El chatbot inventa. Registras tu primera herramienta.
 Acto 2  Darle ojos          25 min   Herramientas de lectura (readOnlyHint).
 Acto 3  Darle manos         30 min   Herramientas de escritura que reutilizan las acciones de la UI.
 Acto 4  El sabotaje         15 min   Inyección de prompts en una reseña y defensa en profundidad.
 Acto 5  Cierre               5 min   WebMCP vs. MCP de servidor, producción y próximos pasos.
```

## Requisitos

| Necesitas | Versión | Cómo verificar |
| --- | --- | --- |
| Node.js | **22.12 o superior** (22 LTS o 24 LTS) | `node -v` |
| npm | el que viene con Node | `npm -v` |
| Git | cualquiera reciente | `git --version` |
| Chrome | actualizado (WebMCP nativo: 149+) | `chrome://version` |
| Clave de Gemini | **opcional** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

Sin clave de Gemini todo funciona en **"Modo simulado"**: un agente determinista que reconoce los prompts del taller. Sin la flag de Chrome todo funciona con el **polyfill** incluido.

## Inicio rápido

```bash
git clone <URL-del-repositorio> workshop-web-mcp
cd workshop-web-mcp
git switch -c mi-taller acto-1   # empieza desde el Acto 1
npm ci
cp env.example .env              # opcional: agrega GEMINI_API_KEY
npm run check                    # verifica tu entorno
npm run dev                      # abre http://localhost:5173
```

`npm run dev` levanta dos procesos: **web** (Vite, puerto 5173) y **proxy** (Hono, puerto 8787).

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | App + proxy con recarga en caliente |
| `npm run slides` | Abre las slides de apertura (solo Vite, sin proxy) |
| `npm run guide` | Abre la guía en vivo del taller (solo Vite, sin proxy) |
| `npm run build:guide` | Build estático solo de la guía en `dist-guide/` (para publicarla) |
| `npm run server:mock` | Solo el proxy, forzando el modo simulado |
| `npm test` | Pruebas con Vitest |
| `npm run typecheck` | TypeScript de la app y del servidor |
| `npm run build` | Build de producción de la app (incluye `/slides/` y `/guide/`) |
| `npm run check` | Verificación del entorno (Node, dependencias, `.env`, proxy) |

## Slides de apertura

Las slides que proyecta el instructor al inicio (los primeros ≈9 min del Acto 1: el incidente, los conceptos y la dinámica del taller) viven en `slides/`, en la rama `main` (no en los tags de los actos).

| URL (con `npm run dev` corriendo) | Qué es |
| --- | --- |
| [http://localhost:5173/slides/](http://localhost:5173/slides/) | La presentación (proyector) |
| [http://localhost:5173/slides/speaker.html](http://localhost:5173/slides/speaker.html) | Vista del orador: notas, siguiente slide y cronómetro |

- `npm run slides` levanta Vite y abre la presentación (si `npm run dev` ya ocupa el puerto 5173, Vite propone otro).
- Navegación: flechas o espacio. **S** abre la vista del orador en una ventana aparte; ambas se sincronizan por `BroadcastChannel` (mismo navegador, sin red). En pantallas táctiles aparecen botones y gestos; `?touch` los fuerza.
- Fuentes: `slides/src/slides.tsx` (contenido), `slides/notes/*.md` (notas del orador) y `slides/src/talk.ts` (datos del evento: completa guía, repo, proxy y Wi-Fi antes de presentar).
- Motor: [`@khriztianmoreno/speaker-kit`](https://www.npmjs.com/package/@khriztianmoreno/speaker-kit) + Tailwind (solo en `slides/`). La tienda no carga nada de esto.

## Guía en vivo

Una página para tener abierta junto al editor durante el taller: un acto por página con su tiempo, objetivo, pasos, hito y la caja "¿Te quedaste atrás?" con el comando para saltar al tag del acto. Los bloques de código tienen botón de copiar, las soluciones vienen plegadas y cada paso tiene una casilla; el avance se guarda en el navegador (`localStorage`).

| URL | Qué es |
| --- | --- |
| [http://localhost:5173/guide/](http://localhost:5173/guide/) | La guía, con `npm run dev` o `npm run guide` |
| `http://localhost:5173/guide/#acto-3` | Enlace directo a un acto (`#prework`, `#acto-1`…`#acto-5`, `#cheatsheet`) |

- **Sin contenido duplicado:** la guía lee `docs/*.md` al compilar (plugin `guide/build/content.ts`, con marked y shiki) y entrega HTML listo. Si cambias un doc, cambia la guía.
- **Publicarla:** `npm run build:guide` genera `dist-guide/`, un sitio estático autocontenido. La base es relativa (`./`), así que funciona en cualquier ruta; `GUIDE_BASE=/ruta/ npm run build:guide` la fija si hace falta. El flujo `.github/workflows/deploy-guide.yml` la publica en GitHub Pages; los pasos están en [docs/guia-instructor.md](docs/guia-instructor.md#publicar-la-guía-en-vivo).
- Como se compila desde `main`, la guía se puede publicar o actualizar después de crear los tags de los actos, sin moverlos.

## Mapa de tags

Cada tag es el **punto de partida** de un acto y, a la vez, la **solución** del acto anterior.

| Tag | Empiezas el… | Contiene |
| --- | --- | --- |
| `acto-1` | Acto 1 | App funcionando, panel de chat con **cero** herramientas. TODOs para todo. |
| `acto-2` | Acto 2 | Hook de registro + `get_store_info` (solución del Acto 1). |
| `acto-3` | Acto 3 | Herramientas de lectura (solución del Acto 2). |
| `acto-4` | Acto 4 | Herramientas de escritura + `checkout` ingenuo (solución del Acto 3). |
| `final` | Acto 5 | Defensas del Acto 4 y solución completa. |

¿Te quedaste atrás? Guarda tu trabajo y salta al siguiente tag:

```bash
git add -A && git commit -m "wip: mi avance"   # o: git stash -u
git switch -c mi-acto-3 acto-3
```

¿Quieres probar tu solución con las pruebas reales del acto? Tráelas del tag siguiente:

```bash
git checkout acto-3 -- src/webmcp/tools/acto-2.test.ts
npm test
```

## Guías

| Archivo | Para |
| --- | --- |
| [docs/00-prework.md](docs/00-prework.md) | Preparación (enviar una semana antes) |
| [docs/01-acto-1-incidente.md](docs/01-acto-1-incidente.md) | Acto 1 |
| [docs/02-acto-2-ojos.md](docs/02-acto-2-ojos.md) | Acto 2 |
| [docs/03-acto-3-manos.md](docs/03-acto-3-manos.md) | Acto 3 |
| [docs/04-acto-4-sabotaje.md](docs/04-acto-4-sabotaje.md) | Acto 4 |
| [docs/05-acto-5-cierre.md](docs/05-acto-5-cierre.md) | Acto 5 |
| [docs/cheatsheet.md](docs/cheatsheet.md) | Referencia de la API en una página |
| [docs/guia-instructor.md](docs/guia-instructor.md) | Guion minuto a minuto para quien dicta el taller |

## Arquitectura

```text
┌────────────────────────── Navegador (localhost:5173) ───────────────────────────┐
│                                                                                 │
│  Tienda React ──acciones──▶ store (src/store)  ◀──mismas acciones── Herramientas │
│      ▲                                                       src/webmcp/tools   │
│      │ glow "Ejecutado por agente"                                   │          │
│  AgentActivity ◀── toolactivated ── document.modelContext ◀─registerTool         │
│                                         ▲      │                                │
│                         getTools/executeTool   │                                │
│                                         │      ▼                                │
│                              Panel de chat (src/agent): ciclo del agente        │
└──────────────────────────────────────────┬──────────────────────────────────────┘
                                           │ POST /api/chat {messages, tools}
                                ┌──────────▼──────────┐
                                │ Proxy (server/)     │── Gemini (@google/genai)
                                │ o "Modo simulado"   │   la clave nunca sale de aquí
                                └─────────────────────┘
```

- **`src/webmcp/`**: polyfill con la forma de la especificación, hook de registro, herramientas y retroalimentación visual.
- **`src/agent/`**: el ciclo del agente corre **en el navegador**: `getTools()` → modelo → `executeTool()` → resultados → repetir (máximo 8 pasos).
- **`server/`**: proxy mínimo. Llama a Gemini una vez por solicitud. Nunca expone la clave.
- **`src/store/`**: estado y acciones compartidas. Las herramientas **reutilizan** las mismas acciones que los botones.

### Sobre la especificación

El código sigue el borrador del W3C WebML Community Group del 13 de noviembre de 2026:

- La API vive en `document.modelContext` (solo en contextos seguros: `https://` o `localhost`). `navigator.modelContext` está obsoleto desde Chrome 150; detectamos ambos.
- `registerTool(tool, { signal, exposedTo })`. **No existe** `unregisterTool`: se desregistra abortando el `AbortSignal`.
- `getTools()` y `executeTool()` permiten que un agente dentro de la página liste y ejecute herramientas.
- `provideContext`, `clearContext` y los recursos **fueron eliminados**: solo hay herramientas.

## Modos del agente

| Modo | Cuándo | Insignia en el panel |
| --- | --- | --- |
| Gemini | `GEMINI_API_KEY` definida en `.env` | `Gemini · gemini-3.8-flash` |
| Simulado | Sin clave, `AGENT_MODE=mock` o `npm run server:mock` | `Modo simulado` |
| Proxy del instructor | `AGENT_BASE_URL=https://…` en `.env` | Lo que reporte ese proxy |

El modelo por defecto es `gemini-3.8-flash` (cámbialo con `GEMINI_MODEL`).

## Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `npm ci` falla con `EBADENGINE` | Node < 22.12 | Instala Node 22 LTS o 24 LTS |
| Insignia "Proxy desconectado" | El proxy no arrancó o el puerto 8787 está ocupado | Revisa la terminal `[proxy]`; usa `PORT=8788` en `.env` |
| `document.modelContext` es `undefined` | No es contexto seguro (por ejemplo, IP de red local con http) | Usa `http://localhost:5173` |
| "A tool named … is already registered" | Registraste sin `signal` o sin abortar en la limpieza | Revisa `useWebMcpTools` (Acto 1) |
| El panel dice "0 herramientas" | No agregaste la herramienta a `storeTools` | `src/webmcp/tools/index.ts` |
| Error 502 en el chat | Gemini no responde (red, cuota o clave) | `AGENT_MODE=mock` o el proxy del instructor |
| El agente "real" no hace lo que esperabas | Los modelos no son deterministas | Usa los prompts exactos o el modo simulado |

## Licencia y créditos

Material del taller para DevFest Bogotá 2026. Rodada, sus marcas y sus productos son ficticios.
