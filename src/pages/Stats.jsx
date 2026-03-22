import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIES } from '../constants/categories'
import { Loader2 } from 'lucide-react'

export default function Stats() {
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tips')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTips(data || [])
        setLoading(false)
      })
  }, [])

  const stats = useMemo(() => {
    const total = tips.length
    const proven = tips.filter(t => t.proven).length
    const favorited = tips.filter(t => t.favorited).length
    const youtube = tips.filter(t => t.type === 'youtube').length
    const podcast = tips.filter(t => t.type === 'podcast').length
    const text = tips.filter(t => t.type === 'text').length
    const alwaysRelevant = tips.filter(t => t.always_relevant).length

    // Per categorie
    const perCategory = CATEGORIES.map(cat => ({
      name: cat,
      count: tips.filter(t => t.categories?.includes(cat)).length,
    })).sort((a, b) => b.count - a.count)

    // Per jaar
    const perYear = {}
    for (let y = 0; y <= 10; y++) {
      perYear[y] = tips.filter(t => !t.always_relevant && t.years?.includes(y)).length
    }

    // Per maker
    const creators = {}
    tips.forEach(t => {
      const by = t.created_by || 'Onbekend'
      creators[by] = (creators[by] || 0) + 1
    })
    const perCreator = Object.entries(creators)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Recente activiteit (laatste 7 dagen)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const recentCount = tips.filter(t => new Date(t.created_at) > weekAgo).length

    // Tags
    const tagCounts = {}
    tips.forEach(t => {
      t.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return { total, proven, favorited, youtube, podcast, text, alwaysRelevant, perCategory, perYear, perCreator, recentCount, topTags }
  }, [tips])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
      </div>
    )
  }

  const maxYearCount = Math.max(...Object.values(stats.perYear), 1)
  const maxCatCount = Math.max(...stats.perCategory.map(c => c.count), 1)

  return (
    <div className="p-4 pb-8 max-w-lg mx-auto space-y-5">
      <h1 className="font-serif font-bold text-2xl text-stone-800 mb-1">📊 Statistieken</h1>
      <p className="text-stone-500 text-sm mb-4">Een overzicht van jullie tips bibliotheek.</p>

      {/* Overzicht kaarten */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard emoji="📚" label="Totaal tips" value={stats.total} color="bg-purple-50 border-purple-200" />
        <StatCard emoji="✅" label="Bewezen" value={stats.proven} color="bg-green-50 border-green-200" />
        <StatCard emoji="⭐" label="Favorieten" value={stats.favorited} color="bg-amber-50 border-amber-200" />
        <StatCard emoji="🆕" label="Deze week" value={stats.recentCount} color="bg-blue-50 border-blue-200" />
      </div>

      {/* Type verdeling */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h2 className="font-bold text-stone-700 text-sm mb-3">📝 Per type</h2>
        <div className="flex gap-3">
          <TypeBadge emoji="📄" label="Tekst" count={stats.text} total={stats.total} color="bg-sky-400" />
          <TypeBadge emoji="🎬" label="YouTube" count={stats.youtube} total={stats.total} color="bg-red-400" />
          <TypeBadge emoji="🎙️" label="Podcast" count={stats.podcast} total={stats.total} color="bg-purple-400" />
        </div>
      </div>

      {/* Per jaar */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h2 className="font-bold text-stone-700 text-sm mb-3">📅 Per jaar</h2>
        <div className="space-y-2">
          {Object.entries(stats.perYear).map(([year, count]) => (
            <div key={year} className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500 w-8 text-right">{year}</span>
              <div className="flex-1 bg-stone-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-400 to-orange-400 rounded-full transition-all duration-500 flex items-center justify-end pr-1.5"
                  style={{ width: `${Math.max((count / maxYearCount) * 100, count > 0 ? 12 : 0)}%` }}
                >
                  {count > 0 && <span className="text-[10px] font-bold text-white">{count}</span>}
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-purple-500 w-8 text-right">⭐</span>
            <div className="flex-1 bg-stone-100 rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-violet-400 rounded-full transition-all duration-500 flex items-center justify-end pr-1.5"
                style={{ width: `${Math.max((stats.alwaysRelevant / maxYearCount) * 100, stats.alwaysRelevant > 0 ? 12 : 0)}%` }}
              >
                {stats.alwaysRelevant > 0 && <span className="text-[10px] font-bold text-white">{stats.alwaysRelevant}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per categorie */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h2 className="font-bold text-stone-700 text-sm mb-3">🏷️ Per categorie</h2>
        <div className="space-y-2">
          {stats.perCategory.map(({ name, count }) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-600 w-28 truncate text-right">{name}</span>
              <div className="flex-1 bg-stone-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-500 flex items-center justify-end pr-1.5"
                  style={{ width: `${Math.max((count / maxCatCount) * 100, count > 0 ? 12 : 0)}%` }}
                >
                  {count > 0 && <span className="text-[10px] font-bold text-white">{count}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per maker */}
      {stats.perCreator.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h2 className="font-bold text-stone-700 text-sm mb-3">👤 Per maker</h2>
          <div className="flex flex-wrap gap-2">
            {stats.perCreator.map(({ name, count }) => (
              <span key={name} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-xs font-bold border border-violet-200">
                {name} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {stats.topTags.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h2 className="font-bold text-stone-700 text-sm mb-3">🔖 Populaire tags</h2>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(({ tag, count }) => (
              <span key={tag} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-200">
                #{tag} ({count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ emoji, label, value, color }) {
  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <span className="text-2xl">{emoji}</span>
      <p className="text-2xl font-bold text-stone-800 mt-1">{value}</p>
      <p className="text-xs text-stone-500 font-bold">{label}</p>
    </div>
  )
}

function TypeBadge({ emoji, label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex-1 text-center">
      <div className={`w-10 h-10 rounded-full ${color} mx-auto flex items-center justify-center text-white text-lg mb-1`}>
        {emoji}
      </div>
      <p className="text-sm font-bold text-stone-700">{count}</p>
      <p className="text-[10px] text-stone-400">{label} ({pct}%)</p>
    </div>
  )
}
