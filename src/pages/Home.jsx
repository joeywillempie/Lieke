import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import YearNav from '../components/YearNav'
import CategoryFilter from '../components/CategoryFilter'
import TipCard from '../components/TipCard'
import EmptyState from '../components/EmptyState'
import { Loader2, SlidersHorizontal, X } from 'lucide-react'

function TipsGrid({ tips }) {
  if (tips.length === 0) return null
  const isOdd = tips.length % 2 !== 0

  return (
    <div className="grid grid-cols-2 gap-3">
      {tips.map((tip, i) => {
        const isLastOdd = isOdd && i === tips.length - 1
        return (
          <div key={tip.id} className={`flex flex-col ${isLastOdd ? 'col-span-2' : ''}`}>
            <TipCard tip={tip} featured={isLastOdd} />
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

  const tipCounts = useMemo(() => {
    const counts = {}
    counts['always'] = tips.filter((t) => t.always_relevant).length
    for (let y = 0; y <= 10; y++) {
      counts[y] = tips.filter((t) => !t.always_relevant && t.years?.includes(y)).length
    }
    return counts
  }, [tips])

  let visibleTips = []
  let alwaysRelevantTips = []

  if (activeYear === 'all') {
    visibleTips = tips
  } else {
    alwaysRelevantTips = tips.filter((t) => t.always_relevant)
    visibleTips = tips.filter((t) => !t.always_relevant && t.years?.includes(activeYear))
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

      {/* Mobiele filter-knop (alleen zichtbaar op telefoon) */}
      <div className="md:hidden px-3 pt-2">
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-stone-200 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Categorieën
          {selectedCategories.length > 0 && (
            <span className="bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {selectedCategories.length}
            </span>
          )}
        </button>
      </div>

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
            <EmptyState year={activeYear} />
          ) : (
            <div className="space-y-6">
              {activeYear !== 'all' && alwaysRelevantTips.length > 0 && (
                <section>
                  <h2 className="font-serif font-bold text-purple-700 text-base mb-3 flex items-center gap-1.5">
                    <span className="text-lg">⭐</span> Altijd relevant
                  </h2>
                  <TipsGrid tips={alwaysRelevantTips} />
                </section>
              )}

              {visibleTips.length > 0 && (
                <section>
                  {activeYear !== 'all' && (
                    <h2 className="font-serif font-bold text-pink-700 text-base mb-3 flex items-center gap-1.5">
                      <span className="text-lg">📅</span> Jaar {activeYear}
                    </h2>
                  )}
                  <TipsGrid tips={visibleTips} />
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
