import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

function cleanArticleHtml(html, articleHtml) {
  let content = articleHtml

  content = content.replace(/<script[\s\S]*?<\/script>/gi, '')
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '')
  content = content.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  content = content.replace(/<noscript[\s\S]*?<\/noscript>/gi, '')

  // Remove sponsored/ad blocks
  content = content.replace(/<div[^>]*class="[^"]*(?:mini-ad|advertisement|sponsored)[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '')
  content = content.replace(/<span[^>]*class="[^"]*sponsored-by[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
  // Remove individual sponsor images (Kruidvat logo etc)
  content = content.replace(/<img[^>]*(?:Kruidvat|sponsor)[^>]*>/gi, '')
  // Remove links to sponsor sites (kruidvat etc) with all their content
  content = content.replace(/<a[^>]*href="[^"]*kruidvat[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
  content = content.replace(/In samenwerking met[\s\S]*?(?=<(?:h[23]|hr|div class="row"))/gi, '')
  content = content.replace(/<div[^>]*class="[^"]*(?:ad-|sponsor|banner|cookie|newsletter|mini-ad)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')

  content = content.replace(/dataLayer\.push\([\s\S]*?\);?/g, '')
  content = content.replace(/document\.querySelector[\s\S]*?\);/g, '')
  content = content.replace(/\s*on\w+="[^"]*"/gi, '')
  content = content.replace(/<a[^>]*>\s*<\/a>/g, '')

  // Fix lazy-loaded images
  content = content.replace(/<img([^>]*?)data-src="([^"]+)"([^>]*?)>/gi, (match, before, dataSrc, after) => {
    const cleaned = (before + after).replace(/src="data:image[^"]*"/gi, '')
    return `<img${cleaned} src="${dataSrc}">`
  })

  // Fix Bootstrap collapse/accordion
  content = content.replace(/class="([^"]*)\bcollapse\b([^"]*)"/gi, 'class="$1$2"')
  content = content.replace(/class="([^"]*)\bcollapsed\b([^"]*)"/gi, 'class="$1$2"')
  content = content.replace(/\s*data-toggle="[^"]*"/gi, '')
  content = content.replace(/\s*data-target="[^"]*"/gi, '')
  content = content.replace(/\s*aria-expanded="[^"]*"/gi, '')
  content = content.replace(/\s*aria-controls="[^"]*"/gi, '')

  // Remove quiz/poll
  content = content.replace(/<div[^>]*class="[^"]*(?:quiz|poll)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
  // Remove CTA buttons (but not links wrapping images)
  content = content.replace(/<a[^>]*class="[^"]*btn[^"]*"[^>]*>(?:(?!<img)[^<]|<(?!img))*<\/a>/gi, '')
  // Remove logos
  content = content.replace(/<img[^>]*(?:logo|avatar)[^>]*>/gi, '')

  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : ''

  return { title, content }
}

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

          const { title, content } = cleanArticleHtml(html, articleMatch[1])

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
