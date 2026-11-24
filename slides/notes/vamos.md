# ¡A rodar! Acto 1

**Tiempo:** ~30 s · **Reloj:** 8:30 → 9:00

**Guion:**
Seis minutos de práctica. La guía es `docs/01-acto-1-incidente.md`.
1. Reproduzcan el incidente con el botón "Acto 3 · Prompt jefe". Sí, es el del Acto 3: es exactamente lo que van a lograr que ejecute. Hoy, lo más probable es que les responda que lo hagan ustedes en la web; la redacción cambia según el modelo.
2. Escriban el hook `useWebMcpTools` con `AbortSignal`.
3. Registren `get_store_info` y agréguenla a `storeTools`.
4. Verifiquen con el botón "Acto 1 · Horario": la píldora brilla y dice "Ejecutado por agente". [pausa]
¡Vamos!

**Ahora:** sal de las slides a la tienda en `acto-1` y sigue el guion del Acto 1 en `docs/guia-instructor.md` desde el minuto 9.

**Prompt de demo (exacto, también en `shared/demo-prompts.ts`):**

```text
Busca un casco certificado por menos de 1.200.000 COP, agrégalo en talla M junto con unos guantes de pista talla M, aplica el cupón de bienvenida y abre el carrito.
```

**Hito:** `get_store_info` en "Completado" y respuesta: lunes a sábado de 9:00 a 19:00; envío fuera de Bogotá 18.000 COP.
