import type { AnnotatedTool, RegisteredTool, ToolAnnotations } from './types';

/** Missing hints mean "no": a tool without annotations is not read-only, untrusted, consequential or debug-only. */
export function normalizeAnnotations(annotations: ToolAnnotations | undefined): Required<ToolAnnotations> {
  return {
    readOnlyHint: annotations?.readOnlyHint ?? false,
    untrustedContentHint: annotations?.untrustedContentHint ?? false,
    consequentialHint: annotations?.consequentialHint ?? false,
    debugging: annotations?.debugging ?? false,
  };
}

/**
 * The one boundary where agent-side code turns getTools() output into something it can trust:
 * native WebMCP may omit `annotations` entirely, the polyfill always fills them in.
 */
export function normalizeTool(tool: RegisteredTool): AnnotatedTool {
  return { ...tool, annotations: normalizeAnnotations(tool.annotations) };
}
