import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registreer push service worker als notificaties zijn ingeschakeld
if ('serviceWorker' in navigator && localStorage.getItem('push-enabled') === 'true') {
  navigator.serviceWorker.register('/sw-push.js').catch(() => {})
}
