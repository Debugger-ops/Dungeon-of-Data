import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Offline support: production builds only, and not under automated browsers.
if ('serviceWorker' in navigator && import.meta.env.PROD && !navigator.webdriver) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* the app works without it */
    })
  })
}
