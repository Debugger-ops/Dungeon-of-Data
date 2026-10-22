import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useProgress } from './progress'
import { useAccount } from './accounts'
import { cloudEnabled, getClient } from './lib/client'
import { deleteCloud, pullSave, pushAll, setPublic as setPublicRemote } from './lib/sync'
import { describeState, mergeStates } from './lib/merge'

const LINKS = 'dungeon-of-data-cloud-links-v1'
const readLinks = () => {
  try {
    return JSON.parse(localStorage.getItem(LINKS)) || {}
  } catch (e) {
    return {}
  }
}
const writeLinks = (l) => {
  try {
    localStorage.setItem(LINKS, JSON.stringify(l))
  } catch (e) {
    /* ignore */
  }
}

const Ctx = createContext(null)
export const useCloud = () => useContext(Ctx)

const friendly = (e) => {
  const m = String((e && e.message) || e)
  if (/failed to fetch|network|load failed/i.test(m)) return 'You appear to be offline. Progress is safe on this device and will sync when you are back.'
  if (/invalid login/i.test(m)) return 'Wrong email or password.'
  if (/already registered|already been registered/i.test(m)) return 'That email already has an account. Sign in instead.'
  if (/password/i.test(m) && /6|8|short|weak/i.test(m)) return 'Choose a longer password (at least 8 characters).'
  if (/email.*confirm|not confirmed/i.test(m)) return 'Confirm your email first. Check your inbox for the link.'
  if (/relation .* does not exist|schema cache/i.test(m)) return 'The database tables are missing. Run supabase/schema.sql in your Supabase project.'
  return m
}

export function CloudProvider({ children }) {
  const { S, adopt } = useProgress()
  const { profile } = useAccount()
  const [client, setClient] = useState(null)
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!cloudEnabled)
  const [links, setLinks] = useState(readLinks)
  const [status, setStatus] = useState({ s: 'idle', msg: '', at: null })
  const Sref = useRef(S)
  Sref.current = S
  const lastPushed = useRef('')
  const busy = useRef(false)

  const link = links[profile.id]
  const linked = !!(user && link && link.uid === user.id)
  const isPublic = link ? link.public !== false : true

  useEffect(() => {
    if (!cloudEnabled) return undefined
    let sub
    let dead = false
    getClient().then(async (c) => {
      if (dead) return
      setClient(c)
      const { data } = await c.auth.getSession()
      if (dead) return
      setUser((data.session && data.session.user) || null)
      setReady(true)
      sub = c.auth.onAuthStateChange((_e, session) => setUser((session && session.user) || null)).data.subscription
    }).catch(() => setReady(true))
    return () => {
      dead = true
      if (sub) sub.unsubscribe()
    }
  }, [])

  const saveLinks = (next) => {
    setLinks(next)
    writeLinks(next)
  }

  // Merge the cloud save into this device, then publish the result. Safe to run any number of times.
  const sync = useCallback(async () => {
    if (!client || !user || busy.current) return { ok: false }
    busy.current = true
    setStatus((p) => ({ ...p, s: 'syncing', msg: '' }))
    try {
      const remote = await pullSave(client, user.id)
      const local = Sref.current
      const merged = remote ? mergeStates(local, remote) : local
      const changed = JSON.stringify(merged) !== JSON.stringify(local)
      if (changed) adopt(merged)
      const key = JSON.stringify(merged)
      await pushAll(client, user.id, profile, merged, isPublic)
      lastPushed.current = key + profile.name + profile.color
      setStatus({ s: 'synced', msg: changed ? `Merged with the cloud save: ${describeState(merged)}.` : 'Everything is up to date.', at: Date.now() })
      return { ok: true, changed }
    } catch (e) {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false
      setStatus({ s: offline ? 'offline' : 'error', msg: friendly(e), at: null })
      return { ok: false, error: friendly(e) }
    } finally {
      busy.current = false
    }
  }, [client, user, profile, isPublic, adopt])

  // Auto-sync a linked profile shortly after it changes, and when the connection comes back.
  useEffect(() => {
    if (!linked) return undefined
    if (JSON.stringify(S) + profile.name + profile.color === lastPushed.current) return undefined
    const t = setTimeout(() => sync(), lastPushed.current ? 2500 : 200)
    return () => clearTimeout(t)
  }, [S, linked, profile.name, profile.color, sync])
  useEffect(() => {
    if (!linked) return undefined
    const on = () => sync()
    window.addEventListener('online', on)
    return () => window.removeEventListener('online', on)
  }, [linked, sync])

  const auth = async (fn) => {
    try {
      const r = await fn(client)
      if (r.error) return { ok: false, error: friendly(r.error) }
      return { ok: true, data: r.data }
    } catch (e) {
      return { ok: false, error: friendly(e) }
    }
  }

  const api = {
    enabled: cloudEnabled,
    ready,
    user,
    linked,
    isPublic,
    status,
    sync,
    signUp: (email, password) =>
      auth((c) => c.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } })).then((r) =>
        r.ok && r.data && !r.data.session ? { ok: true, confirm: true } : r
      ),
    signIn: (email, password) => auth((c) => c.auth.signInWithPassword({ email, password })),
    signInGoogle: () => auth((c) => c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } })),
    resetPassword: (email) => auth((c) => c.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })),
    async signOut() {
      if (client) await client.auth.signOut()
      setUser(null)
    },
    async linkProfile() {
      if (!user) return { ok: false, error: 'Sign in first.' }
      saveLinks({ ...links, [profile.id]: { uid: user.id, public: true } })
      return { ok: true }
    },
    unlinkProfile() {
      const { [profile.id]: _gone, ...rest } = links
      saveLinks(rest)
    },
    async setPublic(v) {
      saveLinks({ ...links, [profile.id]: { ...(link || {}), uid: user.id, public: v } })
      try {
        await setPublicRemote(client, user.id, v)
        return { ok: true }
      } catch (e) {
        return { ok: false, error: friendly(e) }
      }
    },
    async deleteCloudData() {
      try {
        await deleteCloud(client, user.id)
        const { [profile.id]: _gone, ...rest } = links
        saveLinks(rest)
        lastPushed.current = ''
        return { ok: true }
      } catch (e) {
        return { ok: false, error: friendly(e) }
      }
    },
    client,
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
