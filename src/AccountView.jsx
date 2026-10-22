import { useState } from 'react'
import { Avatar, ColorPick, summary, useAccount } from './accounts'
import { liveStreak, useProgress } from './progress'
import { ACHIEVEMENTS } from './lib/achievements'
import CloudCard from './CloudCard'

export default function AccountView() {
  const A = useAccount()
  const { S, go } = useProgress()
  const p = A.profile
  const sum = summary(p.id)
  const [name, setName] = useState(p.name)
  const [color, setColor] = useState(p.color)
  const [profMsg, setProfMsg] = useState(null)
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [pinMsg, setPinMsg] = useState(null)
  const [confirm, setConfirm] = useState('')
  const [delPin, setDelPin] = useState('')
  const [delMsg, setDelMsg] = useState(null)
  const digits = (set) => (e) => set(e.target.value.replace(/\D/g, ''))

  const save = (e) => {
    e.preventDefault()
    const r = A.update(p.id, name, color)
    setProfMsg(r.ok ? { t: 'Profile saved.', c: 'ok' } : { t: r.error, c: 'bad' })
  }
  const pinAction = async (remove) => {
    const r = await A.changePin(p.id, cur, remove ? '' : next)
    if (r.ok) {
      setPinMsg({ t: remove ? 'PIN removed.' : p.pin ? 'PIN changed.' : 'PIN set. You will be asked for it in new browser sessions.', c: 'ok' })
      setCur('')
      setNext('')
    } else setPinMsg({ t: r.error, c: 'bad' })
  }
  const del = async () => {
    const r = await A.remove(p.id, delPin)
    if (!r.ok) setDelMsg({ t: r.error, c: 'bad' })
  }

  return (
    <>
      <div className="roomhead">
        <div>
          <h2>Account</h2>
          <p className="lede">Manage this profile. Progress is saved per profile in this browser.</p>
        </div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>

      <div className="card">
        <div className="row" style={{ gap: 14 }}>
          <Avatar p={p} size={64} />
          <div style={{ flex: 1, minWidth: 160 }}>
            <h3>{p.name}</h3>
            <div className="statrow" style={{ margin: '6px 0 0' }}>
              <span>Rank <b>{sum.rank}</b></span>
              <span>XP <b>{S.xp}</b></span>
              <span>Streak <b>{liveStreak(S)}</b></span>
              <span>Achievements <b>{Object.keys(S.ach).length}/{ACHIEVEMENTS.length}</b></span>
              <span>Created <b>{new Date(p.created).toLocaleDateString()}</b></span>
            </div>
          </div>
          <button className="btn" onClick={A.signOut}>Switch profile / sign out</button>
        </div>
      </div>

      <div className="grid2">
        <form className="card formcard" onSubmit={save}>
          <h3>Profile</h3>
          <label className="field">Name
            <input className="input" maxLength={20} value={name} onChange={(e) => { setName(e.target.value); setProfMsg(null) }} />
          </label>
          <div className="field">Colour<ColorPick value={color} onChange={(c) => { setColor(c); setProfMsg(null) }} /></div>
          {profMsg && <div className={`msg ${profMsg.c}`}>{profMsg.t}</div>}
          <div><button className="btn primary" disabled={!name.trim() || (name.trim() === p.name && color === p.color)}>Save changes</button></div>
        </form>

        <div className="card formcard">
          <h3>PIN lock</h3>
          <p className="fine">{p.pin ? 'This profile asks for its PIN when a new browser session starts and when you switch to it.' : 'Optional. Locks this profile on a shared computer.'} A PIN is not encryption, the data stays in this browser.</p>
          {p.pin && (
            <label className="field">Current PIN
              <input className="input" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={cur} onChange={digits(setCur)} />
            </label>
          )}
          <label className="field">{p.pin ? 'New PIN' : 'PIN'}
            <input className="input" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={next} onChange={digits(setNext)} placeholder="4 to 8 digits" />
          </label>
          {pinMsg && <div className={`msg ${pinMsg.c}`}>{pinMsg.t}</div>}
          <div className="row">
            <button className="btn primary" disabled={next.length < 4 || (!!p.pin && cur.length < 4)} onClick={() => pinAction(false)}>{p.pin ? 'Change PIN' : 'Set PIN'}</button>
            {p.pin && <button className="btn" disabled={cur.length < 4} onClick={() => pinAction(true)}>Remove PIN</button>}
          </div>
        </div>
      </div>

      <CloudCard />

      <div className="card">
        <h3>Profiles on this browser</h3>
        <div className="pgrid" style={{ marginTop: 10 }}>
          {A.profiles.map((x) => (
            <div key={x.id} className={`pcard static ${x.id === p.id ? 'cur' : ''}`}>
              <Avatar p={x} size={40} />
              <b>{x.name}</b>
              <small>{summary(x.id).rank} · {summary(x.id).xp} XP{x.id === p.id ? ' · signed in' : ''}</small>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={A.signOut}>{A.canAdd ? 'Add or switch profile' : 'Switch profile'}</button>
        </div>
        <p className="fine">Want a backup or to move to another browser? Use Export JSON in the Ledger. It covers the signed-in profile.</p>
      </div>

      <div className="card danger">
        <h3>Delete this profile</h3>
        <p className="fine">Permanently erases {p.name}'s XP, stars, streak, achievements and history from this browser. Export a backup first if you might want it back.</p>
        <label className="field"><span>Type <b>{p.name}</b> to confirm</span>
          <input className="input" value={confirm} onChange={(e) => { setConfirm(e.target.value); setDelMsg(null) }} />
        </label>
        {p.pin && (
          <label className="field">PIN
            <input className="input" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={delPin} onChange={digits(setDelPin)} />
          </label>
        )}
        {delMsg && <div className={`msg ${delMsg.c}`}>{delMsg.t}</div>}
        <div><button className="btn" style={{ background: 'var(--bad)', borderColor: 'var(--bad)', color: '#1d0705', fontWeight: 600 }} disabled={confirm.trim() !== p.name || (!!p.pin && delPin.length < 4)} onClick={del}>Delete profile</button></div>
      </div>
    </>
  )
}
