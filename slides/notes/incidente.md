# El incidente

**Tiempo:** ~50 s · **Reloj:** 0:40 → 1:30

**Guion:**
Somos el equipo de Rodada, una tienda de equipo para motociclistas. Producto nos pidió un asistente de IA dentro de la tienda. Lo lanzamos: es ese panel de chat que está a la derecha de la página. [pausa]
Y llega el primer ticket: [leerlo despacio]
"Le pedí al asistente: agrega un casco ECE y guantes talla M, y aplica el cupón. Me respondió: no puedo agregar productos ni aplicar cupones, hazlo en la web. ¡Estaba en la web!"
Miren la conversación. El cliente sabe exactamente lo que quiere. El asistente es amable y honesto: "no puedo agregar productos ni aplicar cupones, hazlo en la web". Y es totalmente inútil: le devuelve el trabajo al cliente, y el cliente abandona el carrito.
Ojo, el modelo no está fallando. [señalar las tres píldoras] No ve el catálogo, no sabe qué tallas quedan y no puede tocar nada en la página. Solo sabe responder texto.
¿Les suena? Es el chatbot que muchos ya lanzamos: te explica cuánto cuesta el envío, pero si le dices "agrégalo al carrito" o "cámbiame la dirección", te responde "puedes hacerlo desde el menú".

**Transición:** "¿Y por qué casi ningún asistente pasa de ahí?"

**Nota:** la conversación de la slide es exactamente lo que verán en la tienda en `acto-1` con el `.env` vacío (Modo simulado): mismo pedido, misma respuesta. No digas que inventa precios o stock: el problema no es que mienta, es que no puede hacer nada. Con Gemini (desde el Acto 2) la redacción varía, pero el punto es el mismo: no ve ni toca la página.

**Si alguien pregunta por respuestas vacías:** con cero herramientas el proxy le prohíbe al modelo llamar funciones (`toolConfig` en `NONE`), reintenta una vez y, si aun así no hay texto, responde un mensaje fijo en español ("No tengo una herramienta para consultar eso todavía…"). Nunca queda una burbuja vacía. El Modo simulado responde el mismo "hazlo tú" de la slide.

**Dato (para el final del Acto 2):** la respuesta correcta a la pregunta del catálogo es solo el Casco integral Altamira GT-R a 980.000 COP. El Nimbo Sport cumple todo salvo que la talla M está agotada.
