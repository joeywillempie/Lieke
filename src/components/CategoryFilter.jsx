import { CATEGORIES } from '../constants/categories'

const CATEGORY_CONFIG = {
  'Slaap':                 { emoji: '😴', active: 'bg-indigo-500 text-white', inactive: 'text-indigo-700 hover:bg-indigo-100' },
  'Voeding':               { emoji: '🥦', active: 'bg-green-500 text-white',  inactive: 'text-green-700 hover:bg-green-100' },
  'Taal & ontwikkeling':   { emoji: '💬', active: 'bg-sky-500 text-white',    inactive: 'text-sky-700 hover:bg-sky-100' },
  'Spel & stimulatie':     { emoji: '🎨', active: 'bg-yellow-500 text-white', inactive: 'text-yellow-700 hover:bg-yellow-100' },
  'Gedrag & grenzen':      { emoji: '🦁', active: 'bg-orange-500 text-white', inactive: 'text-orange-700 hover:bg-orange-100' },
  'Gezondheid':            { emoji: '❤️', active: 'bg-red-500 text-white',    inactive: 'text-red-700 hover:bg-red-100' },
  'Veiligheid':            { emoji: '🛡️', active: 'bg-teal-500 text-white',   inactive: 'text-teal-700 hover:bg-teal-100' },
  'School & leren':        { emoji: '📚', active: 'bg-purple-500 text-white', inactive: 'text-purple-700 hover:bg-purple-100' },
  'Emoties & gehechtheid': { emoji: '🤗', active: 'bg-pink-500 text-white',   inactive: 'text-pink-700 hover:bg-pink-100' },
}

export default function CategoryFilter({ selectedCategories, onToggle, vertical = false }) {
  if (vertical) {
    return (
      <div className="flex flex-col p-2 gap-0.5">
        {/* Alle-knop */}
        <button
          onClick={() => selectedCategories.length > 0 && selectedCategories.forEach(c => onToggle(c))}
          className={`text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            selectedCategories.length === 0
              ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-sm'
              : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          <span>🌈</span>
          <span>Alle</span>
        </button>

        {CATEGORIES.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat] || { emoji: '📌', active: 'bg-stone-500 text-white', inactive: 'text-stone-600 hover:bg-stone-100' }
          const isSelected = selectedCategories.includes(cat)
          return (
            <button
              key={cat}
              onClick={() => onToggle(cat)}
              aria-label={`Filter op ${cat}`}
              aria-pressed={isSelected}
              className={`text-left px-3 py-2 rounded-xl text-sm font-bold transition-all leading-snug flex items-center gap-2 ${
                isSelected ? `${cfg.active} shadow-sm` : `${cfg.inactive}`
              }`}
            >
              <span className="text-base leading-none">{cfg.emoji}</span>
              <span className="leading-snug">{cat}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 bg-white border-b border-stone-100">
      {CATEGORIES.map((cat) => {
        const cfg = CATEGORY_CONFIG[cat] || { emoji: '📌', active: 'bg-stone-500 text-white', inactive: 'text-stone-600 border-stone-200 hover:bg-stone-50' }
        const isSelected = selectedCategories.includes(cat)
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            aria-label={`Filter op ${cat}`}
            aria-pressed={isSelected}
            className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-all flex items-center gap-1.5 ${
              isSelected
                ? `${cfg.active} border-transparent shadow-sm scale-105`
                : `border-stone-200 ${cfg.inactive}`
            }`}
          >
            <span>{cfg.emoji}</span>
            {cat}
          </button>
        )
      })}
    </div>
  )
}
