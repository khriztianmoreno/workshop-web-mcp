import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { installWebMcp } from './webmcp/polyfill';
import { storeTools } from './webmcp/tools';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  delete (document as { modelContext?: unknown }).modelContext;
  document.body.innerHTML = '';
});

describe('<App /> smoke test', () => {
  it('renders the store and registers every tool exactly once under StrictMode', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, mode: 'mock' }))));
    const { modelContext } = installWebMcp();
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <App webMcpMode="polyfill" />
        </StrictMode>,
      );
    });

    expect(container.textContent).toContain('Rodada');
    expect(container.querySelectorAll('.card').length).toBeGreaterThan(10);
    expect((await modelContext.getTools()).map((tool) => tool.name)).toEqual(storeTools.map((tool) => tool.name));

    await act(async () => root.unmount());
    expect(await modelContext.getTools()).toEqual([]);
  });
});
