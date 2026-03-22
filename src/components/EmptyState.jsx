import { useNavigate } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'

const MESSAGES = {
  all: { emoji: '📚', title: 'Je bibliotheek is nog leeg', subtitle: 'Voeg je eerste advies toe en begin met verzamelen!' },
  0: { emoji: '👶', title: 'Nog geen tips voor jaar 0', subtitle: 'De eerste maanden — voeg je ontdekkingen toe!' },
  1: { emoji: '🎂', title: 'Nog geen tips voor jaar 1', subtitle: 'De eerste stapjes! Wat heb je geleerd?' },
  2: { emoji: '🗣️', title: 'Nog geen tips voor jaar 2', subtitle: 'De eerste woordjes — een magische leeftijd!' },
  3: { emoji: '🎨', title: 'Nog geen tips voor jaar 3', subtitle: 'Creatief en eigenwijs — voeg je ervaringen toe!' },
}

function getMsg(year) {
  if (MESSAGES[year]) return MESSAGES[year]
  if (year === 'always') return { emoji: '⭐', title: 'Geen altijd-relevante tips', subtitle: 'Markeer tips als "altijd relevant" om ze hier te zien.' }
  return { emoji: '📝', title: `Nog geen tips voor jaar ${year}`, subtitle: 'Voeg tips toe die je wilt bewaren voor deze leeftijd.' }
}

export default function EmptyState({ year }) {
  const navigate = useNavigate()
  const { emoji, title, subtitle } = getMsg(year)

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="text-5xl mb-4 animate-bounce-in">{emoji}</div>
      <h3 className="font-serif font-bold text-xl text-stone-700 mb-2">
        {title}
      </h3>
      <p className="text-stone-400 text-sm max-w-xs mb-6">
        {subtitle}
      </p>
      <button
        onClick={() => navigate('/tip/nieuw')}
        className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105"
      >
        <PlusCircle className="w-5 h-5" />
        Eerste tip toevoegen
      </button>
    </div>
  )
}
