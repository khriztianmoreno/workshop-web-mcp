# ¡A rodar! Acto 1

**Tiempo:** ~30 s · **Reloj:** 8:30 → 9:00

**Guion:**
Seis minutos de práctica. La guía es `docs/01-acto-1-incidente.md`.
1. Primero, vean el problema con sus propios ojos: con el `.env` vacío (Modo simulado), escriban el pedido de la slide, "Agrega un casco ECE y guantes talla M, y aplica el cupón." Les va a responder lo mismo que vieron: "No puedo agregar productos ni aplicar cupones. Hazlo en la web." Si clonaron antes, primero `git fetch origin --tags --force`.
2. Escriban el hook `useWebMcpTools` con `AbortSignal`.
3. Registren `get_store_info` y agréguenla a `storeTools`.
4. Verifiquen con el botón "Acto 1 · Horario": la píldora brilla y dice "Ejecutado por agente". [pausa]
¡Vamos!

**Ahora:** sal de las slides a la tienda en `acto-1` y sigue el guion del Acto 1 en `docs/guia-instructor.md` desde el minuto 9.

**Prompt de demo (exacto, el de la slide del incidente):**

```text
Agrega un casco ECE y guantes talla M, y aplica el cupón.
```

**Respuesta esperada (Modo simulado):** "No puedo agregar productos ni aplicar cupones. Hazlo en la web."

**Hito:** `get_store_info` en "Completado" y respuesta: lunes a sábado de 9:00 a 19:00; envío fuera de Bogotá 18.000 COP.
