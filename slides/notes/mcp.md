# Qué es MCP

**Tiempo:** ~45 s · **Reloj:** 4:15 → 5:00

**Guion:**
MCP, Model Context Protocol, es un protocolo para exponer herramientas a los modelos.
De un lado hay un **cliente**: la app que tiene el modelo. Un chat, tu IDE, un agente.
Del otro, un **servidor MCP**: un proceso aparte que dice "estas son mis herramientas" y las ejecuta cuando se las piden.
El cliente pregunta qué hay (`tools/list`) y llama lo que necesita (`tools/call`). [pausa]
Fíjense dónde quedan las herramientas: del lado del servidor, con su propio despliegue y su propia autenticación.

**Ruta corta:** si vas tarde, salta esta slide y di una frase en `brecha`: "MCP pone las herramientas en un servidor aparte".

**Transición:** "Eso funciona muy bien para backends. Pero piensen en una tienda web…"
