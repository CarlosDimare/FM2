import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/FM2/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['*.svg'],
          manifest: {
            name: 'FM Argentina',
            short_name: 'FM',
            description: 'Football Manager Argentina - Simulador de fútbol',
            theme_color: '#94a3b8',
            background_color: '#94a3b8',
            display: 'standalone',
            orientation: 'portrait',
            start_url: '/FM2/',
            icons: [
              {
                src: '/FM2/icon-192.svg',
                sizes: '192x192',
                type: 'image/svg+xml'
              },
              {
                src: '/FM2/icon-512.svg',
                sizes: '512x512',
                type: 'image/svg+xml'
              },
              {
                src: '/FM2/icon-512.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
            maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
            runtimeCaching: [{
              urlPattern: /^https:\/\/flagcdn\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'flag-cdn',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              }
            }, {
              urlPattern: /\/data\/.*\.json$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'fm-data-json',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              }
            }]
          },
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
