import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PlusCircle, CalendarDays, Settings, BarChart3, Search, X, Star } from 'lucide-react'
import { useSearch, useFavorites } from '../App'

export default function Layout({ children, onTitleClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { searchQuery, setSearchQuery } = useSearch()
  const { showFavoritesOnly, setShowFavoritesOnly } = useFavorites()
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef(null)
  const onCalendar = location.pathname === '/kalender'
  const onSettings = location.pathname === '/instellingen'
  const onStats = location.pathname === '/statistieken'

  // Focus het invoerveld als zoek opent
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  // Sluit zoek bij pagina-navigatie (behalve homepage)
  useEffect(() => {
    if (location.pathname !== '/') {
      setSearchOpen(false)
      setSearchQuery('')
    }
  }, [location.pathname])

  function handleTitleClick() {
    navigate('/')
    onTitleClick?.()
  }

  function handleSearchToggle() {
    if (searchOpen) {
      setSearchOpen(false)
      setSearchQuery('')
    } else {
      if (location.pathname !== '/') navigate('/')
      setSearchOpen(true)
    }
  }

  function handleFavoritesToggle() {
    if (location.pathname !== '/') navigate('/')
    setShowFavoritesOnly(prev => !prev)
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #fff1f8 0%, #fff7ed 40%, #f0fdf4 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 shadow-lg" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 40%, #f97316 100%)' }}>
        {/* Decoratieve stippen */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1 right-24 w-2 h-2 rounded-full bg-white/20" />
          <div className="absolute top-3 right-32 w-1.5 h-1.5 rounded-full bg-white/15" />
          <div className="absolute bottom-1 left-40 w-2 h-2 rounded-full bg-white/20" />
          <div className="absolute top-2 left-56 w-1 h-1 rounded-full bg-white/25" />
        </div>

        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between relative">
          <button onClick={handleTitleClick} className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:rotate-12 transition-transform duration-200 inline-block">🌟</span>
            <span className="font-serif font-bold text-white text-2xl tracking-wide drop-shadow-sm">
              Lieke
            </span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSearchToggle}
              aria-label="Zoeken"
              className={`p-1.5 rounded-full transition-all ${
                searchOpen
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'bg-white text-pink-600 hover:bg-pink-50 shadow-sm'
              }`}
            >
              {searchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleFavoritesToggle}
              aria-label="Favorieten"
              aria-pressed={showFavoritesOnly}
              className={`p-1.5 rounded-full transition-all ${
                showFavoritesOnly
                  ? 'bg-amber-400 text-white shadow-sm'
                  : 'bg-white text-pink-600 hover:bg-pink-50 shadow-sm'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-white' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/statistieken')}
              aria-label="Statistieken"
              className={`p-1.5 rounded-full transition-all ${
                onStats
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'bg-white text-pink-600 hover:bg-pink-50 shadow-sm'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/kalender')}
              aria-label="Kalender"
              className={`p-1.5 rounded-full transition-all ${
                onCalendar
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'bg-white text-pink-600 hover:bg-pink-50 shadow-sm'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/tip/nieuw')}
              aria-label="Advies toevoegen"
              className="p-1.5 rounded-full bg-white text-pink-600 hover:bg-pink-50 transition-colors shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/instellingen')}
              aria-label="Instellingen"
              className={`p-1.5 rounded-full transition-all ${
                onSettings
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Uitklapbare zoekbalk */}
        {searchOpen && (
          <div className="max-w-5xl mx-auto px-4 pb-3 animate-slide-down">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Zoek in tips..."
                className="w-full pl-9 pr-8 py-2.5 rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-stone-400" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  )
}
