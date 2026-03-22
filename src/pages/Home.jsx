import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useSearch } from '../App'
import YearNav from '../components/YearNav'
import CategoryFilter from '../components/CategoryFilter'
import TipCard from '../components/TipCard'
import EmptyState from '../components/EmptyState'
import AgeReminder from '../components/AgeReminder'
import { Loader2, SlidersHorizontal, X, Star } from 'lucide-react'

function TipsGrid({ tips, onToggleFavorite }) {
  if (tips.length === 0) return null
  const isOdd = tips.length % 2 !== 0

  return (
    <div className="grid grid-cols-2 gap-3">
      {tips.map((tip, i) => {
        const isLastOdd = isOdd && i === tips.length - 1
        return (
          <div key={tip.id} className={`flex flex-col ${isLastOdd ? 'col-span-2' : ''}`}>
            <TipCard tip={tip} featured={isLastOdd} onToggleFavorite={onToggleFavorite} />
          </div>
        )
      })}
    </div>
  )
}

export default function Home() {
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeYear, setActiveYear] = useState('all')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const { searchQuery, setSearchQuery } = useSearch()
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    fetchTips()
  }, [])

  async function fetchTips() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('tips')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError('Adviezen konden niet worden geladen. Probeer de pagina te vernieuwen.')
    } else {
      setTips(data || [])
    }
    setLoading(false)
  }

  async function handleToggleFavorite(tipId) {
    const tip = tips.find(t => t.id === tipId)
    if (!tip) return
    const newVal = !tip.favorited
    // Optimistic update
    setTips(prev => prev.map(t => t.id === tipId ? { ...t, favorited: newVal } : t))
    const { error } = await supabase.from('tips').update({ favorited: newVal }).eq('id', tipId)
    if (error) {
      // Revert on error
      setTips(prev => prev.map(t => t.id === tipId ? { ...t, favorited: !newVal } : t))
    }
  }

  const tipCounts = useMemo(() => {
    const counts = {}
    counts['always'] = tips.filter((t) => t.always_relevant).length
    for (let y = 0; y <= 10; y++) {
      counts[y] = tips.filter((t) => !t.always_relevant && t.years?.includes(y)).length
    }
    return counts
  }, [tips])

  // Zoekfilter
  const searchLower = searchQuery.toLowerCase().trim()

  let filteredTips = tips
  if (searchLower) {
    filteredTips = filteredTips.filter(t =>
      t.title?.toLowerCase().includes(searchLower) ||
      t.note?.toLowerCase().includes(searchLower) ||
      t.source_label?.toLowerCase().includes(searchLower) ||
      t.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
      t.categories?.some(cat => cat.toLowerCase().includes(searchLower))
    )
  }

  if (showFavoritesOnly) {
    filteredTips = filteredTips.filter(t => t.favorited)
  }

  let visibleTips = []
  let alwaysRelevantTips = []

  if (activeYear === 'all') {
    visibleTips = filteredTips
  } else {
    alwaysRelevantTips = filteredTips.filter((t) => t.always_relevant)
    visibleTips = filteredTips.filter((t) => !t.always_relevant && t.years?.includes(activeYear))
  }

  if (selectedCategories.length > 0) {
    const filterFn = (t) => selectedCategories.some((c) => t.categories?.includes(c))
    visibleTips = visibleTips.filter(filterFn)
    alwaysRelevantTips = alwaysRelevantTips.filter(filterFn)
  }

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? [] : [cat]
    )
  }

  const isEmpty = visibleTips.length === 0 && alwaysRelevantTips.length === 0

  return (
    <div className="pb-8">
      <YearNav
        activeYear={activeYear}
        onYearChange={setActiveYear}
        tipCounts={tipCounts}
        totalCount={tips.length}
      />

      {/* Favorieten toggle + filter */}
      <div className="px-3 pt-2 flex gap-2 items-center">
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          aria-label="Toon alleen favorieten"
          aria-pressed={showFavoritesOnly}
          className={`flex-shrink-0 p-2.5 rounded-full border shadow-sm transition-all ${
            showFavoritesOnly
              ? 'bg-amber-400 border-amber-400 text-white'
              : 'bg-white border-stone-200 text-stone-400 hover:bg-amber-50'
          }`}
        >
          <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-white' : ''}`} />
        </button>

        {/* Mobiele filter-knop */}
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="md:hidden flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-white shadow-sm border border-stone-200 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {selectedCategories.length > 0 && (
            <span className="bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {selectedCategories.length}
            </span>
          )}
        </button>
      </div>

      {/* Leeftijdsherinnering */}
      <AgeReminder />

      {/* Mobiel filter-menu (overlay) */}
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
            <CategoryFilter
              vertical
              selectedCategories={selectedCategories}
              onToggle={toggleCategory}
            />
          </div>
        </div>
      )}

      <div className="flex min-h-0">
        {/* Linker sidebar: categorieën (alleen op desktop) */}
        <aside className="hidden md:block w-44 flex-shrink-0 bg-white/70 border-r border-stone-100 backdrop-blur-sm">
          <CategoryFilter
            vertical
            selectedCategories={selectedCategories}
            onToggle={toggleCategory}
          />
        </aside>

        {/* Hoofd content */}
        <div className="flex-1 min-w-0 p-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button onClick={fetchTips} className="text-sm text-orange-500 underline font-bold">
                Opnieuw proberen
              </button>
            </div>
          ) : isEmpty ? (
            searchQuery ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-stone-500 text-sm">Geen resultaten voor "{searchQuery}"</p>
                <button onClick={() => setSearchQuery('')} className="text-sm text-pink-500 underline font-bold mt-2">
                  Zoekopdracht wissen
                </button>
              </div>
            ) : (
              <EmptyState year={activeYear} />
            )
          ) : (
            <div className="space-y-6">
              {activeYear !== 'all' && alwaysRelevantTips.length > 0 && (
                <section>
                  <h2 className="font-serif font-bold text-purple-700 text-base mb-3 flex items-center gap-1.5">
                    <span className="text-lg">⭐</span> Altijd relevant
                  </h2>
                  <TipsGrid tips={alwaysRelevantTips} onToggleFavorite={handleToggleFavorite} />
                </section>
              )}

              {visibleTips.length > 0 && (
                <section>
                  {activeYear !== 'all' && (
                    <h2 className="font-serif font-bold text-pink-700 text-base mb-3 flex items-center gap-1.5">
                      <span className="text-lg">📅</span> Jaar {activeYear}
                    </h2>
                  )}
                  <TipsGrid tips={visibleTips} onToggleFavorite={handleToggleFavorite} />
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
