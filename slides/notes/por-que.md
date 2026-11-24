# Por qué en tu proyecto

**Tiempo:** ~45 s · **Reloj:** 3:30 → 4:15

**Guion:**
Cuatro razones para ponerlo en sus propios proyectos. [señalar cada tarjeta]
**Actúa:** su asistente deja de explicar dónde está el botón y hace lo que le piden.
**Su código:** las herramientas llaman a las mismas funciones que ya usan sus botones. No hay backend nuevo, ni otra autenticación, ni lógica duplicada que sincronizar.
**Bajo control:** ustedes deciden qué expone la página y qué no. Y le dicen al agente cómo tratar cada herramienta. [señalar las píldoras] Esta solo lee. Esta devuelve texto de terceros, no le creas. Esta tiene consecuencias. Y si algo es delicado, como pagar, la confirmación la muestra su página, no el modelo.
**Lo que viene:** ya existen agentes en el navegador que intentan operar sitios como lo haría una persona: miran la pantalla y hacen clic. Eso es lento, se rompe cuando cambia el diseño y no distingue "ver tallas" de "pagar". Si su página ya declara sus herramientas, esos agentes pueden usar las mismas, sin trabajo extra. [pausa]
De un asistente que responde a uno que actúa.

**Dato del repo:** en la tienda, `checkout` lleva `consequentialHint` y abre el diálogo de confirmación de la propia página; las herramientas que devuelven reseñas llevan `untrustedContentHint`. Lo van a escribir en los Actos 3 y 4.

**Ojo:** no digas que la gente ya compra con agentes del navegador. Es lo que viene, no el presente.

**Transición:** "¿Y cómo se ve una herramienta por dentro?"
