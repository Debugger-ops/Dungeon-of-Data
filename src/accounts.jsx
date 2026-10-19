import { createContext, useContext, useEffect, useState } from 'react'
import { LEGACY_KEY, ProgressProvider, progressKey } from './progress'
import { RANKS } from './lib/rooms'
import { hashStr } from './lib/util'

const PKEY = 'dungeon-of-data-profiles-v1'
const SESSION = 'dod-unlocked'
export const COLORS = ['#f2b24d', '#6aa9ff', '#62d3a3', '#b595f4', '#f0675c', '#7cc36e']
const MAX_PROFILES = 8

const safeGet = (k, store = 'local') => {
  try {
    return (store === 'local' ? localStorage : sessionStorage).getItem(k)
  } catch (e) {
    return null
  }
}
const safeSet = (k, v, store = 'local') => {
  try {
    const s = store === 'local' ? localStorage : sessionStorage
    if (v === null) s.removeItem(k)
    else s.setItem(k, v)
  } catch (e) {
    /* storage can be unavailable */
  }
}

function loadAcc() {
  try {
    const d = JSON.parse(safeGet(PKEY))
    if (d && Array.isArray(d.profiles)) return d
  } catch (e) {
    /* fall through */
  }
  // Progress saved before accounts existed becomes the first profile (deterministic id, so this is safe to repeat).
  const legacy = safeGet(LEGACY_KEY)
  if (legacy) {
    safeSet(progressKey('p-legacy'), legacy)
    return { active: 'p-legacy', profiles: [{ id: 'p-legacy', name: 'Player 1', color: COLORS[0], created: Date.now() }] }
  }
  return { active: null, profiles: [] }
}

async function hashPin(pin, salt) {
  const text = `${salt}:${pin}`
  try {
    if (globalThis.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
    }
  } catch (e) {
    /* fall back below */
  }
  return String(hashStr(text))
}
const makePin = async (pin) => {
  const salt = Math.random().toString(36).slice(2)
  return { salt, hash: await hashPin(pin, salt) }
}
const checkPin = async (p, pin) => !p.pin || (await hashPin(pin, p.pin.salt)) === p.pin.hash

export const validName = (name, profiles, selfId) => {
  const n = name.trim()
  if (!n) return 'Enter a name.'
  if (n.length > 20) return 'Keep the name to 20 characters or fewer.'
  if (profiles.some((p) => p.id !== selfId && p.name.toLowerCase() === n.toLowerCase())) return 'That name is already used by another profile.'
  return ''
}
export const validPin = (pin) => (/^\d{4,8}$/.test(pin) ? '' : 'A PIN is 4 to 8 digits.')

// Quick stats for a profile card, read straight from its saved progress.
export function summary(id) {
  try {
    const d = JSON.parse(safeGet(progressKey(id)))
    const xp = d && typeof d.xp === 'number' ? d.xp : 0
    let ri = 0
    RANKS.forEach((r, i) => {
      if (xp >= r[0]) ri = i
    })
    return { xp, rank: RANKS[ri][1] }
  } catch (e) {
    return { xp: 0, rank: RANKS[0][1] }
  }
}

const Ctx = createContext(null)
export const useAccount = () => useContext(Ctx)

export function AccountProvider({ children }) {
  const [acc, setAcc] = useState(loadAcc)
  const [unlocked, setUnlocked] = useState(() => safeGet(SESSION, 'session'))

  useEffect(() => {
    safeSet(PKEY, JSON.stringify(acc))
  }, [acc])

  const unlock = (id) => {
    setUnlocked(id)
    safeSet(SESSION, id, 'session')
  }
  const profile = acc.profiles.find((p) => p.id === acc.active) || null
  const needsPin = !!(profile && profile.pin && unlocked !== profile.id)

  const api = {
    profiles: acc.profiles,
    profile,
    needsPin,
    canAdd: acc.profiles.length < MAX_PROFILES,
    async create(name, color, pin) {
      const err = validName(name, acc.profiles) || (pin ? validPin(pin) : '')
      if (err) return { ok: false, error: err }
      if (acc.profiles.length >= MAX_PROFILES) return { ok: false, error: `You can keep up to ${MAX_PROFILES} profiles.` }
      const id = `p-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
      const p = { id, name: name.trim(), color, created: Date.now(), ...(pin ? { pin: await makePin(pin) } : {}) }
      setAcc((a) => ({ active: id, profiles: [...a.profiles, p] }))
      unlock(id)
      return { ok: true }
    },
    async signIn(id, pin) {
      const p = acc.profiles.find((x) => x.id === id)
      if (!p) return { ok: false, error: 'Profile not found.' }
      if (!(await checkPin(p, pin || ''))) return { ok: false, error: 'Wrong PIN.' }
      setAcc((a) => ({ ...a, active: id }))
      unlock(id)
      return { ok: true }
    },
    signOut() {
      setAcc((a) => ({ ...a, active: null }))
      setUnlocked(null)
      safeSet(SESSION, null, 'session')
    },
    update(id, name, color) {
      const err = validName(name, acc.profiles, id)
      if (err) return { ok: false, error: err }
      setAcc((a) => ({ ...a, profiles: a.profiles.map((p) => (p.id === id ? { ...p, name: name.trim(), color } : p)) }))
      return { ok: true }
    },
    // current is required when a PIN already exists; next === '' removes the PIN.
    async changePin(id, current, next) {
      const p = acc.profiles.find((x) => x.id === id)
      if (!p) return { ok: false, error: 'Profile not found.' }
      if (!(await checkPin(p, current || ''))) return { ok: false, error: 'Current PIN is wrong.' }
      if (next) {
        const err = validPin(next)
        if (err) return { ok: false, error: err }
      }
      const pin = next ? await makePin(next) : null
      setAcc((a) => ({ ...a, profiles: a.profiles.map((x) => { if (x.id !== id) return x; const { pin: _old, ...rest } = x; return pin ? { ...rest, pin } : rest }) }))
      if (next) unlock(id)
      return { ok: true }
    },
    async remove(id, pin) {
      const p = acc.profiles.find((x) => x.id === id)
      if (!p) return { ok: false, error: 'Profile not found.' }
      if (!(await checkPin(p, pin || ''))) return { ok: false, error: 'Wrong PIN.' }
      safeSet(progressKey(id), null)
      setAcc((a) => ({ active: a.active === id ? null : a.active, profiles: a.profiles.filter((x) => x.id !== id) }))
      if (unlocked === id) {
        setUnlocked(null)
        safeSet(SESSION, null, 'session')
      }
      return { ok: true }
    },
  }

  return (
    <Ctx.Provider value={api}>
      {profile && !needsPin ? <ProgressProvider key={profile.id} profileId={profile.id}>{children}</ProgressProvider> : <Gate />}
    </Ctx.Provider>
  )
}

export function Avatar({ p, size = 40 }) {
  return (
    <span className="avatar" style={{ background: p.color, width: size, height: size, fontSize: size * 0.46 }} aria-hidden="true">
      {p.name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

export function ColorPick({ value, onChange }) {
  return (
    <div className="swatches" role="radiogroup" aria-label="Profile colour">
      {COLORS.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={c} className={`swatch ${value === c ? 'on' : ''}`} style={{ background: c }} onClick={() => onChange(c)} />
      ))}
    </div>
  )
}

// Full-screen picker shown when nobody is signed in (or the active profile needs its PIN).
function Gate() {
  const A = useAccount()
  const first = A.profiles.length === 0
  const [mode, setMode] = useState(A.needsPin ? 'pin' : first ? 'new' : 'pick')
  const [sel, setSel] = useState(A.needsPin ? A.profile.id : null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const target = A.profiles.find((p) => p.id === sel)

  const choose = async (p) => {
    setErr('')
    setPin('')
    if (p.pin) {
      setSel(p.id)
      setMode('pin')
    } else await A.signIn(p.id, '')
  }
  const submitPin = async (e) => {
    e.preventDefault()
    setBusy(true)
    const r = await A.signIn(sel, pin)
    setBusy(false)
    if (!r.ok) {
      setErr(r.error)
      setPin('')
    }
  }
  const submitNew = async (e) => {
    e.preventDefault()
    if (pin && pin !== pin2) return setErr('The two PINs do not match.')
    setBusy(true)
    const r = await A.create(name, color, pin)
    setBusy(false)
    if (!r.ok) setErr(r.error)
  }

  return (
    <div className="wrap gate">
      <div className="brand" style={{ alignItems: 'center', textAlign: 'center' }}>
        <h1>Dungeon of Data</h1>
        <small>Defend the keep by thinking like an algorithm</small>
      </div>

      {mode === 'pick' && (
        <div className="card gatecard">
          <h2>Who is defending the keep?</h2>
          <div className="pgrid">
            {A.profiles.map((p) => {
              const s = summary(p.id)
              return (
                <button key={p.id} className="pcard" onClick={() => choose(p)}>
                  <Avatar p={p} size={48} />
                  <b>{p.name}</b>
                  <small>{s.rank} · {s.xp} XP{p.pin ? ' · PIN' : ''}</small>
                </button>
              )
            })}
            {A.canAdd && (
              <button className="pcard add" onClick={() => { setMode('new'); setErr(''); setName(''); setPin(''); setPin2('') }}>
                <span className="avatar plus" aria-hidden="true">+</span>
                <b>New profile</b>
                <small>separate progress</small>
              </button>
            )}
          </div>
          <p className="fine">Profiles live in this browser only. Each one keeps its own XP, stars, streak and achievements.</p>
        </div>
      )}

      {mode === 'pin' && target && (
        <form className="card gatecard" onSubmit={submitPin}>
          <div className="row" style={{ gap: 12 }}>
            <Avatar p={target} size={48} />
            <div><h2>{target.name}</h2><p className="lede" style={{ margin: 0 }}>Enter your PIN to continue.</p></div>
          </div>
          <input className="input" type="password" inputMode="numeric" autoComplete="off" maxLength={8} autoFocus value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="PIN" aria-label="PIN" />
          {err && <div className="msg bad">{err}</div>}
          <div className="row">
            <button className="btn primary" disabled={busy || pin.length < 4}>Unlock</button>
            <button type="button" className="btn ghost" onClick={() => { A.signOut(); setMode('pick'); setErr('') }}>Switch profile</button>
          </div>
        </form>
      )}

      {mode === 'new' && (
        <form className="card gatecard" onSubmit={submitNew}>
          <h2>{first ? 'Create your profile' : 'New profile'}</h2>
          <p className="lede" style={{ margin: 0 }}>{first ? 'Pick a name to save your progress. You can add more profiles later for friends or classmates.' : 'Each profile has its own progress.'}</p>
          <label className="field">Name
            <input className="input" autoFocus maxLength={20} value={name} onChange={(e) => { setName(e.target.value); setErr('') }} placeholder="e.g. Bhumika" />
          </label>
          <div className="field">Colour<ColorPick value={color} onChange={setColor} /></div>
          <label className="field">PIN (optional)
            <input className="input" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="4 to 8 digits" />
          </label>
          {pin && (
            <label className="field">Repeat PIN
              <input className="input" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))} />
            </label>
          )}
          <p className="fine">A PIN keeps casual users out of your profile on a shared computer. It is not encryption: the data stays in this browser.</p>
          {err && <div className="msg bad">{err}</div>}
          <div className="row">
            <button className="btn primary" disabled={busy || !name.trim()}>{first ? 'Start playing' : 'Create profile'}</button>
            {!first && <button type="button" className="btn ghost" onClick={() => { setMode('pick'); setErr('') }}>Back</button>}
          </div>
        </form>
      )}
    </div>
  )
}
