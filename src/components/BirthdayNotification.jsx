import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

const BIRTH_DATE = new Date(2026, 0, 20) // 20 januari 2026

function getLiekesAge(now) {
  const months =
    (now.getFullYear() - BIRTH_DATE.getFullYear()) * 12 +
    (now.getMonth() - BIRTH_DATE.getMonth())
  return months
}


export default function BirthdayNotification({ visible, onDismiss }) {
  const now = new Date()
  const months = getLiekesAge(now)
  const fired = useRef(false)

  useEffect(() => {
    if (!visible) { fired.current = false; return }
    if (fired.current) return
    fired.current = true

    const burst = () => confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.4 },
      colors: ['#f97316', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#f472b6'],
    })

    burst()
    const t1 = setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.5 }, colors: ['#f97316', '#fbbf24', '#f472b6'] }), 350)
    const t2 = setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.5 }, colors: ['#34d399', '#60a5fa', '#fb923c'] }), 600)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onDismiss} />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-bounce-in">
        {/* Ballonnen emoji's */}
        <div className="text-5xl mb-3 select-none">🎈🎂🎈</div>

        <h2 className="font-serif font-bold text-3xl text-orange-500 mb-1">
          Gefeliciteerd!
        </h2>

        <p className="text-stone-700 text-lg font-semibold mb-1">
          Lieke is vandaag
        </p>

        <p className="text-5xl font-bold text-orange-400 my-3">
          {months} <span className="text-2xl text-stone-500 font-normal">maanden</span>
        </p>

        <p className="text-stone-400 text-sm mb-6">
          🌟 Wat een wonder dat ze al zo groot is!
        </p>

        <button
          onClick={onDismiss}
          className="bg-orange-400 hover:bg-orange-500 text-white font-bold px-8 py-3 rounded-2xl text-base transition-colors"
        >
          🎉 Joepie!
        </button>

        <p className="text-[10px] text-stone-300 mt-4">
          Verschijnt automatisch op de 20e van elke maand
        </p>
      </div>
    </div>
  )
}
