import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeNativeModelContext } from '../webmcp/fake-native';
import { installWebMcp, NativeAnnotatedModelContext } from '../webmcp/polyfill';
import type { ModelContext, ModelContextTool } from '../webmcp/types';
import { ChatPanel } from './ChatPanel';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  delete (document as { modelContext?: unknown }).modelContext;
  document.body.innerHTML = '';
});

function tool(name: string, annotations?: ModelContextTool['annotations']): ModelContextTool {
  return { name, description: name, annotations, execute: async () => ({ ok: true }) };
}

async function renderPanelWith(modelContext: ModelContext) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, mode: 'mock' }))));
  await modelContext.registerTool(tool('get_cart', { readOnlyHint: true }));
  await modelContext.registerTool(tool('get_product_reviews', { readOnlyHint: true, untrustedContentHint: true }));
  await modelContext.registerTool(tool('checkout', { consequentialHint: true }));
  await modelContext.registerTool(tool('no_hints'));

  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(<ChatPanel onClose={() => {}} />));
  const toggle = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('herramientas WebMCP'));
  await act(async () => toggle?.click());
  return { container, root };
}

function hintsByTool(container: HTMLElement): Record<string, string[]> {
  return Object.fromEntries(
    [...container.querySelectorAll('.chat__tools li')].map((li) => [
      li.querySelector('code')?.textContent ?? '',
      [...li.querySelectorAll('.hint')].map((hint) => hint.textContent ?? ''),
    ]),
  );
}

describe('<ChatPanel /> tool list', () => {
  it('renders hints on native WebMCP even though native getTools() drops annotations', async () => {
    Object.defineProperty(document, 'modelContext', { value: new FakeNativeModelContext(), configurable: true });
    const { modelContext } = installWebMcp({ forcePolyfill: false });
    const { container, root } = await renderPanelWith(modelContext);

    expect(hintsByTool(container)).toEqual({
      get_cart: ['solo lectura'],
      get_product_reviews: ['solo lectura', 'no confiable'],
      checkout: ['consecuente'],
      no_hints: [],
    });
    await act(async () => root.unmount());
  });

  it('renders native tools registered outside the adapter (no annotations at all) without crashing', async () => {
    // Registered straight on the browser context: the adapter never saw the annotations.
    const native = new FakeNativeModelContext();
    Object.defineProperty(document, 'modelContext', {
      value: new NativeAnnotatedModelContext(native as unknown as ModelContext),
      configurable: true,
    });
    const { container, root } = await renderPanelWith(native as unknown as ModelContext);

    expect(Object.keys(hintsByTool(container))).toEqual(['get_cart', 'get_product_reviews', 'checkout', 'no_hints']);
    expect(container.querySelectorAll('.chat__tools .hint')).toHaveLength(0);
    await act(async () => root.unmount());
  });
});
