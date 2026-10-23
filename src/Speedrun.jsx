import { useEffect, useRef, useState } from 'react'
import { useProgress } from './progress'
import { ROOMS } from './lib/rooms'
import { ROOM_COMPONENTS } from './Daily'

const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`

// Pick a room and race the clock. The timer stops when the result card appears; a win under your best saves a new record.
export default function Speedrun() {
  const { S, go, recordSpeed } = useProgress()
  const [id, setId] = useState(ROOMS[0].id)
  const [run, setRun] = useState(null) // { id, key }
  const [secs, setSecs] = useState(0)
  const [res, setRes] = useState(null)
  const box = useRef(null)
  const t0 = useRef(0)

  useEffect(() => {
    if (!run || res) return
    t0.current = performance.now()
    const tick = setInterval(() => setSecs((performance.now() - t0.current) / 1000), 100)
    const mo = new MutationObserver(() => {
      const card = box.current && box.current.querySelector('[role="dialog"][aria-label="Result"]')
      if (!card) return
      const s = Math.round(((performance.now() - t0.current) / 1000) * 10) / 10
      const win = card.classList.contains('win')
      setSecs(s)
      setRes({ win, secs: s, record: win ? recordSpeed(run.id, s) : false })
      clearInterval(tick)
      mo.disconnect()
    })
    if (box.current) mo.observe(box.current, { childList: true, subtree: true })
    return () => { clearInterval(tick); mo.disconnect() }
  }, [run, res])

  const start = () => { setRes(null); setSecs(0); setRun({ id, key: Math.random() }) }
  const View = run && ROOM_COMPONENTS[run.id]
  const name = (x) => ROOMS.find((r) => r.id === x).name
  return (
    <>
      <div className="roomhead">
        <div><h2>Speedrun</h2><p className="lede">Choose a room and clear it as fast as you can. Only winning rounds count, and hints still cap your stars. Your best time per room is saved.</p></div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      <div className="card">
        <div className="row">
          <label className="field" style={{ margin: 0 }}>Room
            <select className="input" value={id} onChange={(e) => setId(e.target.value)} disabled={!!run && !res}>
              {ROOMS.map((r) => <option key={r.id} value={r.id}>{r.name}{S.best.speed[r.id] ? ` (best ${fmt(S.best.speed[r.id])})` : ''}</option>)}
            </select>
          </label>
          <button className="btn primary" onClick={start}>{run ? 'Restart run' : 'Start the clock'}</button>
          {run && <span className="timer" role="timer" aria-live="off" data-testid="speed-time">{fmt(secs)}</span>}
        </div>
        {res && (
          <div className={`msg ${res.win ? 'ok' : 'bad'}`} style={{ marginTop: 10 }} role="status">
            {res.win ? `Cleared ${name(run.id)} in ${fmt(res.secs)}.${res.record ? ' New personal best!' : ''}` : 'The keep fell, so no time was recorded.'}
          </div>
        )}
      </div>
      {Object.keys(S.best.speed).length > 0 && (
        <div className="card">
          <h3>Personal bests</h3>
          <div className="shelf" style={{ marginTop: 8 }}>{Object.entries(S.best.speed).map(([k, v]) => <span key={k} className="badge on">{ROOMS.find((r) => r.id === k)?.name || k}: {fmt(v)}</span>)}</div>
        </div>
      )}
      {run && <div ref={box} key={run.key}><View /></div>}
    </>
  )
}
