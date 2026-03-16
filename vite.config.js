import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/beat-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'BEAT — Band Entry & Attendance Tracker',
        short_name: 'BEAT',
        description: 'Catat absensi latihan band dan perkembangan skill anggota',
        theme_color: '#0f0f0f',
        background_color: '#0f0f0f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/beat-app/',
        icons: [
          { src: '/beat-app/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/beat-app/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/sheets\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: { cacheName: 'sheets-api', networkTimeoutSeconds: 10 }
          }
        ]
      }
    })
  ]
})
