import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ExternalLink, BookOpen, Filter, Loader2 } from 'lucide-react'
import { CATEGORIES } from '../constants/categories'

const CATEGORY_CONFIG = {
  'Slaap':                 { emoji: '😴', active: 'bg-indigo-500 text-white', inactive: 'text-indigo-700 hover:bg-indigo-100' },
  'Voeding':               { emoji: '🥦', active: 'bg-green-500 text-white',  inactive: 'text-green-700 hover:bg-green-100' },
  'Taal & ontwikkeling':   { emoji: '💬', active: 'bg-sky-500 text-white',    inactive: 'text-sky-700 hover:bg-sky-100' },
  'Spel & stimulatie':     { emoji: '🎨', active: 'bg-yellow-500 text-white', inactive: 'text-yellow-700 hover:bg-yellow-100' },
  'Gedrag & grenzen':      { emoji: '🦁', active: 'bg-orange-500 text-white', inactive: 'text-orange-700 hover:bg-orange-100' },
  'Gezondheid':            { emoji: '❤️', active: 'bg-red-500 text-white',    inactive: 'text-red-700 hover:bg-red-100' },
  'Veiligheid':            { emoji: '🛡️', active: 'bg-teal-500 text-white',   inactive: 'text-teal-700 hover:bg-teal-100' },
  'School & leren':        { emoji: '📚', active: 'bg-purple-500 text-white', inactive: 'text-purple-700 hover:bg-purple-100' },
  'Emoties & gehechtheid': { emoji: '🤗', active: 'bg-pink-500 text-white',   inactive: 'text-pink-700 hover:bg-pink-100' },
}

const SOURCE_CONFIG = {
  'HealthyChildren.org (AAP)': { short: 'AAP', color: 'bg-emerald-100 text-emerald-700', icon: '🏥' },
  'Zero to Three':              { short: 'Zero to Three', color: 'bg-blue-100 text-blue-700', icon: '🧒' },
  'CDC Child Development':      { short: 'CDC', color: 'bg-slate-100 text-slate-700', icon: '🏛️' },
  'KellyMom':                   { short: 'KellyMom', color: 'bg-pink-100 text-pink-700', icon: '🍼' },
  'BabyCenter':                 { short: 'BabyCenter', color: 'bg-sky-100 text-sky-700', icon: '👶' },
  'What to Expect':             { short: 'What to Expect', color: 'bg-purple-100 text-purple-700', icon: '🤰' },
}

const YEAR_COLORS = [
  'bg-rose-400', 'bg-orange-400', 'bg-amber-400', 'bg-yellow-400',
  'bg-lime-400', 'bg-green-400', 'bg-emerald-400', 'bg-teal-400',
  'bg-cyan-400', 'bg-sky-400', 'bg-violet-400',
]

// Cache articles globally so we only fetch once
let articlesCache = null

export default function Kennisbank() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState(articlesCache || [])
  const [loading, setLoading] = useState(!articlesCache)
  const [activeYear, setActiveYear] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  useEffect(() => {
    if (articlesCache) return
    fetch('/kennisbank.json')
      .then(r => r.json())
      .then(data => {
        articlesCache = data
        setArticles(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Count articles per year
  const yearCounts = useMemo(() => {
    const counts = {}
    for (let y = 0; y <= 6; y++) {
      counts[y] = articles.filter(a => a.years.includes(y)).length
    }
    return counts
  }, [])

  // Filter articles
  const filtered = useMemo(() => {
    let result = articles

    if (activeYear !== 'all') {
      result = result.filter(a => a.years.includes(activeYear))
    }

    if (selectedCategory) {
      result = result.filter(a => a.categories.includes(selectedCategory))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.preview.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        a.categories.some(c => c.toLowerCase().includes(q))
      )
    }

    return result
  }, [activeYear, selectedCategory, searchQuery])

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

          <button
            onClick={() => setActiveYear('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeYear === 'all'
                ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md scale-105'
                : 'bg-white text-stone-600 shadow-sm hover:shadow-md'
            }`}
          >
            Alles ({articles.length})
          </button>

          {Array.from({ length: 7 }, (_, y) => (
            <button
              key={y}
              onClick={() => setActiveYear(y === activeYear ? 'all' : y)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeYear === y
                  ? `${YEAR_COLORS[y]} text-white shadow-md scale-105`
                  : 'bg-white text-stone-600 shadow-sm hover:shadow-md'
              }`}
            >
              {y === 0 ? '0-1' : `${y}-${y+1}`} jr
              <span className="ml-1 opacity-70">({yearCounts[y]})</span>
            </button>
          ))}

          {/* Zoek toggle */}
          <button
            onClick={() => { setSearchOpen(s => !s); if (searchOpen) setSearchQuery('') }}
            className={`flex-shrink-0 p-1.5 rounded-xl transition-all ml-auto ${
              searchOpen ? 'bg-violet-500 text-white shadow-sm' : 'bg-white text-stone-500 shadow-sm'
            }`}
          >
            {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {/* Zoekbalk */}
        {searchOpen && (
          <div className="px-3 pb-2.5 animate-slide-down">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Zoek in kennisbank..."
                autoFocus
                className="w-full pl-9 pr-8 py-2 rounded-full bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-stone-400" />
                </button>
              )}
            </div>
          </div>
        )}
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
                const cfg = CATEGORY_CONFIG[cat] || { emoji: '📌', active: 'bg-stone-500 text-white', inactive: 'text-stone-600 hover:bg-stone-100' }
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(isSelected ? null : cat); setMobileFilterOpen(false) }}
                    className={`text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      isSelected ? `${cfg.active} shadow-sm` : cfg.inactive
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
        {/* Sidebar categorieën (desktop) */}
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
              const cfg = CATEGORY_CONFIG[cat] || { emoji: '📌', active: 'bg-stone-500 text-white', inactive: 'text-stone-600 hover:bg-stone-100' }
              const isSelected = selectedCategory === cat
              const count = articles.filter(a => a.categories.includes(cat)).length
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(isSelected ? null : cat)}
                  className={`text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                    isSelected ? `${cfg.active} shadow-sm` : cfg.inactive
                  }`}
                >
                  <span className="text-base leading-none">{cfg.emoji}</span>
                  <span className="leading-snug flex-1">{cat}</span>
                  <span className="text-xs opacity-60">{count}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Artikelen */}
        <div className="flex-1 min-w-0 p-3">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-violet-500" />
            <h1 className="font-serif font-bold text-stone-800 text-lg">Kennisbank</h1>
            <span className="text-xs text-stone-400 font-bold bg-stone-100 px-2 py-0.5 rounded-full">
              {filtered.length} artikelen
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">📚</p>
              <p className="text-stone-500 text-sm">Geen artikelen gevonden</p>
              <button
                onClick={() => { setActiveYear('all'); setSelectedCategory(null); setSearchQuery('') }}
                className="text-sm text-violet-500 underline font-bold mt-2"
              >
                Filters wissen
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map(article => {
                const srcCfg = SOURCE_CONFIG[article.source] || { short: article.source, color: 'bg-stone-100 text-stone-600', icon: '📄' }
                return (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/kennisbank/${article.id}`)}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer p-4 active:scale-[0.99] border-l-[3px] border-violet-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Bron + categorie badges */}
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${srcCfg.color}`}>
                            {srcCfg.icon} {srcCfg.short}
                          </span>
                          {article.categories.slice(0, 2).map(cat => {
                            const cfg = CATEGORY_CONFIG[cat]
                            return cfg ? (
                              <span key={cat} className="text-xs font-bold text-stone-400">
                                {cfg.emoji} {cat}
                              </span>
                            ) : null
                          })}
                        </div>

                        {/* Titel */}
                        <h3 className="font-serif font-bold text-stone-800 text-sm leading-snug line-clamp-2 mb-1.5">
                          {article.title}
                        </h3>

                        {/* Preview tekst */}
                        <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                          {article.preview}
                        </p>

                        {/* Leeftijd */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full">
                            {article.age_range === '0-1' ? '0-1 jaar' :
                             article.age_range === '0-3' ? '0-3 jaar' :
                             article.age_range === '0-6' ? '0-6 jaar' :
                             `${article.age_range} jaar`}
                          </span>
                        </div>
                      </div>

                      <ExternalLink className="w-4 h-4 text-stone-300 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
