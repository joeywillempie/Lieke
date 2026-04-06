import { useState, useEffect, useMemo } from 'react'
import { BookOpen, ExternalLink, Loader2, Filter, X } from 'lucide-react'
import { CATEGORIES } from '../constants/categories'

const CATEGORY_CONFIG = {
  'Slaap':                 { emoji: '😴', bg: 'bg-indigo-50', border: 'border-indigo-200', accent: 'text-indigo-700', pill: 'bg-indigo-500 text-white', gradient: 'from-indigo-500 to-blue-500' },
  'Voeding':               { emoji: '🥦', bg: 'bg-green-50', border: 'border-green-200', accent: 'text-green-700', pill: 'bg-green-500 text-white', gradient: 'from-green-500 to-emerald-500' },
  'Taal & ontwikkeling':   { emoji: '💬', bg: 'bg-sky-50', border: 'border-sky-200', accent: 'text-sky-700', pill: 'bg-sky-500 text-white', gradient: 'from-sky-500 to-blue-500' },
  'Spel & stimulatie':     { emoji: '🎨', bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-700', pill: 'bg-amber-500 text-white', gradient: 'from-amber-500 to-yellow-500' },
  'Gedrag & grenzen':      { emoji: '🦁', bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-700', pill: 'bg-orange-500 text-white', gradient: 'from-orange-500 to-red-500' },
  'Gezondheid':            { emoji: '❤️', bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-700', pill: 'bg-red-500 text-white', gradient: 'from-red-500 to-rose-500' },
  'Veiligheid':            { emoji: '🛡️', bg: 'bg-teal-50', border: 'border-teal-200', accent: 'text-teal-700', pill: 'bg-teal-500 text-white', gradient: 'from-teal-500 to-cyan-500' },
  'School & leren':        { emoji: '📚', bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-700', pill: 'bg-purple-500 text-white', gradient: 'from-purple-500 to-violet-500' },
  'Emoties & gehechtheid': { emoji: '🤗', bg: 'bg-pink-50', border: 'border-pink-200', accent: 'text-pink-700', pill: 'bg-pink-500 text-white', gradient: 'from-pink-500 to-rose-500' },
}

const AGE_TABS = [
  { key: 'baby', label: '0–1 jaar', emoji: '👶', color: 'bg-rose-500' },
  { key: 'peuter', label: '1–3 jaar', emoji: '🧒', color: 'bg-amber-500' },
  { key: 'kleuter', label: '3–6 jaar', emoji: '🎒', color: 'bg-green-500' },
]

function NarrativeCard({ category }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = CATEGORY_CONFIG[category.name] || { emoji: '📌', bg: 'bg-stone-50', border: 'border-stone-200', accent: 'text-stone-700', gradient: 'from-stone-500 to-gray-500' }

  const text = category.narrative || ''
  const isLong = text.length > 300
  const displayText = expanded || !isLong ? text : text.slice(0, 280) + '...'

  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm border ${cfg.border}`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${cfg.gradient} px-4 py-3 flex items-center gap-2.5`}>
        <span className="text-2xl">{cfg.emoji}</span>
        <h2 className="font-serif font-bold text-white text-base">{category.name}</h2>
      </div>

      {/* Narrative text */}
      <div className={`${cfg.bg} px-4 py-4`}>
        <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
          {displayText}
        </p>

        {isLong && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className={`mt-2 text-sm font-bold ${cfg.accent} hover:underline`}
          >
            Lees meer
          </button>
        )}

        {/* Sources */}
        {category.sources?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-stone-200/50">
            <p className="text-[11px] text-stone-400 font-bold mb-1.5">Bronnen:</p>
            <div className="flex flex-wrap gap-1.5">
              {category.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-[11px] font-bold text-violet-600 hover:bg-violet-50 transition-colors shadow-sm"
                >
                  {src.label}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Kennisbank() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeAge, setActiveAge] = useState('baby')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  useEffect(() => {
    fetch('/kennisbank-verhalen.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const ageData = useMemo(() => {
    if (!data) return null
    return data.find(d => d.age_group === activeAge) || null
  }, [data, activeAge])

  const categories = useMemo(() => {
    if (!ageData) return []
    if (selectedCategory) {
      return ageData.categories.filter(c => c.name === selectedCategory)
    }
    return ageData.categories
  }, [ageData, selectedCategory])

  return (
    <div className="pb-8">
      {/* Leeftijd-navigatie */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-100 sticky top-[52px] z-[5]">
        <div className="flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto no-scrollbar">
          {/* Filter knop (mobiel) */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex-shrink-0 p-1.5 rounded-xl bg-white shadow-sm border border-stone-200 mr-1"
          >
            <Filter className="w-4 h-4 text-stone-500" />
          </button>

          {AGE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveAge(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeAge === tab.key
                  ? `${tab.color} text-white shadow-md scale-105`
                  : 'bg-white text-stone-600 shadow-sm hover:shadow-md'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobiel filter overlay */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl animate-slide-in-left">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
              <span className="font-bold text-stone-700">Categorieën</span>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 rounded-lg hover:bg-stone-100">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            <div className="flex flex-col p-2 gap-0.5">
              <button
                onClick={() => { setSelectedCategory(null); setMobileFilterOpen(false) }}
                className={`text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  !selectedCategory ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                <span>🌈</span><span>Alle</span>
              </button>
              {CATEGORIES.map(cat => {
                const cfg = CATEGORY_CONFIG[cat]
                if (!cfg) return null
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(isSelected ? null : cat); setMobileFilterOpen(false) }}
                    className={`text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      isSelected ? `${cfg.pill} shadow-sm` : `${cfg.accent} hover:${cfg.bg}`
                    }`}
                  >
                    <span className="text-base leading-none">{cfg.emoji}</span>
                    <span className="leading-snug">{cat}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-0">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block w-44 flex-shrink-0 bg-white/70 border-r border-stone-100 backdrop-blur-sm">
          <div className="flex flex-col p-2 gap-0.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                !selectedCategory ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              <span>🌈</span><span>Alle</span>
            </button>
            {CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIG[cat]
              if (!cfg) return null
              const isSelected = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(isSelected ? null : cat)}
                  className={`text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                    isSelected ? `${cfg.pill} shadow-sm` : `${cfg.accent} hover:${cfg.bg}`
                  }`}
                >
                  <span className="text-base leading-none">{cfg.emoji}</span>
                  <span className="leading-snug">{cat}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-violet-500" />
              <h1 className="font-serif font-bold text-stone-800 text-lg">Kennisbank</h1>
            </div>
            {ageData && (
              <p className="text-xs text-stone-400 ml-7">
                {ageData.age_label} — samengevat uit honderden artikelen van betrouwbare bronnen
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">📚</p>
              <p className="text-stone-500 text-sm">Geen adviezen voor deze selectie</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map(cat => (
                <NarrativeCard key={cat.name} category={cat} />
              ))}
            </div>
          )}

          {/* Footer disclaimer */}
          <div className="mt-6 px-1">
            <p className="text-[11px] text-stone-400 leading-relaxed bg-stone-50 rounded-xl p-3">
              Samengevat uit artikelen van AAP, Zero to Three, CDC, KellyMom, BabyCenter en What to Expect.
              Raadpleeg altijd je kinderarts of consultatiebureau voor persoonlijk advies.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
