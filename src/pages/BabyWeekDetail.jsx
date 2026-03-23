import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { BABY_WEEKS, BABY_MONTHS } from '../constants/babyWeeks'

function getSlug(type, num) {
  if (type === 'week') {
    if (num === 0) return 'baby-0-weken-oud'
    if (num === 1) return 'baby-1-week-oud'
    return `baby-${num}-weken-oud`
  }
  return `baby-${num}-maanden-oud`
}

export default function BabyWeekDetail() {
  const { type, num } = useParams()
  const navigate = useNavigate()
  const weekNum = parseInt(num, 10)
  const [content, setContent] = useState(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const slug = getSlug(type, weekNum)
  const externalUrl = `https://www.24baby.nl/baby-kalender/${slug}/`

  // Determine prev/next navigation
  const isWeek = type === 'week'
  const prevLink = isWeek
    ? (weekNum > 0 ? `/babykalender/week/${weekNum - 1}` : null)
    : (weekNum > 7 ? `/babykalender/maand/${weekNum - 1}` : `/babykalender/week/26`)
  const nextLink = isWeek
    ? (weekNum < 26 ? `/babykalender/week/${weekNum + 1}` : `/babykalender/maand/7`)
    : (weekNum < 24 ? `/babykalender/maand/${weekNum + 1}` : null)

  const currentItem = isWeek
    ? BABY_WEEKS.find(w => w.week === weekNum)
    : BABY_MONTHS.find(m => m.month === weekNum)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setContent(null)

    fetch(`/api/baby-content?slug=${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Kon artikel niet laden')
        return res.json()
      })
      .then(data => {
        if (cancelled) return
        setTitle(data.title || '')
        setContent(data.content || '')
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })

    // Scroll to top on navigation
    window.scrollTo(0, 0)

    return () => { cancelled = true }
  }, [slug])

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/babykalender')}
            className="text-stone-500 hover:text-stone-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif font-semibold text-stone-800 text-lg truncate">
              {title || (isWeek ? `Week ${weekNum}` : `${weekNum} maanden`)}
            </h2>
            {currentItem?.topics?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {currentItem.topics.map((t, i) => (
                  <span key={i} className="text-[10px] text-orange-500 font-semibold">
                    {t}{i < currentItem.topics.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 text-stone-400 hover:text-orange-500 transition-colors"
            title="Open op 24baby.nl"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400 mb-3" />
          <p className="text-sm text-stone-400">Artikel laden...</p>
        </div>
      )}

      {error && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-orange-500 font-bold hover:text-orange-600"
          >
            <ExternalLink className="w-4 h-4" />
            Bekijk op 24baby.nl
          </a>
        </div>
      )}

      {content && (
        <div
          className="baby-article px-4 py-4"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}

      {/* Prev/Next navigatie */}
      {!loading && (
        <div className="flex items-center justify-between px-4 pt-4 border-t border-stone-100 mt-4">
          {prevLink ? (
            <button
              onClick={() => navigate(prevLink)}
              className="flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Vorige
            </button>
          ) : <div />}
          {nextLink ? (
            <button
              onClick={() => navigate(nextLink)}
              className="flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              Volgende
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : <div />}
        </div>
      )}
    </div>
  )
}
