import { Component, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import TipDetail from './pages/TipDetail'
import AddTip from './pages/AddTip'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import BirthdayNotification from './components/BirthdayNotification'

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

  function dismiss() {
    markBirthdayShown()
    setBirthdayVisible(false)
  }

  return (
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
          </Routes>
        </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
