import { BookOpen } from 'lucide-react'

export default function EmptyState({ year }) {
  const label = year === 'always' ? 'dit onderwerp' : `jaar ${year}`
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-4 shadow-sm">
        <BookOpen className="w-10 h-10 text-orange-400" />
      </div>
      <h3 className="font-serif font-bold text-xl text-stone-700 mb-2">
        Nog geen tips voor {label}
      </h3>
      <p className="text-stone-400 text-sm max-w-xs">
        Voeg je eerste tip toe via de knop bovenaan!
      </p>
    </div>
  )
}
