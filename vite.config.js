import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://www.24baby.nl',
        changeOrigin: true,
        rewrite: (path) => {
          // /api/baby-content?slug=baby-5-weken-oud → /baby-kalender/baby-5-weken-oud/
          const url = new URL('http://localhost' + path)
          const slug = url.searchParams.get('slug')
          return `/baby-kalender/${slug}/`
        },
        configure: (proxy) => {
          // Transform the HTML response to JSON
          proxy.on('proxyRes', (proxyRes, req, res) => {
            let body = ''
            proxyRes.on('data', (chunk) => { body += chunk })
            proxyRes.on('end', () => {
              try {
                const articleMatch = body.match(/<article[^>]*>([\s\S]*?)<\/article>/)
                if (!articleMatch) {
                  res.writeHead(404, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ error: 'Geen artikel gevonden' }))
                  return
                }
                let content = articleMatch[1]
                content = content.replace(/<script[\s\S]*?<\/script>/gi, '')
                content = content.replace(/<style[\s\S]*?<\/style>/gi, '')
                content = content.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
                content = content.replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
                content = content.replace(/dataLayer\.push\([^)]*\);?/g, '')
                content = content.replace(/\s*on\w+="[^"]*"/gi, '')

                const titleMatch = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
                const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : ''

                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ title, content }))
              } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: e.message }))
              }
            })
          })
        },
        selfHandleResponse: true,
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Lieke',
        short_name: 'Lieke',
        description: 'Opvoedtips voor Lieke',
        theme_color: '#F97316',
        background_color: '#FFF7ED',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
