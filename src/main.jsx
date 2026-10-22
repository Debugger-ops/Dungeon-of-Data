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

// Optional privacy-friendly analytics (GoatCounter: no cookies, no personal data). Production builds only.
const gc = import.meta.env.VITE_GOATCOUNTER
if (gc && import.meta.env.PROD && !navigator.webdriver && navigator.doNotTrack !== '1') {
  const el = document.createElement('script')
  el.async = true
  el.src = 'https://gc.zgo.at/count.js'
  el.dataset.goatcounter = `https://${gc}.goatcounter.com/count`
  document.head.appendChild(el)
}
