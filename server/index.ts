import { serve } from '@hono/node-server';
import { createApp } from './app';
import { ConfigError, configWarnings, loadConfig, type ServerConfig } from './config';

let config: ServerConfig;
try {
  config = loadConfig();
} catch (error) {
  if (!(error instanceof ConfigError)) throw error;
  console.error(`[proxy] Refusing to start: ${error.message}`);
  process.exit(1);
}

for (const warning of configWarnings(config)) console.warn(`[proxy] WARNING: ${warning}`);

const app = createApp(config);

serve({ fetch: app.fetch, port: config.port }, (info) => {
  const mode = config.mode === 'mock' ? 'MODO SIMULADO' : `Gemini (${config.model})`;
  console.log(`[proxy] http://localhost:${info.port}/api · ${mode}`);
  console.log(`[proxy] ${config.reason}`);
  if (config.workshopToken) {
    console.log(
      `[proxy] Hosted mode: ${config.rateLimitPerClient}/min per client, ${config.rateLimitGlobal}/min global, ` +
        `TRUST_PROXY=${config.trustProxyHops}, body ≤ ${Math.floor(config.maxBodyBytes / 1024)} KB.`,
    );
  }
});
