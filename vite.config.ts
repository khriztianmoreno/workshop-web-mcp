import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Where /api is proxied during `npm run dev`: the local proxy, or the instructor's hosted one.
  const agentTarget = env.AGENT_BASE_URL || `http://localhost:${env.PORT || 8787}`;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: agentTarget, changeOrigin: true },
      },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
      restoreMocks: true,
    },
  };
});
