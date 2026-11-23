import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { guideContent } from './guide/build/content.ts';

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/**
 * Standalone build of the live guide (`npm run build:guide` → dist-guide/).
 * It only depends on docs/*.md, so it can be published before or after the act tags.
 *
 * GUIDE_BASE sets the public path. The default './' (relative) works at any URL,
 * including a GitHub Pages project site such as https://<user>.github.io/<repo>/.
 */
export default defineConfig({
  root: dir('./guide'),
  base: process.env.GUIDE_BASE || './',
  publicDir: false,
  plugins: [guideContent(dir('./docs'))],
  build: {
    outDir: dir('./dist-guide'),
    emptyOutDir: true,
  },
});
