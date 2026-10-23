import { createContext, useContext, useEffect, useState } from 'react'
import { setSfx, sfx } from './lib/sfx'

const KEY = 'dungeon-of-data-settings-v1'
const DEFAULTS = { theme: 'dark', text: 'normal', sound: true, volume: 0.35, lang: 'en', remind: false }

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY))
    if (d && typeof d === 'object') {
      return {
        theme: ['dark', 'light', 'system'].includes(d.theme) ? d.theme : DEFAULTS.theme,
        text: d.text === 'large' ? 'large' : 'normal',
        sound: d.sound !== false,
        lang: d.lang === 'hi' ? 'hi' : 'en',
        remind: d.remind === true,
        volume: typeof d.volume === 'number' ? Math.min(1, Math.max(0, d.volume)) : DEFAULTS.volume,
      }
    }
  } catch (e) {
    /* start from defaults */
  }
  return DEFAULTS
}

const Ctx = createContext(null)
export const useSettings = () => useContext(Ctx)

// Device-wide preferences (not per profile): theme, text size, sound. Applied as attributes on <html>.
export function SettingsProvider({ children }) {
  const [s, setS] = useState(load)
  const [sys, setSys] = useState(() => (globalThis.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'))

  useEffect(() => {
    if (!globalThis.matchMedia) return
    const m = matchMedia('(prefers-color-scheme: light)')
    const on = (e) => setSys(e.matches ? 'light' : 'dark')
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])

  const theme = s.theme === 'system' ? sys : s.theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.text = s.text
    document.documentElement.lang = s.lang
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f1ea' : '#0d1418')
  }, [theme, s.text, s.lang])
  useEffect(() => {
    setSfx(s.sound, s.volume)
    try {
      localStorage.setItem(KEY, JSON.stringify(s))
    } catch (e) {
      /* ignore */
    }
  }, [s])

  const set = (patch) => setS((x) => ({ ...x, ...patch }))
  const toggleSound = () => {
    if (!s.sound) {
      setSfx(true, s.volume)
      sfx('tap')
    }
    set({ sound: !s.sound })
  }
  return <Ctx.Provider value={{ ...s, set, toggleSound, resolvedTheme: theme }}>{children}</Ctx.Provider>
}
