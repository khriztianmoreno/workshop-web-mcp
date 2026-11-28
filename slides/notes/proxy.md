# Acto 2: conecta el modelo real

**Tiempo:** ~1 min · **Cuándo:** al empezar el Acto 2, antes del concepto.

**Guion:**
Hasta ahora usamos el Modo simulado. Ahora que el agente va a tener ojos, lo conectamos a un modelo real. [pausa]
Abran su `.env`, quiten `AGENT_MODE=mock` si lo agregaron y peguen esta línea, todo junto y sin espacios. El token está en bloques de cuatro, en dos colores, para que sea fácil leerlo.
Reinicien `npm run dev`. La insignia del panel tiene que pasar de "Modo simulado" a "Gemini". [espera a que levanten la mano]
También la pego en el chat del taller. Quien tenga su propia clave puede usar `GEMINI_API_KEY`, y quien no tenga red sigue en Modo simulado.

**El token no está en el repo:** la slide lee `VITE_ROOM_PROXY_URL` del `.env` local de la copia desde la que presentas (Git lo ignora). Sin esa variable, la slide muestra `<token>`. Si cambias el `.env`, reinicia `npm run speaker`.

**Al terminar el evento:** rota `WORKSHOP_TOKEN` en el proxy (o apágalo) y revoca la clave de Gemini.

**Si falla:** 401 = token mal copiado; 429 "desde tu conexión" = límite por IP (la sala comparte IP). Ver la tabla de diagnóstico de `docs/guia-instructor.md`.
