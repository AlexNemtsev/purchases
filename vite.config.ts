import path from 'node:path';

import { SvelteKitPWA } from '@katama-labs/vite-pwa-sveltekit';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
// TODO: вернуть после обновления до версии 2.0.0
// import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
      },
      adapter: adapter({
        fallback: '200.html',
      }),
      serviceWorker: {
        register: false,
      },
    }),
    SvelteKitPWA({
      registerType: 'prompt',
      manifest: {
        lang: 'ru',
        name: 'Закупки',
        short_name: 'Закупки',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cacheId: 'purchases-v1',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
    },
    tsconfigPaths: true,
  },
  server: {
    open: true,
    host: true,
  },
});
