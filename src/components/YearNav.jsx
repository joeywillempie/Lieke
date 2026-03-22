import { useState, useRef, useEffect } from 'react'
import { YEARS } from '../constants/years'

// Regenboog per positie
const PALETTE = [
  { active: 'bg-violet-500 text-white shadow-violet-200', inactive: 'bg-violet-100 text-violet-700 hover:bg-violet-200' },
  { active: 'bg-pink-500 text-white shadow-pink-200', inactive: 'bg-pink-100 text-pink-700 hover:bg-pink-200' },
  { active: 'bg-red-500 text-white shadow-red-200', inactive: 'bg-red-100 text-red-700 hover:bg-red-200' },
  { active: 'bg-orange-500 text-white shadow-orange-200', inactive: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { active: 'bg-amber-500 text-white shadow-amber-200', inactive: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  { active: 'bg-yellow-500 text-white shadow-yellow-200', inactive: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  { active: 'bg-lime-500 text-white shadow-lime-200', inactive: 'bg-lime-100 text-lime-700 hover:bg-lime-200' },
  { active: 'bg-green-500 text-white shadow-green-200', inactive: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { active: 'bg-emerald-500 text-white shadow-emerald-200', inactive: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  { active: 'bg-teal-500 text-white shadow-teal-200', inactive: 'bg-teal-100 text-teal-700 hover:bg-teal-200' },
  { active: 'bg-cyan-500 text-white shadow-cyan-200', inactive: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' },
  { active: 'bg-sky-500 text-white shadow-sky-200', inactive: 'bg-sky-100 text-sky-700 hover:bg-sky-200' },
  { active: 'bg-blue-500 text-white shadow-blue-200', inactive: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { active: 'bg-indigo-500 text-white shadow-indigo-200', inactive: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
  { active: 'bg-violet-600 text-white shadow-violet-200', inactive: 'bg-violet-100 text-violet-700 hover:bg-violet-200' },
  { active: 'bg-purple-500 text-white shadow-purple-200', inactive: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { active: 'bg-fuchsia-500 text-white shadow-fuchsia-200', inactive: 'bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200' },
  { active: 'bg-pink-600 text-white shadow-pink-200', inactive: 'bg-pink-100 text-pink-700 hover:bg-pink-200' },
  { active: 'bg-rose-500 text-white shadow-rose-200', inactive: 'bg-rose-100 text-rose-700 hover:bg-rose-200' },
  { active: 'bg-red-600 text-white shadow-red-200', inactive: 'bg-red-100 text-red-700 hover:bg-red-200' },
]

export default function YearNav({ activeYear, onYearChange }) {
  const years = ['all', ...YEARS]
  const [poppingYear, setPoppingYear] = useState(null)
  const scrollRef = useRef(null)
  const btnRefs = useRef({})

  // Scroll actief jaar in beeld bij laden
  useEffect(() => {
    const el = btnRefs.current[activeYear]
    if (el && scrollRef.current) {
      el.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
    }
  }, [activeYear])

  function handleClick(year) {
    onYearChange(year)
    setPoppingYear(year)
    setTimeout(() => setPoppingYear(null), 350)
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-1.5 px-2 py-2 bg-white border-b border-stone-100 overflow-x-auto scrollbar-hide"
    >
      {years.map((year, i) => {
        const isActive = activeYear === year
        const label = year === 'all' ? 'Alles' : year === 'always' ? 'Altijd' : `${year}`
        const isPopping = poppingYear === year
        const colors = PALETTE[i % PALETTE.length]

        return (
          <button
            key={year}
            ref={el => btnRefs.current[year] = el}
            onClick={() => handleClick(year)}
            aria-label={year === 'all' ? 'Toon alle tips' : `Toon tips voor jaar ${year}`}
            aria-pressed={isActive}
            className={`year-btn flex-shrink-0 md:flex-shrink md:flex-1 min-w-[3rem] px-3 flex items-center justify-center py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isActive ? `${colors.active} shadow-md scale-105` : `${colors.inactive}`
            } ${isPopping ? 'year-pop' : ''}`}
          >
            <span className="leading-none">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
