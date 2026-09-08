import { defineConfig } from 'vite';
import { globSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));

// Every demo is a real HTML page: demos/<slug>/index.html.
// Rollup needs each one declared as an entry for `vite build`.
const pages = globSync('demos/*/index.html', { cwd: root });

export default defineConfig({
  base: './',
  build: {
    target: 'esnext', // top-level await, WebGPU shader modules
    rollupOptions: {
      input: {
        main: path.resolve(root, 'index.html'),
        ...Object.fromEntries(
          pages.map((p) => [p.split('/')[1], path.resolve(root, p)])
        ),
      },
    },
  },
});
