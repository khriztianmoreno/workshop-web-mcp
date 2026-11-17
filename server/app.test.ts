// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { loadConfig } from './config';

const mockConfig = loadConfig({ AGENT_MODE: 'mock' }, []);

describe('proxy app', () => {
  it('falls back to mock mode when there is no API key', () => {
    expect(loadConfig({}, []).mode).toBe('mock');
    expect(loadConfig({ GEMINI_API_KEY: 'x' }, []).mode).toBe('gemini');
    expect(loadConfig({ GEMINI_API_KEY: 'x' }, ['--mock']).mode).toBe('mock');
  });

  it('GET /api/health reports the mode', async () => {
    const response = await createApp(mockConfig).request('/api/health');
    expect(await response.json()).toMatchObject({ ok: true, mode: 'mock' });
  });

  it('POST /api/chat answers in mock mode', async () => {
    const response = await createApp(mockConfig).request('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: '¿Qué cascos hay en talla M?' }],
        tools: [{ name: 'search_products', description: 'search' }],
      }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.mode).toBe('mock');
    expect(body.functionCalls[0].name).toBe('search_products');
  });

  it('rejects malformed bodies', async () => {
    const response = await createApp(mockConfig).request('/api/chat', { method: 'POST', body: '{"messages":[]}' });
    expect(response.status).toBe(400);
  });

  it('never leaks the API key in health', async () => {
    const config = loadConfig({ GEMINI_API_KEY: 'secret-key' }, []);
    const response = await createApp(config, () => ({ mode: 'gemini', functionCalls: [] })).request('/api/health');
    expect(await response.text()).not.toContain('secret-key');
  });
});
