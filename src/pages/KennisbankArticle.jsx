import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, BookOpen, Loader2 } from 'lucide-react'

const SOURCE_CONFIG = {
  'HealthyChildren.org (AAP)': { label: 'American Academy of Pediatrics', color: 'from-emerald-500 to-teal-500', icon: '🏥' },
  'Zero to Three':              { label: 'Zero to Three', color: 'from-blue-500 to-indigo-500', icon: '🧒' },
  'CDC Child Development':      { label: 'Centers for Disease Control', color: 'from-slate-500 to-gray-500', icon: '🏛️' },
  'KellyMom':                   { label: 'KellyMom (Evidence-based)', color: 'from-pink-500 to-rose-500', icon: '🍼' },
  'BabyCenter':                 { label: 'BabyCenter', color: 'from-sky-500 to-blue-500', icon: '👶' },
  'What to Expect':             { label: 'What to Expect', color: 'from-purple-500 to-violet-500', icon: '🤰' },
}

const CATEGORY_COLORS = {
  'Slaap':                 'bg-indigo-100 text-indigo-700',
  'Voeding':               'bg-green-100 text-green-700',
  'Taal & ontwikkeling':   'bg-sky-100 text-sky-700',
  'Spel & stimulatie':     'bg-yellow-100 text-yellow-700',
  'Gedrag & grenzen':      'bg-orange-100 text-orange-700',
  'Gezondheid':            'bg-red-100 text-red-700',
  'Veiligheid':            'bg-teal-100 text-teal-700',
  'School & leren':        'bg-purple-100 text-purple-700',
  'Emoties & gehechtheid': 'bg-pink-100 text-pink-700',
}

const CATEGORY_EMOJIS = {
  'Slaap': '😴', 'Voeding': '🥦', 'Taal & ontwikkeling': '💬',
  'Spel & stimulatie': '🎨', 'Gedrag & grenzen': '🦁', 'Gezondheid': '❤️',
  'Veiligheid': '🛡️', 'School & leren': '📚', 'Emoties & gehechtheid': '🤗',
}

export default function KennisbankArticle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/kennisbank.json')
      .then(r => r.json())
      .then(data => {
        const found = data.find(a => a.id === id)
        setArticle(found || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="p-6 text-center">
        <p className="text-stone-500 mb-3">Artikel niet gevonden</p>
        <button onClick={() => navigate('/kennisbank')} className="text-violet-500 underline font-bold text-sm">
          Terug naar Kennisbank
        </button>
      </div>
    )
  }

  const srcCfg = SOURCE_CONFIG[article.source] || { label: article.source, color: 'from-stone-500 to-gray-500', icon: '📄' }

  // Format text into paragraphs
  const paragraphs = article.text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 20)

  return (
    <div className="pb-10">
      {/* Top bar */}
      <div className="sticky top-[52px] z-[5] bg-white/90 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <button
            onClick={() => navigate('/kennisbank')}
            className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <div className="flex items-center gap-1.5 text-sm text-stone-500 font-bold min-w-0">
            <BookOpen className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span className="truncate">Kennisbank</span>
          </div>
        </div>
      </div>

      {/* Bron header */}
      <div className={`bg-gradient-to-r ${srcCfg.color} px-4 py-4`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{srcCfg.icon}</span>
          <span className="text-white/80 text-xs font-bold">{srcCfg.label}</span>
        </div>
        <h1 className="font-serif font-bold text-white text-xl leading-snug">
          {article.title}
        </h1>
      </div>

      {/* Meta info */}
      <div className="px-4 py-3 bg-white border-b border-stone-100">
        <div className="flex items-center gap-2 flex-wrap">
          {article.categories.map(cat => (
            <span key={cat} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${CATEGORY_COLORS[cat] || 'bg-stone-100 text-stone-600'}`}>
              {CATEGORY_EMOJIS[cat]} {cat}
            </span>
          ))}
          <span className="text-xs text-violet-500 font-bold bg-violet-50 px-2.5 py-1 rounded-full">
            {article.age_range === '0-1' ? '0-1 jaar' :
             article.age_range === '0-3' ? '0-3 jaar' :
             article.age_range === '0-6' ? '0-6 jaar' :
             `${article.age_range} jaar`}
          </span>
        </div>
      </div>

      {/* Artikel inhoud */}
      <div className="px-4 py-5">
        <div className="prose prose-sm prose-stone max-w-none">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-stone-600 text-sm leading-relaxed mb-3">
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* Bron link */}
      <div className="px-4 pb-4">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 bg-violet-50 rounded-xl text-violet-700 hover:bg-violet-100 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm font-bold">Lees het volledige artikel op {article.source}</span>
        </a>
      </div>

      {/* Disclaimer */}
      <div className="px-4">
        <p className="text-[11px] text-stone-400 leading-relaxed bg-stone-50 rounded-xl p-3">
          Dit artikel is afkomstig van {article.source} en is bedoeld als algemene informatie.
          Raadpleeg altijd je kinderarts of consultatiebureau voor persoonlijk advies.
        </p>
      </div>
    </div>
  )
}
