import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  // GitHub Pages test → '/ANAS-QUALITY/' | Produzione ANAS → '/'
  base: '/ANAS-QUALITY/',

  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],

      manifest: {
        name:             'Verbali Cantiere ANAS',
        short_name:       'Verbali',
        description:      'Gestione verbali di ispezione cantiere ANAS',
        theme_color:      '#0F1D2E',
        background_color: '#080E1A',
        display:          'standalone',
        orientation:      'portrait',
        start_url:        '/ANAS-QUALITY/',
        scope:            '/ANAS-QUALITY/',
        lang:             'it',
        icons: [
          {
            src:     'icons/icon-192x192.png',
            sizes:   '192x192',
            type:    'image/png',
          },
          {
            src:     'icons/icon-512x512.png',
            sizes:   '512x512',
            type:    'image/png',
          },
          {
            src:     'icons/icon-maskable-512x512.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        runtimeCaching: [
          {
            // Graph API: network-first, fallback cache, timeout 10s
            urlPattern: /^https:\/\/graph\.microsoft\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName:            'graph-api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse:    { statuses: [0, 200] },
            },
          },
          {
            // MSAL auth endpoints: network-only (token sempre freschi)
            urlPattern: /^https:\/\/login\.microsoftonline\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Font Google: cache-first (cambiano raramente)
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName:  'google-fonts-cache',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
