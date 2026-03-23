export const config = {
  runtime: 'edge',
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

    // Extract article content between <article> tags
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/)
    if (!articleMatch) {
      return new Response(JSON.stringify({ error: 'Geen artikel gevonden' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let content = articleMatch[1]

    // Remove script tags
    content = content.replace(/<script[\s\S]*?<\/script>/gi, '')
    // Remove style tags
    content = content.replace(/<style[\s\S]*?<\/style>/gi, '')
    // Remove iframes
    content = content.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    // Remove noscript
    content = content.replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    // Remove ads / sponsored content blocks
    content = content.replace(/<div[^>]*class="[^"]*(?:ad-|sponsor|banner|cookie)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    // Remove dataLayer pushes
    content = content.replace(/dataLayer\.push\([^)]*\);?/g, '')
    // Remove onclick handlers
    content = content.replace(/\s*on\w+="[^"]*"/gi, '')
    // Remove empty links
    content = content.replace(/<a[^>]*>\s*<\/a>/g, '')
    // Fix lazy-loaded images: replace src placeholder with data-src
    content = content.replace(/<img([^>]*?)data-src="([^"]+)"([^>]*?)>/gi, (match, before, dataSrc, after) => {
      // Remove existing src with placeholder
      const cleaned = (before + after).replace(/src="data:image[^"]*"/gi, '')
      return `<img${cleaned} src="${dataSrc}">`
    })

    // Extract title from h1
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : ''

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
