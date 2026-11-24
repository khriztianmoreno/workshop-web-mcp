# El incidente

**Tiempo:** ~50 s · **Reloj:** 0:40 → 1:30

**Guion:**
Somos el equipo de Rodada, una tienda de equipo para motociclistas. Producto nos pidió un asistente de IA dentro de la tienda. Lo lanzamos: es ese panel de chat que está a la derecha de la página. [pausa]
Y llega el primer ticket: [leerlo despacio]
"Le pedí al asistente que me armara el kit: un casco certificado, guantes de pista en talla M y el cupón de bienvenida. Me respondió que lo hiciera yo directamente en la página web. ¡Estaba en la página web!"
Miren la conversación. El cliente sabe exactamente lo que quiere. El asistente es amable y honesto: "no puedo agregar productos ni aplicar cupones, hazlo en la web". Y es totalmente inútil: le devuelve el trabajo al cliente, y el cliente abandona el carrito.
Ojo, el modelo no está fallando. [señalar las tres píldoras] No ve el catálogo, no sabe qué tallas quedan y no puede tocar nada en la página. Solo sabe responder texto.
¿Les suena? Es el chatbot que muchos ya lanzamos: te explica cuánto cuesta el envío, pero si le dices "agrégalo al carrito" o "cámbiame la dirección", te responde "puedes hacerlo desde el menú".

**Transición:** "¿Y por qué casi ningún asistente pasa de ahí?"

**Nota:** es lo que observamos con Gemini (3 de 3 en el ensayo) y el prompt del sistema del taller, que le prohíbe inventar: "…realiza la búsqueda y la compra directamente a través de la página web de Rodada". No digas que inventa precios o stock: el problema no es que mienta, es que no puede hacer nada. Los modelos varían, así que la redacción exacta cambia; si en la sala alguno sí inventa productos o dice que ya agregó algo al carrito, el argumento es aún más fuerte. En todos los casos, no ve ni toca la página.

**Si alguien pregunta por respuestas vacías:** con cero herramientas el proxy le prohíbe al modelo llamar funciones (`toolConfig` en `NONE`), reintenta una vez y, si aun así no hay texto, responde un mensaje fijo en español ("No tengo una herramienta para consultar eso todavía…"). Nunca queda una burbuja vacía. El Modo simulado responde con el mismo "hazlo tú".

**Dato (para el final del Acto 2):** la respuesta correcta a la pregunta del catálogo es solo el Casco integral Altamira GT-R a 980.000 COP. El Nimbo Sport cumple todo salvo que la talla M está agotada.
