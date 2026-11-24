# Preparación previa · Taller WebMCP

> Envía este documento **una semana antes** del taller. Toma unos 15 minutos.
> El día del evento la red puede estar saturada: llega con todo instalado.

## 1. Instala las herramientas

| Herramienta | Versión mínima | Verifica con |
| --- | --- | --- |
| Node.js | 22.12 (recomendado 22 LTS o 24 LTS) | `node -v` |
| Git | cualquiera reciente | `git --version` |
| Google Chrome | actualizado | `chrome://version` |
| Editor | VS Code, WebStorm, Neovim… | — |

> ¿Por qué Node 22.12? Vite 8 y Vitest 5 lo requieren. Node 20 ya no recibe soporte.

## 2. Clona e instala

```bash
git clone <URL-del-repositorio> workshop-web-mcp
cd workshop-web-mcp
git switch -c mi-taller acto-1   # your own branch, starting at the Act 1 tag
npm ci                           # exact versions from package-lock.json
```

**Cómo funciona**

- `git clone … workshop-web-mcp` descarga el repositorio en la carpeta `workshop-web-mcp`, con todas sus ramas y tags (`acto-1` … `acto-4`, `final`).
- `git switch -c mi-taller acto-1` crea **tu propia rama** `mi-taller` a partir del tag `acto-1` (el punto de partida del taller) y te cambia a ella. Un tag es una foto fija: trabajar en tu rama evita perder cambios y te deja comparar con los tags de solución.
- `npm ci` instala exactamente las versiones de `package-lock.json`, borrando antes `node_modules`. A diferencia de `npm install`, nunca actualiza el lockfile, así todos tienen las mismas dependencias.

## 3. Configura el entorno (opcional pero recomendado)

```bash
cp env.example .env
```

**Cómo funciona**

- Copia la plantilla `env.example` (versionada, sin secretos) a `.env`, que es el archivo que leen el proxy (`server/`) y Vite. Así tu clave queda en un archivo local que Git ignora.
- `GEMINI_API_KEY` activa un modelo real a través del proxy local; `AGENT_BASE_URL` hace que Vite reenvíe las llamadas a `/api` hacia el proxy del instructor (la URL incluye el token `/t/<token>`). Si dejas ambas vacías, el proxy usa el agente simulado.

Abre `.env`. Tienes tres opciones para el asistente:

| Opción | Qué hacer | Resultado |
| --- | --- | --- |
| **A. Tu clave de Gemini** | Crea una clave gratuita en [aistudio.google.com/apikey](https://aistudio.google.com/apikey) y pégala en `GEMINI_API_KEY=` | Un modelo real responde |
| **B. Proxy del instructor** | El día del taller te daremos una URL para `AGENT_BASE_URL=` | Un modelo real, sin clave propia |
| **C. Nada** | Deja todo vacío | "Modo simulado": funciona sin internet |

Las tres opciones sirven para completar el taller.

> Nunca subas tu `.env` a Git. Ya está en `.gitignore`.

## 4. Verifica

```bash
npm run check
```

**Cómo funciona**

- Ejecuta `scripts/check-env.mjs`: revisa la versión de Node, que existan las dependencias y el `.env`, qué modo de asistente usarás (clave propia, proxy del instructor o simulado) y si el proxy responde.
- No modifica nada; solo diagnostica. Por eso es lo primero que te pediremos si algo falla.

Deberías ver algo así:

```text
✔ Node 22.x.x
✔ Dependencias instaladas
✔ Archivo .env encontrado
⚠ Sin GEMINI_API_KEY: el proxy usará el "Modo simulado".
⚠ El proxy local (http://localhost:8787) no está corriendo.
Todo listo (con 2 aviso(s)).
```

**Cómo leerlo:** cada línea es una comprobación. ✔ está bien, ⚠ es un aviso que no bloquea (aquí: sin clave se usa el modo simulado, y el proxy todavía no está encendido porque no corriste `npm run dev`), ✖ es un error que debes resolver.

Los avisos (⚠) no bloquean. Los errores (✖) sí: resuélvelos antes del taller.

## 5. Prueba la app

```bash
npm run dev
```

**Cómo funciona**

- Arranca dos procesos a la vez con `concurrently`: `web` (Vite, la tienda en `http://localhost:5173`) y `proxy` (el servidor de `server/` en `http://localhost:8787`, que habla con Gemini o con el agente simulado).
- Vite reenvía las peticiones a `/api` hacia el proxy, así la clave nunca llega al navegador. Ambos procesos se recargan solos al guardar; `Ctrl+C` detiene los dos.

Abre [http://localhost:5173](http://localhost:5173). Debes ver la tienda Rodada y, a la derecha, el panel **Asistente Rodada** con la insignia "Modo simulado" o "Gemini · …". Con la app encendida, vuelve a correr `npm run check` en otra terminal: el aviso del proxy debe desaparecer.

## 6. (Opcional) WebMCP nativo en Chrome

1. Abre `chrome://flags/#enable-webmcp-testing`.
2. Actívala y reinicia Chrome.
3. En la app, la píldora superior debe decir "WebMCP nativo" en lugar de "WebMCP polyfill".

Sin la flag no pasa nada: el taller usa un polyfill con la misma forma de la especificación.

## 7. Lectura sugerida (10 minutos)

- Qué es una herramienta para un modelo de lenguaje (function calling).
- Qué es la **inyección de prompts** (prompt injection): instrucciones escondidas en contenido que el modelo lee.

## Lista de verificación

- [ ] `node -v` muestra 22.12 o superior
- [ ] `npm ci` terminó sin errores
- [ ] `npm run check` termina con "Todo listo"
- [ ] `npm run dev` abre la tienda en `localhost:5173`
- [ ] (Opcional) Tengo `GEMINI_API_KEY` en `.env`
- [ ] Traigo cargador

¿Problemas? Escribe al canal del taller con la salida de `npm run check`.
