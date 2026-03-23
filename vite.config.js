import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Dev middleware that mimics the Vercel Edge function
function babyContentPlugin() {
  return {
    name: 'baby-content-api',
    configureServer(server) {
      server.middlewares.use('/api/baby-content', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const slug = url.searchParams.get('slug')

        if (!slug) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Geen slug' }))
          return
        }

        try {
          const response = await fetch(`https://www.24baby.nl/baby-kalender/${slug}/`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ParentLog/1.0)' },
          })
          const html = await response.text()

          const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/)
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
          // Fix lazy-loaded images: replace src placeholder with data-src
          content = content.replace(/<img([^>]*?)data-src="([^"]+)"([^>]*?)>/gi, (match, before, dataSrc, after) => {
            const cleaned = (before + after).replace(/src="data:image[^"]*"/gi, '')
            return `<img${cleaned} src="${dataSrc}">`
          })

          const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
          const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : ''

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ title, content }))
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    babyContentPlugin(),
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
