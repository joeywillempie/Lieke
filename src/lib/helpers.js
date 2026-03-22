// Haal YouTube video ID op uit een URL
export function getYoutubeId(url) {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Detecteer type op basis van URL
export function detectType(url) {
  if (!url) return 'text'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('spotify.com') || url.includes('podcasts.apple.com')) return 'podcast'
  return 'text'
}

// Haal YouTube metadata op via oEmbed
export async function fetchYoutubeMetadata(url) {
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
  if (!res.ok) return null
  return res.json() // bevat .title en .thumbnail_url
}

// Haal Open Graph metadata op van een willekeurige URL via microlink.io
export async function fetchUrlMetadata(url) {
  try {
    const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'success') return null
    return {
      title: data.data?.title || null,
      thumbnail_url: data.data?.image?.url || data.data?.screenshot?.url || null,
    }
  } catch {
    return null
  }
}

// Upload afbeelding naar Supabase Storage bucket 'tip-images'
export async function uploadTipImage(file, supabaseClient) {
  const ext = file.name.split('.').pop().toLowerCase()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabaseClient.storage
    .from('tip-images')
    .upload(fileName, file, { contentType: file.type })
  if (error) throw error
  const { data } = supabaseClient.storage.from('tip-images').getPublicUrl(fileName)
  return data.publicUrl
}
