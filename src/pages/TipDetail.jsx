import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import YoutubeEmbed from '../components/YoutubeEmbed'
import { getYoutubeId, fetchUrlMetadata } from '../lib/helpers'
import { CheckCircle, Edit2, Trash2, ExternalLink, Loader2, Star, Share2 } from 'lucide-react'

export default function TipDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tip, setTip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [resolvedThumbnail, setResolvedThumbnail] = useState(null)
  const [shareMsg, setShareMsg] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchTip() {
      const { data, error } = await supabase.from('tips').select('*').eq('id', id).single()
      if (cancelled) return
      if (error) setError('Tip kon niet worden geladen.')
      else setTip(data)
      setLoading(false)
    }

    fetchTip()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!tip || tip.thumbnail_url) return
    if (!tip.url) return

    let cancelled = false

    async function resolveThumbnail() {
      if (tip.type === 'youtube') {
        const videoId = getYoutubeId(tip.url)
        if (videoId && !cancelled) {
          setResolvedThumbnail(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`)
        }
      } else {
        const meta = await fetchUrlMetadata(tip.url)
        if (!cancelled && meta?.thumbnail_url) {
          setResolvedThumbnail(meta.thumbnail_url)
        }
      }
    }

    resolveThumbnail()
    return () => { cancelled = true }
  }, [tip])

  async function handleDelete() {
    if (!confirm('Tip verwijderen?')) return
    setDeleting(true)
    const { error } = await supabase.from('tips').delete().eq('id', id)
    if (error) {
      setDeleting(false)
      alert('Verwijderen mislukt. Probeer het opnieuw.')
      return
    }
    navigate('/')
  }

  async function toggleProven() {
    const { data, error } = await supabase
      .from('tips')
      .update({ proven: !tip.proven })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setTip(data)
  }

  async function toggleFavorite() {
    const { data, error } = await supabase
      .from('tips')
      .update({ favorited: !tip.favorited })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setTip(data)
  }

  async function handleShare() {
    const text = `💡 ${tip.title}${tip.note ? '\n\n' + tip.note : ''}${tip.url ? '\n\n' + tip.url : ''}`

    if (navigator.share) {
      try {
        await navigator.share({ title: tip.title, text })
      } catch {
        // Gebruiker annuleerde
      }
    } else {
      await navigator.clipboard.writeText(text)
      setShareMsg('Gekopieerd!')
      setTimeout(() => setShareMsg(null), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-green-700" />
      </div>
    )
  }

  if (error || !tip) {
    return (
      <div className="p-4 text-center text-stone-500">{error || 'Tip niet gevonden.'}</div>
    )
  }

  const yearLabels = tip.always_relevant
    ? ['Altijd relevant']
    : tip.years?.map((y) => `${y} jaar`) || []

  return (
    <div className="px-4 py-4 pb-8">
      {/* YouTube embed */}
      {tip.type === 'youtube' && tip.url && (
        <div className="mb-4">
          <YoutubeEmbed url={tip.url} />
        </div>
      )}

      {/* Thumbnail voor andere types */}
      {tip.type !== 'youtube' && (tip.thumbnail_url || resolvedThumbnail) && (
        <div className="mb-4 rounded-xl overflow-hidden">
          <img src={tip.thumbnail_url || resolvedThumbnail} alt="" className="w-full h-auto" />
        </div>
      )}

      {/* Titel + favoriet + proven */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h1 className="font-serif font-bold text-xl text-stone-800 leading-snug">{tip.title}</h1>
        <div className="flex gap-1 flex-shrink-0 mt-1">
          <button onClick={toggleFavorite} aria-label="Favoriet">
            <Star className={`w-6 h-6 transition-colors ${tip.favorited ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`} />
          </button>
          <button onClick={toggleProven} aria-label="Bewezen">
            <CheckCircle className={`w-6 h-6 transition-colors ${tip.proven ? 'text-green-600 fill-green-100' : 'text-stone-300'}`} />
          </button>
        </div>
      </div>

      {/* Bron */}
      {tip.source_label && (
        <p className="text-sm text-stone-500 mb-3">{tip.source_label}</p>
      )}

      {/* Notitie */}
      {tip.note && (
        <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-100">
          <p className="text-sm text-stone-700 whitespace-pre-wrap">{tip.note}</p>
        </div>
      )}

      {/* Podcast link */}
      {tip.type === 'podcast' && tip.url && (
        <a
          href={tip.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 rounded-xl px-4 py-3 mb-4 hover:bg-purple-100"
        >
          <ExternalLink className="w-4 h-4" />
          Luister podcast
        </a>
      )}

      {/* Tekst link */}
      {tip.type === 'text' && tip.url && (
        <a
          href={tip.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-xl px-4 py-3 mb-4 hover:bg-blue-100"
        >
          <ExternalLink className="w-4 h-4" />
          {(() => { try { return new URL(tip.url).hostname.replace(/^www\./, '') } catch { return 'Bekijk bron' } })()}
        </a>
      )}

      {/* Jaren & categorieën & tags */}
      <div className="space-y-3 mb-6">
        {yearLabels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {yearLabels.map((label) => (
              <span key={label} className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                {label}
              </span>
            ))}
          </div>
        )}
        {tip.categories?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tip.categories.map((cat) => (
              <span key={cat} className="text-xs bg-stone-50 text-stone-600 px-3 py-1 rounded-full border border-stone-200">
                {cat}
              </span>
            ))}
          </div>
        )}
        {tip.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tip.tags.map((tag) => (
              <span key={tag} className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-200 font-bold">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Aangemaakt door */}
      {tip.created_by && (
        <p className="text-sm text-violet-600 font-medium mb-4">
          ✏️ Aangemaakt door {tip.created_by}
        </p>
      )}

      {/* Bewezen status */}
      {tip.proven && (
        <div className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-3 mb-6 border border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">Bewezen: werkt voor jullie dochter!</span>
        </div>
      )}

      {/* Acties */}
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 justify-center bg-blue-50 text-blue-600 px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-100 relative"
        >
          <Share2 className="w-4 h-4" />
          {shareMsg || 'Delen'}
        </button>
        <button
          onClick={() => navigate(`/tip/${id}/bewerken`)}
          className="flex items-center gap-2 flex-1 justify-center bg-stone-100 text-stone-700 px-4 py-3 rounded-xl text-sm font-medium hover:bg-stone-200"
        >
          <Edit2 className="w-4 h-4" />
          Bewerken
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 justify-center bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium hover:bg-red-100"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? '...' : 'Verwijderen'}
        </button>
      </div>
    </div>
  )
}
