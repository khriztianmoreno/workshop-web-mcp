import type { ModelContextTool } from './types';

/**
 * TODO(acto-1): register every tool with document.modelContext while the component is mounted.
 *   - Feature-detect: document.modelContext ?? navigator.modelContext
 *   - Inside a useEffect: one AbortController per run, registerTool(tool, { signal })
 *   - Cleanup: controller.abort() (there is no unregisterTool in the spec)
 *   - Must survive React StrictMode (mount → cleanup → mount)
 * Guide: docs/01-acto-1-incidente.md
 */
export function useWebMcpTools(tools: readonly ModelContextTool[]): void {
  void tools;
}
