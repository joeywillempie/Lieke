import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronDown, ChevronRight, ExternalLink, Loader2, Filter, X } from 'lucide-react'
import { CATEGORIES } from '../constants/categories'

const CATEGORY_CONFIG = {
  'Slaap':                 { emoji: '😴', bg: 'bg-indigo-50', border: 'border-indigo-200', accent: 'text-indigo-700', pill: 'bg-indigo-500 text-white' },
  'Voeding':               { emoji: '🥦', bg: 'bg-green-50', border: 'border-green-200', accent: 'text-green-700', pill: 'bg-green-500 text-white' },
  'Taal & ontwikkeling':   { emoji: '💬', bg: 'bg-sky-50', border: 'border-sky-200', accent: 'text-sky-700', pill: 'bg-sky-500 text-white' },
  'Spel & stimulatie':     { emoji: '🎨', bg: 'bg-yellow-50', border: 'border-yellow-200', accent: 'text-yellow-700', pill: 'bg-yellow-500 text-white' },
  'Gedrag & grenzen':      { emoji: '🦁', bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-700', pill: 'bg-orange-500 text-white' },
  'Gezondheid':            { emoji: '❤️', bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-700', pill: 'bg-red-500 text-white' },
  'Veiligheid':            { emoji: '🛡️', bg: 'bg-teal-50', border: 'border-teal-200', accent: 'text-teal-700', pill: 'bg-teal-500 text-white' },
  'School & leren':        { emoji: '📚', bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-700', pill: 'bg-purple-500 text-white' },
  'Emoties & gehechtheid': { emoji: '🤗', bg: 'bg-pink-50', border: 'border-pink-200', accent: 'text-pink-700', pill: 'bg-pink-500 text-white' },
}

const SOURCE_LABELS = {
  'HealthyChildren.org (AAP)': 'AAP',
  'Zero to Three': 'Zero to Three',
  'CDC Child Development': 'CDC',
  'KellyMom': 'KellyMom',
  'BabyCenter': 'BabyCenter',
  'What to Expect': 'What to Expect',
}

const YEAR_COLORS = [
  'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500',
]

function TopicCard({ topic }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-2 text-left py-1.5 group"
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
        }
        <span className="text-sm font-bold text-stone-700 group-hover:text-violet-600 transition-colors">
          {topic.topic}
        </span>
        <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">
          {topic.sources.length} bron{topic.sources.length !== 1 ? 'nen' : ''}
        </span>
      </button>

      {open && (
        <div className="ml-6 space-y-2.5 pb-2 animate-slide-down">
          {topic.advice.map((adv, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-stone-100">
              <p className="text-sm text-stone-600 leading-relaxed mb-2">
                {adv.text}
              </p>
              <a
                href={adv.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-500 hover:text-violet-700"
                onClick={e => e.stopPropagation()}
              >
                {SOURCE_LABELS[adv.source] || adv.source}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CategorySection({ category }) {
  const [open, setOpen] = useState(false)
  const cfg = CATEGORY_CONFIG[category.name] || { emoji: '📌', bg: 'bg-stone-50', border: 'border-stone-200', accent: 'text-stone-700', pill: 'bg-stone-500 text-white' }

  return (
    <div className={`rounded-2xl ${cfg.bg} border ${cfg.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
      >
        <span className="text-xl">{cfg.emoji}</span>
        <span className={`font-serif font-bold text-base ${cfg.accent} flex-1`}>{category.name}</span>
        <span className="text-xs text-stone-400">{category.topics.length} onderwerpen</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-stone-400" />
          : <ChevronRight className="w-4 h-4 text-stone-400" />
        }
      </button>

      {open && (
        <div className="px-4 pb-3 animate-slide-down">
          {category.topics.map((topic, i) => (
            <TopicCard key={i} topic={topic} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Kennisbank() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeYear, setActiveYear] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  useEffect(() => {
    fetch('/kennisbank-samenvatting.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const yearData = useMemo(() => {
    if (!data) return null
    return data.find(y => y.year === activeYear) || null
  }, [data, activeYear])

  const categories = useMemo(() => {
    if (!yearData) return []
    if (selectedCategory) {
      return yearData.categories.filter(c => c.name === selectedCategory)
    }
    return yearData.categories
  }, [yearData, selectedCategory])

  return (
    <div className="pb-8">
      {/* Jaar-navigatie */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-100 sticky top-[52px] z-[5]">
        <div className="flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto no-scrollbar">
          {/* Filter knop (mobiel) */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex-shrink-0 p-1.5 rounded-xl bg-white shadow-sm border border-stone-200 mr-1"
          >
            <Filter className="w-4 h-4 text-stone-500" />
          </button>

          {Array.from({ length: 7 }, (_, y) => (
            <button
              key={y}
              onClick={() => setActiveYear(y)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeYear === y
                  ? `${YEAR_COLORS[y]} text-white shadow-md scale-105`
                  : 'bg-white text-stone-600 shadow-sm hover:shadow-md'
              }`}
            >
              {y === 0 ? '0–1' : `${y}–${y+1}`} jr
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
            {yearData && (
              <p className="text-xs text-stone-400 ml-7">
                {yearData.label} — samengevat uit {yearData.categories.reduce((s, c) => s + c.article_count, 0)} artikelen van betrouwbare bronnen
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
            <div className="space-y-3">
              {categories.map(cat => (
                <CategorySection key={cat.name} category={cat} />
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
