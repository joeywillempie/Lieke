import { BIRTH_DATE } from '../constants/config'

export default function AgeReminder() {
  const now = new Date()
  const months =
    (now.getFullYear() - BIRTH_DATE.getFullYear()) * 12 +
    (now.getMonth() - BIRTH_DATE.getMonth())
  const days = now.getDate() - BIRTH_DATE.getDate()

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  let ageText = ''
  if (years > 0) {
    ageText = `${years} jaar en ${remainingMonths} maand${remainingMonths !== 1 ? 'en' : ''}`
  } else {
    ageText = `${months} maand${months !== 1 ? 'en' : ''}`
  }
  if (days < 0) {
    // Nog niet jarig deze maand, corrigeer
    const correctedMonths = months - 1
    const correctedYears = Math.floor(correctedMonths / 12)
    const correctedRemaining = correctedMonths % 12
    if (correctedYears > 0) {
      ageText = `${correctedYears} jaar en ${correctedRemaining} maand${correctedRemaining !== 1 ? 'en' : ''}`
    } else {
      ageText = `${correctedMonths} maand${correctedMonths !== 1 ? 'en' : ''}`
    }
  }

  return (
    <div className="mx-3 mt-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl px-4 py-2.5 border border-purple-100 flex items-center gap-2">
      <span className="text-lg">👶</span>
      <p className="text-sm text-purple-700">
        <span className="font-bold">Lieke</span> is nu <span className="font-bold text-pink-600">{ageText}</span> oud
      </p>
    </div>
  )
}
