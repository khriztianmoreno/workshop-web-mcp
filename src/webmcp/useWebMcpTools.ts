import { useEffect } from 'react';
import type { ModelContextTool } from './types';

/**
 * Registers WebMCP tools while the component is mounted.
 *
 * - One AbortController per effect run: aborting its signal unregisters every tool
 *   (the spec has no unregisterTool()).
 * - StrictMode-safe: React mounts, cleans up (abort → tools removed) and mounts again,
 *   so names never collide.
 */
export function useWebMcpTools(tools: readonly ModelContextTool[]): void {
  useEffect(() => {
    const modelContext = document.modelContext ?? navigator.modelContext;
    if (!modelContext) return;

    const controller = new AbortController();
    for (const tool of tools) {
      modelContext.registerTool(tool, { signal: controller.signal }).catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(`[webmcp] Could not register "${tool.name}"`, error);
      });
    }
    return () => controller.abort();
  }, [tools]);
}
