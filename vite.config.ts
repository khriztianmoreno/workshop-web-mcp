import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { guideContent } from './guide/build/content.ts';

const page = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Where /api is proxied during `npm run dev`: the local proxy, or the instructor's hosted one.
  const agentTarget = env.AGENT_BASE_URL || `http://localhost:${env.PORT || 8787}`;

  return {
    // Tailwind only processes slides/src/deck.css (the store's CSS has no Tailwind directives).
    // guideContent renders docs/*.md for the /guide page at build time.
    plugins: [react(), tailwindcss(), guideContent(page('./docs'))],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: agentTarget, changeOrigin: true },
      },
    },
    build: {
      // Multi-page: the store, the opening deck (/slides/) with its speaker view, and the live guide (/guide/).
      rolldownOptions: {
        input: {
          main: page('./index.html'),
          slides: page('./slides/index.html'),
          speaker: page('./slides/speaker.html'),
          guide: page('./guide/index.html'),
        },
      },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
      restoreMocks: true,
    },
  };
});
