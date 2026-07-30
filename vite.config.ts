import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { GOATCOUNTER_SITE_CODE } from './src/config/analytics';

// GitHub Pages project site is served from /warpedmtl/ — lowercase on
// purpose, Pages paths are case-sensitive and the repo name is the path.
const BASE = '/warpedmtl/';

// Build stamp shown in About + the update toast so "did the update land?" is
// answerable on a phone over flaky festival Wi-Fi.
function buildHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  base: BASE,
  define: {
    __BUILD_HASH__: JSON.stringify(buildHash()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      // GoatCounter, cookieless. The <script> tag only exists in the built
      // page when a site code is configured in src/config/analytics.ts — with
      // the placeholder empty string the HTML carries no analytics reference
      // at all: zero requests, nothing to opt out of. The script is
      // cross-origin (gc.zgo.at) on purpose; see the runtimeCaching note
      // below for why the service worker must never touch it.
      name: 'goatcounter-snippet',
      transformIndexHtml() {
        if (!GOATCOUNTER_SITE_CODE) return [];
        return [
          {
            tag: 'script',
            attrs: {
              'data-goatcounter': `https://${GOATCOUNTER_SITE_CODE}.goatcounter.com/count`,
              async: true,
              src: 'https://gc.zgo.at/count.js',
            },
            injectTo: 'head',
          },
        ];
      },
    },
    VitePWA({
      registerType: 'prompt',
      injectRegister: null, // we register manually in src/pwa.ts
      includeAssets: [
        'icons/apple-touch-icon-180.png',
        'icons/favicon.svg',
        'map/festival-map.webp',
      ],
      manifest: {
        id: BASE,
        name: 'Warped MTL Companion (Unofficial)',
        short_name: 'Warped MTL',
        // One French sentence at the end — the app is English (decided, not
        // deferred) and the store card should say so before anyone installs.
        // Native-review window Aug 8–14 may amend the wording.
        description:
          "Unofficial offline planner for Vans Warped Tour Montréal 2026. Pick bands, spot clashes, share plans by code. Everything stays on your phone. Planificateur non officiel et hors ligne — l'appli est en anglais.",
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b2f6b',
        theme_color: '#0b2f6b',
        categories: ['music', 'lifestyle', 'travel'],
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Every cache name is namespaced to this app. GitHub Pages serves
        // every Warped instance on this account — the Long Beach app included
        // — from the same origin, and origin, not path, is the Cache Storage
        // boundary, so a shared name would let two installs overwrite each
        // other on one phone.
        cacheId: 'warpedmtl-public',
        // Precache the entire built app shell + all static assets (js/css/html/img/fonts).
        globPatterns: ['**/*.{js,css,html,webp,png,svg,woff,woff2,ico,json,webmanifest}'],
        // iOS fetches launch images itself at Add-to-Home-Screen time; they're
        // never requested by the app, so keep them out of the offline precache.
        globIgnores: ['**/art/splash/**'],
        // The festival map is large; make sure it is precached.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /\/[^/?]+\.[^/]+$/],
        clientsClaim: true,
        skipWaiting: false,
        runtimeCaching: [
          {
            // Any GET under our own base path that we didn't precache: cache-first.
            // Scoped to BASE rather than the whole origin so this app never
            // caches a sibling app's assets (same origin, different path).
            // The scoping ALSO keeps analytics honest: GoatCounter's count.js
            // and count pixel are cross-origin (gc.zgo.at / goatcounter.com)
            // and match no rule here, so the SW never caches or replays them
            // — a cached script would ship analytics into the offline bundle,
            // and a cached pixel would swallow beacons while looking sent.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith(BASE),
            handler: 'CacheFirst',
            options: {
              cacheName: 'warpedmtl-public-runtime',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // SW only in production build (avoids dev caching headaches)
      },
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
  },
});
