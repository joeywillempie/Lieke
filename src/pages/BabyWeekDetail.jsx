import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { BABY_WEEKS, BABY_MONTHS } from '../constants/babyWeeks'

function getSlug(type, num) {
  if (type === 'week') {
    if (num === 0) return 'baby-0-weken-oud'
    if (num === 1) return 'baby-1-week-oud'
    return `baby-${num}-weken-oud`
  }
  return `baby-${num}-maanden-oud`
}

function getPrevNext(type, weekNum) {
  const isWeek = type === 'week'
  const prev = isWeek
    ? (weekNum > 0 ? { type: 'week', num: weekNum - 1 } : null)
    : (weekNum > 7 ? { type: 'maand', num: weekNum - 1 } : { type: 'week', num: 26 })
  const next = isWeek
    ? (weekNum < 26 ? { type: 'week', num: weekNum + 1 } : { type: 'maand', num: 7 })
    : (weekNum < 24 ? { type: 'maand', num: weekNum + 1 } : null)

  const prevLabel = prev
    ? (prev.type === 'week'
      ? (prev.num === 1 ? '1 week' : `${prev.num} weken`)
      : `${prev.num} mnd`)
    : null
  const nextLabel = next
    ? (next.type === 'week'
      ? (next.num === 1 ? '1 week' : `${next.num} weken`)
      : `${next.num} mnd`)
    : null

  const prevLink = prev ? `/babykalender/${prev.type === 'week' ? 'week' : 'maand'}/${prev.num}` : null
  const nextLink = next ? `/babykalender/${next.type === 'week' ? 'week' : 'maand'}/${next.num}` : null

  return { prevLink, nextLink, prevLabel, nextLabel }
}

export default function BabyWeekDetail() {
  const { type, num } = useParams()
  const navigate = useNavigate()
  const weekNum = parseInt(num, 10)
  const [content, setContent] = useState(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navRef = useRef(null)
  const activeRef = useRef(null)

  const isWeek = type === 'week'
  const slug = getSlug(type, weekNum)
  const externalUrl = `https://www.24baby.nl/baby-kalender/${slug}/`

  const currentItem = isWeek
    ? BABY_WEEKS.find(w => w.week === weekNum)
    : BABY_MONTHS.find(m => m.month === weekNum)

  const { prevLink, nextLink, prevLabel, nextLabel } = getPrevNext(type, weekNum)

  // All items for the horizontal nav
  const allItems = [
    ...BABY_WEEKS.map(w => ({ type: 'week', num: w.week, label: String(w.week) })),
    ...BABY_MONTHS.map(m => ({ type: 'maand', num: m.month, label: `${m.month}m` })),
  ]

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

    window.scrollTo(0, 0)
    return () => { cancelled = true }
  }, [slug])

  // Scroll active item into view in the nav bar
  useEffect(() => {
    if (activeRef.current && navRef.current) {
      const nav = navRef.current
      const el = activeRef.current
      const left = el.offsetLeft - nav.offsetWidth / 2 + el.offsetWidth / 2
      nav.scrollTo({ left, behavior: 'smooth' })
    }
  }, [type, weekNum])

  const isActive = (itemType, itemNum) =>
    (isWeek && itemType === 'week' && itemNum === weekNum) ||
    (!isWeek && itemType === 'maand' && itemNum === weekNum)

  return (
    <div className="pb-8">
      {/* Week navigation bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        {/* Nav label + scrollable circles */}
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide flex-shrink-0 pl-1">
            {isWeek ? 'Weken' : 'Mnd'}
          </span>
          <div
            ref={navRef}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1"
          >
            {allItems.map(item => {
              const active = isActive(item.type, item.num)
              return (
                <button
                  key={`${item.type}-${item.num}`}
                  ref={active ? activeRef : undefined}
                  onClick={() => navigate(`/babykalender/${item.type === 'week' ? 'week' : 'maand'}/${item.num}`)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    active
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Title + prev/next */}
        <div className="flex items-center px-3 pb-3 pt-1">
          {prevLink ? (
            <button
              onClick={() => navigate(prevLink)}
              className="flex flex-col items-center gap-0 text-orange-500 hover:text-orange-600 transition-colors min-w-[70px]"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{prevLabel}</span>
            </button>
          ) : <div className="min-w-[70px]" />}

          <div className="flex-1 text-center">
            <h1 className="font-serif font-bold text-stone-800 text-xl leading-tight">
              {title || (isWeek ? `Baby ${weekNum} weken oud` : `Baby ${weekNum} maanden oud`)}
            </h1>
            {currentItem?.topics?.length > 0 && (
              <p className="text-xs text-stone-400 mt-1">
                {currentItem.topics.join(' · ')}
              </p>
            )}
          </div>

          {nextLink ? (
            <button
              onClick={() => navigate(nextLink)}
              className="flex flex-col items-center gap-0 text-orange-500 hover:text-orange-600 transition-colors min-w-[70px]"
            >
              <ChevronRight className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{nextLabel}</span>
            </button>
          ) : <div className="min-w-[70px]" />}
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

      {/* Bottom prev/next */}
      {!loading && (
        <div className="flex items-center justify-between px-4 pt-4 border-t border-stone-100 mt-4">
          {prevLink ? (
            <button
              onClick={() => navigate(prevLink)}
              className="flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {prevLabel}
            </button>
          ) : <div />}
          {nextLink ? (
            <button
              onClick={() => navigate(nextLink)}
              className="flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              {nextLabel}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : <div />}
        </div>
      )}
    </div>
  )
}
