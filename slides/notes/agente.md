# Qué es un agente

**Tiempo:** ~1 min · **Reloj:** 3:15 → 4:15

**Guion:**
Un agente es tres cosas juntas. [señalar cada tarjeta]
Un **modelo**, que entiende el pedido y decide.
**Herramientas**: funciones con nombre, descripción y un esquema de entrada.
Y un **ciclo**: el modelo pide una herramienta, alguien la ejecuta, el resultado vuelve al modelo, y se repite hasta tener la respuesta. [recorrer la fila de abajo]
El modelo nunca ejecuta nada él mismo: solo pide. Quien ejecuta es el código que corre el ciclo.

**Dato del repo:** en nuestro panel ese ciclo vive en `src/agent/agent-loop.ts` y corta en 8 pasos (`MAX_AGENT_STEPS`).

**Si el público ya lo sabe (termómetro):** "Esto ya lo conocen: function calling. La pregunta interesante es *de dónde salen las herramientas*." Y avanza.

**Transición:** "¿Y de dónde salen hoy las herramientas? La respuesta más popular se llama MCP."
