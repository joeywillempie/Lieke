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
      : `${prev.num} maanden`)
    : null
  const nextLabel = next
    ? (next.type === 'week'
      ? (next.num === 1 ? '1 week' : `${next.num} weken`)
      : `${next.num} maanden`)
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

  // Only show weeks in the nav (like 24baby)
  const weekItems = BABY_WEEKS.map(w => ({ num: w.week, label: String(w.week) }))

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

  const scrollNav = (dir) => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' })
    }
  }

  return (
    <div className="pb-8">
      {/* Header area — 24baby style */}
      <div className="sticky top-0 z-10 bg-[#FDF6F0]">
        {/* Week number navigation */}
        <div className="flex items-center gap-1 px-2 py-3">
          <div className="flex flex-col items-center flex-shrink-0 mr-1">
            <span className="text-[11px] font-bold text-[#3D2C6B] leading-tight">Weken</span>
            <span className="text-[11px] font-bold text-[#3D2C6B] leading-tight">baby</span>
          </div>

          <button
            onClick={() => scrollNav(-1)}
            className="flex-shrink-0 text-[#8B7BB5] hover:text-[#5B4A9E] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={navRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 px-1"
          >
            {weekItems.map(item => {
              const active = isWeek && item.num === weekNum
              return (
                <button
                  key={item.num}
                  ref={active ? activeRef : undefined}
                  onClick={() => navigate(`/babykalender/week/${item.num}`)}
                  className={`flex-shrink-0 w-10 h-10 rounded-full text-sm font-bold transition-all ${
                    active
                      ? 'bg-[#6B5CA5] text-white shadow-lg shadow-purple-200'
                      : 'bg-white text-[#3D2C6B] hover:bg-purple-50 border border-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => scrollNav(1)}
            className="flex-shrink-0 text-[#8B7BB5] hover:text-[#5B4A9E] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Title + prev/next — big and centered */}
        <div className="flex items-center px-4 pb-5 pt-2">
          {prevLink ? (
            <button
              onClick={() => navigate(prevLink)}
              className="flex flex-col items-center gap-1 text-[#6B5CA5] hover:text-[#5B4A9E] transition-colors min-w-[80px]"
            >
              <ChevronLeft className="w-8 h-8 stroke-[2.5]" />
              <span className="text-xs font-semibold">{prevLabel}</span>
            </button>
          ) : <div className="min-w-[80px]" />}

          <div className="flex-1 text-center px-2">
            <h1 className="font-serif font-bold text-[#2A1B5B] text-2xl sm:text-3xl leading-tight">
              {title || (isWeek ? `Baby ${weekNum} weken oud` : `Baby ${weekNum} maanden oud`)}
            </h1>
            {currentItem?.topics?.length > 0 && (
              <p className="text-sm text-[#8B7BB5] mt-2 leading-relaxed">
                {currentItem.topics.join(' en ')}
              </p>
            )}
          </div>

          {nextLink ? (
            <button
              onClick={() => navigate(nextLink)}
              className="flex flex-col items-center gap-1 text-[#6B5CA5] hover:text-[#5B4A9E] transition-colors min-w-[80px]"
            >
              <ChevronRight className="w-8 h-8 stroke-[2.5]" />
              <span className="text-xs font-semibold">{nextLabel}</span>
            </button>
          ) : <div className="min-w-[80px]" />}
        </div>

        {/* Subtle bottom border */}
        <div className="h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
      </div>

      {/* Content */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#6B5CA5] mb-3" />
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
            className="inline-flex items-center gap-2 text-sm text-[#6B5CA5] font-bold hover:text-[#5B4A9E]"
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
              className="flex items-center gap-1 text-sm font-bold text-[#6B5CA5] hover:text-[#5B4A9E] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {prevLabel}
            </button>
          ) : <div />}
          {nextLink ? (
            <button
              onClick={() => navigate(nextLink)}
              className="flex items-center gap-1 text-sm font-bold text-[#6B5CA5] hover:text-[#5B4A9E] transition-colors"
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
