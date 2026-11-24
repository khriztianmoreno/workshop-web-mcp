# Avance: inyección de prompts

**Tiempo:** ~20 s · **Reloj:** 5:25 → 5:45

**Guion:**
Cuando le damos manos a un agente, el riesgo no es el usuario: él ya puede hacer clic en los botones.
El riesgo es **el texto que el agente lee**: contenido de terceros que intenta darle órdenes. Eso se llama inyección de prompts. Y las anotaciones ayudan, pero son pistas, no controles. [pausa]
Guarden esta idea. En el Acto 4 alguien va a intentar darle órdenes a su agente.

**No revelar:** ni dónde está el ataque (la reseña) ni qué producto lo tiene. La sorpresa es parte del Acto 4.

**No prometas que el ataque va a funcionar.** Di "va a intentar", nunca "va a lograr". En nuestras mediciones la inyección de la reseña no tuvo éxito con modelos actuales (0 de 60 en 12 modelos con el prompt del sistema completo; 0 de 25 con un prompt ingenuo), y en el ensayo Gemini incluso detectó la instrucción y la descartó. Puede salir o no según el modelo y el día. El mensaje del Acto 4 es la defensa en profundidad que **no depende del modelo**: `untrustedContentHint`, el límite acumulado de cantidad en `add_to_cart` y `checkout` con `consequentialHint` más el diálogo de confirmación de la propia página. Si quieres ver el ataque de forma reproducible, el Modo simulado obedece la reseña mientras no esté marcada como no confiable.

**Dato del repo:** el panel muestra las respuestas del modelo como markdown saneado: sin HTML crudo, sin imágenes y solo enlaces `http`/`https`. Una imagen en markdown se cargaría sola y podría sacar datos en la URL.

**Transición:** "Una última pregunta que siempre me hacen: ¿esto reemplaza a MCP?"
