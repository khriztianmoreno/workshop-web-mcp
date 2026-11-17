import type { ModelContextTool } from '../types';

/** Calls a tool's execute() the way document.modelContext would. */
export async function run<I>(tool: ModelContextTool<I>, input: I, signal = new AbortController().signal): Promise<any> {
  return tool.execute(input, { signal });
}
