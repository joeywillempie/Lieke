import { useRef, useEffect, useMemo } from 'react'
import { ExternalLink, Baby, ChevronRight, Sparkles } from 'lucide-react'
import { BIRTH_DATE } from '../constants/config'
import { BABY_WEEKS, BABY_MONTHS } from '../constants/babyWeeks'

function getLiekesAgeInWeeks() {
  const now = new Date()
  const diffMs = now - BIRTH_DATE
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
}

function getLiekesAgeInMonths() {
  const now = new Date()
  return (now.getFullYear() - BIRTH_DATE.getFullYear()) * 12 + (now.getMonth() - BIRTH_DATE.getMonth())
}

function getWeekDateRange(weekNum) {
  const start = new Date(BIRTH_DATE)
  start.setDate(start.getDate() + weekNum * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d) => `${d.getDate()} ${['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][d.getMonth()]}`
  return `${fmt(start)} – ${fmt(end)}`
}

function getMonthDateRange(monthNum) {
  const start = new Date(BIRTH_DATE)
  start.setMonth(start.getMonth() + monthNum)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setDate(end.getDate() - 1)
  const fmt = (d) => `${d.getDate()} ${['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][d.getMonth()]}`
  return `${fmt(start)} – ${fmt(end)}`
}

export default function BabyCalendar() {
  const currentWeek = getLiekesAgeInWeeks()
  const currentMonth = getLiekesAgeInMonths()
  const activeRef = useRef(null)
  const scrollContainerRef = useRef(null)

  // Determine if we're in weeks phase (0-26) or months phase (7-24)
  const isInWeeksPhase = currentWeek <= 26
  const activeWeek = isInWeeksPhase ? currentWeek : null
  const activeMonth = !isInWeeksPhase ? currentMonth : null

  useEffect(() => {
    // Scroll to the active week/month card
    if (activeRef.current) {
      setTimeout(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [])

  const ageText = useMemo(() => {
    if (currentWeek < 0) return 'Lieke is nog niet geboren'
    if (currentWeek <= 26) return `Lieke is ${currentWeek} ${currentWeek === 1 ? 'week' : 'weken'} oud`
    return `Lieke is ${currentMonth} maanden oud`
  }, [currentWeek, currentMonth])

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Baby className="w-5 h-5 text-pink-500" />
          <h2 className="font-serif font-bold text-xl text-stone-800">Babykalender</h2>
        </div>
        <p className="text-sm text-stone-500">{ageText}</p>
      </div>

      {/* Weken sectie */}
      <div className="px-4 mb-2">
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
          Per week (0–26)
        </h3>
      </div>
      <div className="px-4 space-y-2">
        {BABY_WEEKS.map((item) => {
          const isActive = item.week === activeWeek
          const isPast = currentWeek > item.week
          const isFuture = currentWeek < item.week
          const dateRange = getWeekDateRange(item.week)

          return (
            <a
              key={`w${item.week}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              ref={isActive ? activeRef : null}
              className={`
                block rounded-2xl border transition-all
                ${isActive
                  ? 'bg-gradient-to-r from-orange-50 to-pink-50 border-orange-300 shadow-md ring-2 ring-orange-200'
                  : isPast
                    ? 'bg-white border-stone-100 opacity-70 hover:opacity-100'
                    : 'bg-white border-stone-100 hover:border-orange-200 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-start gap-3 p-3">
                {/* Week nummer */}
                <div className={`
                  flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm
                  ${isActive
                    ? 'bg-orange-400 text-white shadow-sm'
                    : isPast
                      ? 'bg-stone-100 text-stone-400'
                      : 'bg-orange-50 text-orange-400'
                  }
                `}>
                  {item.week}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-800">
                      Week {item.label}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center gap-0.5 bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                        Nu
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">{dateRange}</p>
                  {/* Topics */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.topics.map((topic, i) => (
                      <span
                        key={i}
                        className={`
                          inline-block text-[11px] px-2 py-0.5 rounded-full
                          ${isActive
                            ? 'bg-orange-100 text-orange-700 font-semibold'
                            : 'bg-stone-50 text-stone-500'
                          }
                        `}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 mt-2">
                  <ExternalLink className={`w-3.5 h-3.5 ${isActive ? 'text-orange-400' : 'text-stone-300'}`} />
                </div>
              </div>
            </a>
          )
        })}
      </div>

      {/* Maanden sectie */}
      <div className="px-4 mt-6 mb-2">
        <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-2">
          Per maand (7–24)
        </h3>
      </div>
      <div className="px-4 space-y-2">
        {BABY_MONTHS.map((item) => {
          const isActive = item.month === activeMonth && !isInWeeksPhase
          const isPast = currentMonth > item.month
          const isFuture = currentMonth < item.month
          const dateRange = getMonthDateRange(item.month)

          return (
            <a
              key={`m${item.month}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              ref={isActive ? activeRef : null}
              className={`
                block rounded-2xl border transition-all
                ${isActive
                  ? 'bg-gradient-to-r from-pink-50 to-orange-50 border-pink-300 shadow-md ring-2 ring-pink-200'
                  : isPast
                    ? 'bg-white border-stone-100 opacity-70 hover:opacity-100'
                    : 'bg-white border-stone-100 hover:border-pink-200 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Maand nummer */}
                <div className={`
                  flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm
                  ${isActive
                    ? 'bg-pink-400 text-white shadow-sm'
                    : isPast
                      ? 'bg-stone-100 text-stone-400'
                      : 'bg-pink-50 text-pink-400'
                  }
                `}>
                  {item.month}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-800">
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center gap-0.5 bg-pink-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                        Nu
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">{dateRange}</p>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                  <ExternalLink className={`w-3.5 h-3.5 ${isActive ? 'text-pink-400' : 'text-stone-300'}`} />
                </div>
              </div>
            </a>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 mt-6">
        <p className="text-[11px] text-stone-400 text-center">
          Artikelen via 24baby.nl — opent in je browser
        </p>
      </div>
    </div>
  )
}
