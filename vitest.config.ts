import path from 'node:path';

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { $lib: path.resolve('./src/lib') },
  },
  plugins: [svelte({ compilerOptions: { runes: true } })],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
