import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronUp, ChevronDown, Clock } from 'lucide-react'

export default function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const [h, m] = value ? value.split(':').map(Number) : [8, 0]
  const [hours, setHours] = useState(value ? h : 8)
  const [minutes, setMinutes] = useState(value ? m : 0)

  const holdTimer = useRef(null)
  const holdInterval = useRef(null)

  // Sluit bij klik buiten
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Sync als value extern verandert
  useEffect(() => {
    if (value) {
      const [eh, em] = value.split(':').map(Number)
      setHours(eh)
      setMinutes(em)
    }
  }, [value])

  function confirm() {
    onChange(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
    setOpen(false)
  }

  function clear() {
    onChange('')
    setOpen(false)
  }

  function modH(delta) { setHours(h => (h + delta + 24) % 24) }
  function modM(delta) { setMinutes(m => (m + delta + 60) % 60) }

  function onWheelH(e) { e.preventDefault(); modH(e.deltaY > 0 ? -1 : 1) }
  function onWheelM(e) { e.preventDefault(); modM(e.deltaY > 0 ? -1 : 1) }

  // Ingedrukt houden: eerste klik direct, daarna herhalen na 400ms elke 80ms
  function startHold(fn) {
    fn()
    holdTimer.current = setTimeout(() => {
      holdInterval.current = setInterval(fn, 80)
    }, 400)
  }

  function stopHold() {
    clearTimeout(holdTimer.current)
    clearInterval(holdInterval.current)
  }

  // Helper om hold-props te genereren
  const hold = useCallback((fn) => ({
    onMouseDown: (e) => { e.preventDefault(); startHold(fn) },
    onMouseUp: stopHold,
    onMouseLeave: stopHold,
    onTouchStart: (e) => { e.preventDefault(); startHold(fn) },
    onTouchEnd: stopHold,
  }), [])

  const display = value
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    : null

  return (
    <div ref={ref} className="relative flex-1">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 text-sm border border-orange-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 text-left"
      >
        <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
        <span className={display ? 'text-stone-800 font-bold tracking-widest' : 'text-stone-400'}>
          {display ?? 'Tijd (optioneel)'}
        </span>
      </button>

      {/* Klok popup — opent naar boven */}
      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-30 bg-white rounded-2xl shadow-xl border border-orange-100 p-5 w-56">
          <div className="flex items-center justify-center gap-2 mb-4">

            {/* Uren */}
            <div className="flex flex-col items-center gap-1" onWheel={onWheelH}>
              <button
                type="button"
                {...hold(() => modH(1))}
                className="text-orange-400 hover:text-orange-600 active:text-orange-700 transition-colors select-none"
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              <span className="text-4xl font-bold text-stone-800 w-14 text-center tabular-nums">
                {String(hours).padStart(2, '0')}
              </span>
              <button
                type="button"
                {...hold(() => modH(-1))}
                className="text-orange-400 hover:text-orange-600 active:text-orange-700 transition-colors select-none"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>

            <span className="text-4xl font-bold text-stone-300 mb-0.5">:</span>

            {/* Minuten */}
            <div className="flex flex-col items-center gap-1" onWheel={onWheelM}>
              <button
                type="button"
                {...hold(() => modM(1))}
                className="text-orange-400 hover:text-orange-600 active:text-orange-700 transition-colors select-none"
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              <span className="text-4xl font-bold text-stone-800 w-14 text-center tabular-nums">
                {String(minutes).padStart(2, '0')}
              </span>
              <button
                type="button"
                {...hold(() => modM(-1))}
                className="text-orange-400 hover:text-orange-600 active:text-orange-700 transition-colors select-none"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Bevestig / wis */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clear}
              className="flex-1 text-sm text-stone-400 hover:text-stone-600 py-2 rounded-xl border border-stone-200 hover:border-stone-300 transition-colors"
            >
              Wissen
            </button>
            <button
              type="button"
              onClick={confirm}
              className="flex-1 text-sm font-bold bg-orange-400 hover:bg-orange-500 text-white py-2 rounded-xl transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
