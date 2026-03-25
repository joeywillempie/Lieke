export const config = {
  runtime: 'edge',
}

function cleanArticleHtml(html, articleHtml) {
  let content = articleHtml

  // Remove script, style, iframe, noscript tags
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '')
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '')
  content = content.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  content = content.replace(/<noscript[\s\S]*?<\/noscript>/gi, '')

  // Remove sponsored/ad blocks
  content = content.replace(/<div[^>]*class="[^"]*(?:mini-ad|advertisement|sponsored)[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '')
  content = content.replace(/<span[^>]*class="[^"]*sponsored-by[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
  // Remove individual sponsor images and picture elements (Kruidvat logo etc)
  content = content.replace(/<img[^>]*(?:Kruidvat|sponsor)[^>]*>/gi, '')
  content = content.replace(/<picture[^>]*>(?:[^<]|<(?!\/picture))*Kruidvat(?:[^<]|<(?!\/picture))*<\/picture>/gi, '')
  // Remove links to sponsor sites (kruidvat etc) with all their content
  content = content.replace(/<a[^>]*href="[^"]*kruidvat[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
  // Remove week navigation (volgende/vorige) — we have our own
  content = content.replace(/<div[^>]*class="[^"]*volgende-nummer[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
  content = content.replace(/<div[^>]*class="[^"]*vorige-nummer[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
  content = content.replace(/<div[^>]*class="[^"]*section-volgende[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi, '')
  // Remove commercial/ad info blocks and mini-ad sections
  content = content.replace(/<div[^>]*class="[^"]*commercial_information[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
  content = content.replace(/<div[^>]*class="[^"]*sectie-fcMiniAd[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>\s*<\/div>/gi, '')
  content = content.replace(/<div[^>]*data-campaign="[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi, '')
  // Remove "In samenwerking met" text up to next heading/section
  content = content.replace(/In samenwerking met[\s\S]*?(?=<(?:h[23]|hr|div class="row"))/gi, '')
  // Remove remaining ad containers
  content = content.replace(/<div[^>]*class="[^"]*(?:ad-|sponsor|banner|cookie|newsletter|mini-ad)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')

  // Remove dataLayer pushes and event handlers
  content = content.replace(/dataLayer\.push\([\s\S]*?\);?/g, '')
  content = content.replace(/document\.querySelector[\s\S]*?\);/g, '')
  content = content.replace(/\s*on\w+="[^"]*"/gi, '')

  // Remove empty links
  content = content.replace(/<a[^>]*>\s*<\/a>/g, '')

  // Fix lazy-loaded images: replace src placeholder with data-src
  content = content.replace(/<img([^>]*?)data-src="([^"]+)"([^>]*?)>/gi, (match, before, dataSrc, after) => {
    const cleaned = (before + after).replace(/src="data:image[^"]*"/gi, '')
    return `<img${cleaned} src="${dataSrc}">`
  })

  // Fix Bootstrap collapse/accordion: remove collapse class so content is visible
  content = content.replace(/class="([^"]*)\bcollapse\b([^"]*)"/gi, 'class="$1$2"')
  content = content.replace(/class="([^"]*)\bcollapsed\b([^"]*)"/gi, 'class="$1$2"')
  content = content.replace(/\s*data-toggle="[^"]*"/gi, '')
  content = content.replace(/\s*data-target="[^"]*"/gi, '')
  content = content.replace(/\s*aria-expanded="[^"]*"/gi, '')
  content = content.replace(/\s*aria-controls="[^"]*"/gi, '')

  // Remove quiz/poll sections
  content = content.replace(/<div[^>]*class="[^"]*(?:quiz|poll)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')

  // Remove CTA buttons (but not links wrapping images)
  content = content.replace(/<a[^>]*class="[^"]*btn[^"]*"[^>]*>(?:(?!<img)[^<]|<(?!img))*<\/a>/gi, '')

  // Remove images that are logos or from known ad sources
  content = content.replace(/<img[^>]*(?:logo|avatar)[^>]*>/gi, '')

  // Extract title from h1
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : ''

  return { title, content }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (!slug || !/^baby-[\w-]+$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'Ongeldige slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = `https://www.24baby.nl/baby-kalender/${slug}/`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ParentLog/1.0)',
        'Accept': 'text/html',
      },
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Pagina niet gevonden' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const html = await response.text()

    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/)
    if (!articleMatch) {
      return new Response(JSON.stringify({ error: 'Geen artikel gevonden' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { title, content } = cleanArticleHtml(html, articleMatch[1])

    return new Response(JSON.stringify({ title, content }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Ophalen mislukt: ' + err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
