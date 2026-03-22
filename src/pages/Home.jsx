import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import YearNav from '../components/YearNav'
import CategoryFilter from '../components/CategoryFilter'
import TipCard from '../components/TipCard'
import EmptyState from '../components/EmptyState'
import { Loader2 } from 'lucide-react'

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

      <div className="flex min-h-0">
        {/* Linker sidebar: categorieën */}
        <aside className="w-44 flex-shrink-0 bg-white/70 border-r border-stone-100 backdrop-blur-sm">
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
