import { useState } from 'react'
import { useCloud } from './cloud'
import { useAccount } from './accounts'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CloudCard() {
  const C = useCloud()
  const { profile } = useAccount()
  const [mode, setMode] = useState('in')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [armed, setArmed] = useState(false)

  if (!C.enabled) {
    return (
      <div className="card formcard">
        <h3>Cloud account</h3>
        <p className="fine">Not set up on this copy. With a free Supabase project you get sign-in, progress synced across devices and the global leaderboard. See the README section "Backend". Local profiles keep working either way.</p>
      </div>
    )
  }
  if (!C.ready) return <div className="card formcard"><h3>Cloud account</h3><p className="fine">Connecting...</p></div>

  const run = async (fn, ok) => {
    setBusy(true)
    setMsg(null)
    const r = await fn()
    setBusy(false)
    if (!r.ok) setMsg({ t: r.error, c: 'bad' })
    else setMsg(ok ? { t: typeof ok === 'function' ? ok(r) : ok, c: 'ok' } : null)
    return r
  }
  const submit = (e) => {
    e.preventDefault()
    if (!EMAIL.test(email)) return setMsg({ t: 'Enter a valid email address.', c: 'bad' })
    if (mode === 'up' && pw.length < 8) return setMsg({ t: 'Use at least 8 characters for the password.', c: 'bad' })
    run(() => (mode === 'up' ? C.signUp(email, pw) : C.signIn(email, pw)), (r) => (r.confirm ? 'Account created. Check your email and click the confirmation link, then sign in.' : '')).then((r) => {
      if (r.ok && !r.confirm) setPw('')
    })
  }

  if (!C.user) {
    return (
      <form className="card formcard" onSubmit={submit} aria-label="Cloud account">
        <h3>Cloud account</h3>
        <p className="fine">Optional. Sign in to sync this profile across devices and appear on the leaderboard. Guests can still play everything.</p>
        <div className="chips" style={{ margin: 0 }} role="group" aria-label="Sign in or create account">
          <button type="button" className={`chip ${mode === 'in' ? 'on' : ''}`} onClick={() => { setMode('in'); setMsg(null) }}>Sign in</button>
          <button type="button" className={`chip ${mode === 'up' ? 'on' : ''}`} onClick={() => { setMode('up'); setMsg(null) }}>Create account</button>
        </div>
        <label className="field">Email
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">Password
          <input className="input" type="password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        {msg && <div className={`msg ${msg.c}`} role="status">{msg.t}</div>}
        <div className="row">
          <button className="btn primary" disabled={busy || !email || !pw}>{mode === 'up' ? 'Create account' : 'Sign in'}</button>
          <button type="button" className="btn" disabled={busy} onClick={() => run(C.signInGoogle)}>Continue with Google</button>
          {mode === 'in' && <button type="button" className="btn ghost" disabled={busy || !EMAIL.test(email)} onClick={() => run(() => C.resetPassword(email), 'Password reset email sent.')}>Forgot password</button>}
        </div>
      </form>
    )
  }

  const st = C.status
  return (
    <div className="card formcard" aria-label="Cloud account">
      <h3>Cloud account</h3>
      <p className="fine">Signed in as <b>{C.user.email}</b>.</p>
      {!C.linked ? (
        <>
          <p className="fine">Link <b>{profile.name}</b> to this account to sync its progress and join the leaderboard. If the account already has a save, the two are merged: you keep the best of both and nothing is lost.</p>
          <div className="row">
            <button className="btn primary" disabled={busy} onClick={() => run(C.linkProfile, 'Linked. Syncing now.')}>Link {profile.name}</button>
            <button className="btn" onClick={C.signOut}>Sign out</button>
          </div>
        </>
      ) : (
        <>
          <div className={`msg ${st.s === 'error' || st.s === 'offline' ? 'bad' : st.s === 'synced' ? 'ok' : ''}`} role="status" data-testid="sync-status">
            {st.s === 'syncing' ? 'Syncing...' : st.s === 'synced' ? `Synced ${st.at ? new Date(st.at).toLocaleTimeString() : ''}. ${st.msg}` : st.s === 'idle' ? 'Linked. Waiting to sync.' : st.msg}
          </div>
          <label className="check">
            <input type="checkbox" checked={C.isPublic} onChange={(e) => run(() => C.setPublic(e.target.checked), e.target.checked ? 'You are visible on the leaderboard.' : 'You are hidden from the leaderboard.')} />
            Show me on the public leaderboard (name, colour, scores)
          </label>
          {msg && <div className={`msg ${msg.c}`} role="status">{msg.t}</div>}
          <div className="row">
            <button className="btn primary" disabled={busy || st.s === 'syncing'} onClick={() => run(C.sync)}>Sync now</button>
            <button className="btn" onClick={C.unlinkProfile}>Unlink this profile</button>
            <button className="btn" onClick={C.signOut}>Sign out</button>
          </div>
          <div className="fine" style={{ marginTop: 6 }}>
            {!armed ? (
              <button className="btn ghost" onClick={() => setArmed(true)}>Delete my cloud data</button>
            ) : (
              <span className="row">
                <span>Removes your cloud save and leaderboard entries. This device keeps its progress.</span>
                <button className="btn" onClick={() => { setArmed(false); run(C.deleteCloudData, 'Cloud data deleted and this profile unlinked.') }}>Yes, delete</button>
                <button className="btn ghost" onClick={() => setArmed(false)}>Cancel</button>
              </span>
            )}
          </div>
        </>
      )}
      {!C.linked && msg && <div className={`msg ${msg.c}`} role="status">{msg.t}</div>}
    </div>
  )
}
