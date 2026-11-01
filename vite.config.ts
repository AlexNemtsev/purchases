import path from 'node:path';

import { SvelteKitPWA } from '@katama-labs/vite-pwa-sveltekit';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
// TODO: вернуть после обновления до версии 2.0.0
// import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

const isValidBasePath = (value: string): value is '' | `/${string}` =>
  value === '' || /^\/[A-Za-z0-9][A-Za-z0-9._~-]*(?:\/[A-Za-z0-9][A-Za-z0-9._~-]*)*$/u.test(value);

const basePath = process.env.BASE_PATH ?? '';

if (!isValidBasePath(basePath)) {
  throw new Error('BASE_PATH must be empty or a slash-prefixed path without a trailing slash');
}

const appScope = basePath ? `${basePath}/` : '/';
const publicAsset = (fileName: string) => `${basePath}/${fileName}`;

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
      paths: {
        base: basePath,
      },
      serviceWorker: {
        register: false,
      },
    }),
    SvelteKitPWA({
      base: appScope,
      scope: appScope,
      registerType: 'prompt',
      manifest: {
        lang: 'ru',
        name: 'Закупки',
        short_name: 'Закупки',
        start_url: appScope,
        scope: appScope,
        icons: [
          {
            src: publicAsset('icon-192.png'),
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: publicAsset('icon-512.png'),
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: publicAsset('icon-maskable-192.png'),
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: publicAsset('icon-maskable-512.png'),
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cacheId: 'purchases-v1',
        cleanupOutdatedCaches: true,
        navigateFallback: `${appScope}200.html`,
        globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest,woff2}'],
        modifyURLPrefix: {},
      },
      kit: {
        adapterFallback: '200.html',
        spa: true,
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
