// Vercel serverless function — haalt 24baby.nl artikelinhoud op
export default async function handler(req, res) {
  const { slug } = req.query

  if (!slug || !/^baby-[\w-]+$/.test(slug)) {
    return res.status(400).json({ error: 'Ongeldige slug' })
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
      return res.status(response.status).json({ error: 'Pagina niet gevonden' })
    }

    const html = await response.text()

    // Extract article content between <article> tags
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/)
    if (!articleMatch) {
      return res.status(404).json({ error: 'Geen artikel gevonden' })
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

    // Extract title from h1
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : ''

    // Extract subtitle (usually in hero area)
    const subtitleMatch = html.match(/<h1[\s\S]*?<\/h1>\s*(?:<[^>]*>)*([\s\S]*?)(?=<(?:div|section|article))/i)

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
    return res.status(200).json({ title, content })
  } catch (err) {
    return res.status(500).json({ error: 'Ophalen mislukt: ' + err.message })
  }
}
