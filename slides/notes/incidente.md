# El incidente

**Tiempo:** ~50 s · **Reloj:** 0:50 → 1:40

**Guion:**
Somos el equipo de Rodada, una tienda de equipo para motociclistas. Llega un ticket de soporte: [leerlo despacio]
"Le pedí al asistente que me armara el kit: un casco certificado, guantes de pista en talla M y el cupón de bienvenida. Me respondió que lo hiciera yo directamente en la página web. ¡Estaba en la página web!" [pausa]
Esta es la conversación. Pedido concreto, respuesta amable y honesta: "no puedo agregar productos ni aplicar cupones, hazlo en la web". Y totalmente inútil: le devuelve el trabajo al cliente, y el cliente abandona el carrito.
El modelo no está fallando: no ve ni toca la página. Solo tiene el texto del chat. [señalar las tres píldoras] No ve el catálogo, no sabe qué tallas quedan, no puede actuar en la página. Es un asistente honesto pero inútil.
Hoy van a escribir lo que le falta: ojos en el Acto 2, manos en el Acto 3. Y en el Acto 3 este mismo pedido se va a ejecutar solo, en cascada. WebMCP no cura las alucinaciones: le da al agente ojos y manos.

**Transición:** "Para que pueda ver y actuar, necesitamos un agente."

**Nota:** es lo que observamos con Gemini (3 de 3 en el ensayo) y el prompt del sistema del taller, que le prohíbe inventar: "…realiza la búsqueda y la compra directamente a través de la página web de Rodada". No digas que inventa precios o stock: el problema no es que mienta, es que no puede hacer nada. Los modelos varían, así que la redacción exacta cambia; si en la sala alguno sí inventa productos o dice que ya agregó algo al carrito, el argumento es aún más fuerte. En todos los casos, no ve ni toca la página.

**Si alguien pregunta por respuestas vacías:** con cero herramientas el proxy le prohíbe al modelo llamar funciones (`toolConfig` en `NONE`), reintenta una vez y, si aun así no hay texto, responde un mensaje fijo en español ("No tengo una herramienta para consultar eso todavía…"). Nunca queda una burbuja vacía. El Modo simulado responde con el mismo "hazlo tú".

**Dato (para el final del Acto 2):** la respuesta correcta a la pregunta del catálogo es solo el Casco integral Altamira GT-R a 980.000 COP. El Nimbo Sport cumple todo salvo que la talla M está agotada.
