import { Component, useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import TipDetail from './pages/TipDetail'
import AddTip from './pages/AddTip'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import Stats from './pages/Stats'
import BirthdayNotification from './components/BirthdayNotification'

// Dark mode context
export const DarkModeContext = createContext()
export function useDarkMode() {
  return useContext(DarkModeContext)
}

class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <p className="text-stone-600 mb-4">Er is iets misgegaan.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-sm text-green-700 underline"
          >
            Probeer opnieuw
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function shouldShowBirthday() {
  const now = new Date()
  if (now.getDate() !== 20) return false
  const key = `birthday_${now.getFullYear()}_${now.getMonth()}`
  return !localStorage.getItem(key)
}

function markBirthdayShown() {
  const now = new Date()
  const key = `birthday_${now.getFullYear()}_${now.getMonth()}`
  localStorage.setItem(key, '1')
}

export default function App() {
  const [birthdayVisible, setBirthdayVisible] = useState(() => shouldShowBirthday())
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  function dismiss() {
    markBirthdayShown()
    setBirthdayVisible(false)
  }

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      <BrowserRouter>
        <ErrorBoundary>
          <BirthdayNotification visible={birthdayVisible} onDismiss={dismiss} />
          <Layout onTitleClick={() => { if (shouldShowBirthday()) setBirthdayVisible(true) }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tip/nieuw" element={<AddTip />} />
              <Route path="/tip/:id" element={<TipDetail />} />
              <Route path="/tip/:id/bewerken" element={<AddTip />} />
              <Route path="/kalender" element={<Calendar />} />
              <Route path="/instellingen" element={<Settings />} />
              <Route path="/statistieken" element={<Stats />} />
            </Routes>
          </Layout>
        </ErrorBoundary>
      </BrowserRouter>
    </DarkModeContext.Provider>
  )
}
