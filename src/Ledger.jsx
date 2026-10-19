import { useRef, useState } from 'react'
import { HBars, Legend } from './components/Charts'
import { ACHIEVEMENTS } from './lib/achievements'
import { ROOMS } from './lib/rooms'
import { liveStreak, useProgress } from './progress'
import { useAccount } from './accounts'

export default function Ledger() {
  const { S, go, exportData, importData, resetAll } = useProgress()
  const { profile } = useAccount()
  const fileRef = useRef(null)
  const [note, setNote] = useState('')
  const [armed, setArmed] = useState(false)
  const unlocked = ACHIEVEMENTS.filter((a) => S.ach[a.id]).length

  const doExport = () => {
    const url = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `dungeon-of-data-${profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNote('Progress exported.')
  }
  const doImport = (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    f.text().then((t) => {
      const r = importData(t)
      setNote(r.ok ? 'Progress imported. It replaced what was here.' : r.error)
    })
  }
  const ok = ROOMS.reduce((a, r) => a + S.rooms[r.id].ok, 0)
  const bad = ROOMS.reduce((a, r) => a + S.rooms[r.id].bad, 0)
  const acc = ok + bad ? Math.round((100 * ok) / (ok + bad)) : 0
  const C = 2 * Math.PI * 52
  const da = ok + bad ? ok / (ok + bad) : 0

  const W = 640, H = 200, L = 40, R = 12, Tp = 12, B = 26
  const pw = W - L - R
  const ph = H - Tp - B
  const h = S.hist
  const px = (i) => L + (h.length === 1 ? pw / 2 : (i / (h.length - 1)) * pw)
  const py = (a) => Tp + ph - (a / 100) * ph

  return (
    <>
      <div className="roomhead">
        <div>
          <h2>Ledger</h2>
          <p className="lede">{profile.name}'s record across the dungeon. It saves in this browser only.</p>
        </div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Accuracy by room</h3>
          <div style={{ marginTop: 8 }}>
            <HBars
              groups={ROOMS.map((r) => {
                const x = S.rooms[r.id]
                const t = x.ok + x.bad
                return { name: r.name.split(' ').slice(-1)[0], v: [t ? Math.round((100 * x.ok) / t) : 0] }
              })}
              series={[['Accuracy %', 'var(--ok)']]}
            />
          </div>
        </div>
        <div className="card">
          <h3>Overall accuracy</h3>
          <div style={{ marginTop: 8 }}>
            <svg className="svgbox" viewBox="0 0 240 150" style={{ maxHeight: 180 }} role="img" aria-label="Accuracy donut">
              <circle cx="75" cy="75" r="52" fill="none" stroke="var(--panel2)" strokeWidth="16" />
              <circle cx="75" cy="75" r="52" fill="none" style={{ stroke: 'var(--ok)' }} strokeWidth="16" strokeDasharray={`${C * da} ${C}`} transform="rotate(-90 75 75)" />
              <text x="75" y="80" textAnchor="middle" fill="var(--fg)" fontSize="22" fontWeight="500">{acc}%</text>
              <text x="150" y="60" fill="var(--ok)" fontSize="12">{ok} correct</text>
              <text x="150" y="80" fill="var(--bad)" fontSize="12">{bad} mistakes</text>
              <text x="150" y="100" fill="var(--mut)" fontSize="12">{S.xp} XP total</text>
            </svg>
          </div>
        </div>
      </div>
      <div className="card">
        <h3>Accuracy per attempt (last {Math.min(h.length, 30) || 30})</h3>
        <div style={{ marginTop: 8 }}>
          <svg className="svgbox" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Accuracy history">
            {[0, 50, 100].map((v) => (
              <g key={v}>
                <line x1={L} x2={W - R} y1={py(v)} y2={py(v)} stroke="var(--line)" />
                <text x={L - 6} y={py(v) + 4} fill="var(--mut)" fontSize="11" textAnchor="end">{v}%</text>
              </g>
            ))}
            {!h.length && <text x={W / 2} y={H / 2} fill="var(--mut)" fontSize="13" textAnchor="middle">Clear or lose a room and your attempts plot here.</text>}
            {h.length > 0 && (
              <>
                <polyline points={h.map((p, i) => `${px(i)},${py(p.acc)}`).join(' ')} fill="none" style={{ stroke: 'var(--arc)' }} strokeWidth="2" />
                {h.map((p, i) => (
                  <circle key={i} cx={px(i)} cy={py(p.acc)} r="5" style={{ fill: p.win ? 'var(--ok)' : 'var(--bad)' }} stroke="var(--bg)" strokeWidth="1.5">
                    <title>{`${p.id}: ${p.acc}% ${p.win ? 'win' : 'loss'}`}</title>
                  </circle>
                ))}
              </>
            )}
          </svg>
        </div>
        <Legend items={[['win', 'var(--ok)'], ['loss', 'var(--bad)'], ['x axis: attempts, oldest to newest']]} />
      </div>
      <div className="card">
        <h3>Room records</h3>
        <div className="scroll">
          <table>
            <thead><tr><th>Room</th><th className="num">Attempts</th><th className="num">Wins</th><th className="num">Best stars</th><th className="num">Correct</th><th className="num">Mistakes</th></tr></thead>
            <tbody>
              {ROOMS.map((r) => {
                const x = S.rooms[r.id]
                return (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td className="num">{x.tries}</td>
                    <td className="num">{x.wins}</td>
                    <td className="num">{x.stars}/3</td>
                    <td className="num">{x.ok}</td>
                    <td className="num">{x.bad}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h3>Achievements <span className="mono" style={{ color: 'var(--mut)', fontSize: 13 }}>{unlocked}/{ACHIEVEMENTS.length}</span></h3>
        <div className="ach" style={{ marginTop: 8 }}>
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className={`badge ${S.ach[a.id] ? 'on' : ''}`}>
              <b>{S.ach[a.id] ? '★ ' : '☆ '}{a.name}</b>
              <small>{a.desc}</small>
              {S.ach[a.id] && <small className="when">{S.ach[a.id]}</small>}
            </div>
          ))}
        </div>
        <div className="statrow" style={{ margin: '10px 0 0' }}>
          <span>Daily streak <b>{liveStreak(S)}</b></span>
          <span>Best streak <b>{S.streak.best}</b></span>
          <span>Quizzes <b>{S.quiz.taken}</b></span>
          <span>Quiz answers right <b>{S.quiz.correct}</b></span>
        </div>
      </div>
      <div className="card">
        <h3>Save data</h3>
        <p className="lede" style={{ margin: '4px 0 8px' }}>Progress lives in this browser. Export a JSON backup of this profile to move it to another browser or keep it safe. Importing replaces this profile's progress.</p>
        <div className="row">
          <button className="btn" onClick={doExport}>Export JSON</button>
          <button className="btn" onClick={() => fileRef.current && fileRef.current.click()}>Import JSON</button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={doImport} hidden />
          {!armed ? (
            <button className="btn ghost" onClick={() => setArmed(true)}>Reset progress</button>
          ) : (
            <>
              <button className="btn primary" style={{ background: 'var(--bad)', borderColor: 'var(--bad)' }} onClick={() => { resetAll(); setArmed(false); setNote('Progress reset.') }}>Yes, erase everything</button>
              <button className="btn" onClick={() => setArmed(false)}>Cancel</button>
            </>
          )}
        </div>
        <div className="msg" style={{ marginTop: 8 }}>{note}</div>
      </div>
    </>
  )
}
