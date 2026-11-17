import { serve } from '@hono/node-server';
import { createApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();
const app = createApp(config);

serve({ fetch: app.fetch, port: config.port }, (info) => {
  const mode = config.mode === 'mock' ? 'MODO SIMULADO' : `Gemini (${config.model})`;
  console.log(`[proxy] http://localhost:${info.port}/api · ${mode}`);
  console.log(`[proxy] ${config.reason}`);
});
