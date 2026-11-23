/**
 * Code shown on the slides. Kept in sync by hand with the workshop sources:
 * - REGISTER_TOOL: docs/01-acto-1-incidente.md (console experiment) and
 *   src/webmcp/tools/get-store-info.ts, written against the raw spec API.
 * - SETUP and CATCH_UP: README.md ("Inicio rápido" and "Mapa de tags").
 */

export const REGISTER_TOOL = `
const controller = new AbortController();

await document.modelContext.registerTool(
  {
    name: 'get_store_info',
    description: 'Returns opening hours, shipping costs, payment methods…',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    async execute() {
      return STORE_INFO; // the same data the page already renders
    },
  },
  { signal: controller.signal },
);

controller.abort(); // unregisters it: there is no unregisterTool()
`;

export const SETUP = `
node -v                          # 22.12 o superior
git switch -c mi-taller acto-1   # empieza desde el Acto 1
npm ci
cp env.example .env              # opcional: agrega GEMINI_API_KEY
npm run check                    # verifica tu entorno
npm run dev                      # abre http://localhost:5173
`;

export const CATCH_UP = `
# guarda tu avance (o: git stash -u)
git add -A && git commit -m "wip: mi avance"
git switch -c mi-acto-3 acto-3
`;
