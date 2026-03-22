import { useNavigate, useLocation } from 'react-router-dom'
import { PlusCircle, CalendarDays, Settings } from 'lucide-react'

export default function Layout({ children, onTitleClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const onCalendar = location.pathname === '/kalender'
  const onSettings = location.pathname === '/instellingen'

  function handleTitleClick() {
    navigate('/')
    onTitleClick?.()
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #fff1f8 0%, #fff7ed 40%, #f0fdf4 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 shadow-lg px-4 py-3" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 40%, #f97316 100%)' }}>
        {/* Decoratieve stippen */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1 right-24 w-2 h-2 rounded-full bg-white/20" />
          <div className="absolute top-3 right-32 w-1.5 h-1.5 rounded-full bg-white/15" />
          <div className="absolute bottom-1 left-40 w-2 h-2 rounded-full bg-white/20" />
          <div className="absolute top-2 left-56 w-1 h-1 rounded-full bg-white/25" />
        </div>

        <div className="max-w-5xl mx-auto flex items-center justify-between relative">
          <button onClick={handleTitleClick} className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:rotate-12 transition-transform duration-200 inline-block">🌟</span>
            <span className="font-serif font-bold text-white text-2xl tracking-wide drop-shadow-sm">
              Lieke
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/kalender')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
                onCalendar
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Kalender
            </button>
            <button
              onClick={() => navigate('/tip/nieuw')}
              className="flex items-center gap-1.5 bg-white text-pink-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-pink-50 transition-colors shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              Advies
            </button>
            <button
              onClick={() => navigate('/instellingen')}
              className={`p-2 rounded-full transition-all ${
                onSettings
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title="Instellingen"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  )
}
