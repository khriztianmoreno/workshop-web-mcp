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
git switch -c mi-taller acto-1
npm ci
```

## 3. Configura el entorno (opcional pero recomendado)

```bash
cp env.example .env
```

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

Deberías ver algo así:

```text
✔ Node 22.x.x
✔ Dependencias instaladas
✔ Archivo .env encontrado
⚠ Sin GEMINI_API_KEY: el proxy usará el "Modo simulado".
⚠ El proxy local (http://localhost:8787) no está corriendo.
Todo listo (con 2 aviso(s)).
```

Los avisos (⚠) no bloquean. Los errores (✖) sí: resuélvelos antes del taller.

## 5. Prueba la app

```bash
npm run dev
```

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
