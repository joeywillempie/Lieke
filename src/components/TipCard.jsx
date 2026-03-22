import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Youtube, Mic, FileText } from 'lucide-react'
import { getYoutubeId, fetchUrlMetadata } from '../lib/helpers'

// Gedeelde cache met max 100 items (LRU-achtig: oudste wordt verwijderd)
const MAX_CACHE = 100
const thumbnailCache = new Map()
function cacheSet(key, value) {
  if (thumbnailCache.size >= MAX_CACHE) {
    const oldest = thumbnailCache.keys().next().value
    thumbnailCache.delete(oldest)
  }
  thumbnailCache.set(key, value)
}

const TYPE_CONFIG = {
  youtube: { icon: Youtube, label: 'YouTube', badge: 'bg-red-500 text-white', border: 'border-t-[3px] border-red-400', glow: 'from-red-50' },
  podcast: { icon: Mic, label: 'Podcast', badge: 'bg-purple-500 text-white', border: 'border-t-[3px] border-purple-400', glow: 'from-purple-50' },
  text:    { icon: FileText, label: 'Artikel', badge: 'bg-sky-500 text-white', border: 'border-t-[3px] border-sky-400', glow: 'from-sky-50' },
}

// Vrolijke kleur per categorie
const CATEGORY_COLORS = [
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-yellow-100 text-yellow-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

function categoryColor(cat) {
  let hash = 0
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + hash * 31
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length]
}

export default function TipCard({ tip, featured = false }) {
  const navigate = useNavigate()
  const typeConfig = TYPE_CONFIG[tip.type] || TYPE_CONFIG.text
  const TypeIcon = typeConfig.icon

  // Synchrone fallback voor YouTube
  const staticThumbnail =
    tip.thumbnail_url ||
    (tip.type === 'youtube' && tip.url
      ? `https://img.youtube.com/vi/${getYoutubeId(tip.url)}/mqdefault.jpg`
      : null)

  const [resolvedThumbnail, setResolvedThumbnail] = useState(
    () => thumbnailCache.get(tip.url) ?? staticThumbnail
  )

  useEffect(() => {
    if (resolvedThumbnail) return
    if (!tip.url || tip.type === 'youtube') return
    let cancelled = false
    if (thumbnailCache.has(tip.url)) {
      setResolvedThumbnail(thumbnailCache.get(tip.url))
      return
    }
    fetchUrlMetadata(tip.url).then((meta) => {
      if (cancelled) return
      const img = meta?.thumbnail_url || null
      cacheSet(tip.url, img)
      if (img) setResolvedThumbnail(img)
    })
    return () => { cancelled = true }
  }, [tip.url, tip.type, resolvedThumbnail])

  const thumbnail = resolvedThumbnail

  if (featured) {
    return (
      <div
        className={`bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all active:scale-[0.99] group ${typeConfig.border}`}
        onClick={() => navigate(`/tip/${tip.id}`)}
      >
        {thumbnail ? (
          <div className="w-full aspect-video overflow-hidden">
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className={`w-full h-20 bg-gradient-to-r ${typeConfig.glow} to-white`} />
        )}

        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${typeConfig.badge}`}>
              <TypeIcon className="w-3 h-3" />
              {typeConfig.label}
            </span>
            {tip.categories?.slice(0, 3).map((cat) => (
              <span key={cat} className={`px-2.5 py-1 rounded-full text-xs font-bold ${categoryColor(cat)}`}>
                {cat}
              </span>
            ))}
          </div>

          <h2 className="font-serif font-bold text-stone-800 text-xl leading-snug mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
            {tip.title}
          </h2>

          {tip.note && (
            <p className="text-stone-500 text-sm line-clamp-2 mb-3">{tip.note}</p>
          )}

          <div className="flex items-center gap-2">
            {tip.source_label && (
              <p className="text-xs text-stone-400 truncate flex-1">{tip.source_label}</p>
            )}
            {tip.created_by && (
              <span className="text-xs text-violet-500 font-bold flex-shrink-0">door {tip.created_by}</span>
            )}
            {tip.proven && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex-shrink-0">
                <CheckCircle className="w-3 h-3" />
                Bewezen
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Reguliere kaart (in 2-kolom grid)
  return (
    <div
      className={`bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all active:scale-[0.98] group flex flex-col h-full ${typeConfig.border}`}
      onClick={() => navigate(`/tip/${tip.id}`)}
    >
      {thumbnail ? (
        <div className="w-full aspect-video overflow-hidden">
          <img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className={`w-full h-10 bg-gradient-to-r ${typeConfig.glow} to-white`} />
      )}

      <div className="p-3 flex flex-col flex-1">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mb-2 self-start ${typeConfig.badge}`}>
          <TypeIcon className="w-3 h-3" />
          {typeConfig.label}
        </span>

        <h3 className="font-serif font-bold text-stone-800 text-sm leading-snug line-clamp-3 group-hover:text-orange-500 transition-colors flex-1">
          {tip.title}
        </h3>

        <div className="flex items-center gap-1 mt-2 flex-wrap">
          {tip.categories?.slice(0, 1).map((cat) => (
            <span key={cat} className={`px-2 py-0.5 rounded-full text-xs font-bold ${categoryColor(cat)}`}>
              {cat}
            </span>
          ))}
          {tip.proven && (
            <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-auto flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  )
}
