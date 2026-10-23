import { useState } from 'react'
import { useProgress } from './progress'
import { ROOMS } from './lib/rooms'
import { shuffle } from './lib/util'
import { ROOM_COMPONENTS } from './Daily'
import { RushFlag } from './rush'

export const endlessBonus = (cleared) => cleared * 10 + (cleared >= 10 ? 50 : 0)

// Survive as many rooms as you can. Each win sends you to a fresh random room; the first loss ends the run.
export default function Endless() {
  const { S, go, awardBonus } = useProgress()
  const [run, setRun] = useState(null) // { room, cleared, over, bonus, best }
  const [key, setKey] = useState(0)
  const pick = (prev) => shuffle(ROOMS.filter((r) => !prev || r.id !== prev.id))[0]
  const start = () => setRun({ room: pick(), cleared: 0, over: false, bonus: 0, newBest: false })
  const end = (cleared) => {
    const bonus = endlessBonus(cleared)
    const newBest = cleared > S.best.endless
    if (bonus) awardBonus(bonus, { endless: cleared }, 'Endless bonus')
    setRun((r) => ({ ...r, cleared, over: true, bonus, newBest }))
  }
  const head = (txt) => (
    <div className="roomhead">
      <div><h2>Endless Mode</h2><p className="lede">{txt}</p></div>
      <button className="btn ghost" onClick={() => go('map')}>← Map</button>
    </div>
  )
  if (!run) {
    return (
      <>
        {head('Random rooms, one after another, with no break. Every win sends you deeper. The first loss ends the run. Earn 10 XP per room cleared, and a 50 XP bonus at 10 rooms.')}
        <div className="card">
          <div className="statrow"><span>Best run <b data-testid="endless-best">{S.best.endless}</b> rooms</span></div>
          <button className="btn primary" onClick={start}>Start a run</button>
        </div>
      </>
    )
  }
  if (run.over) {
    return (
      <>
        {head(`Your run ended after ${run.cleared} room${run.cleared === 1 ? '' : 's'}.`)}
        <div className="card" role="status">
          <h3>{run.newBest && run.cleared > 0 ? 'New best run!' : 'Run over'}</h3>
          <div className="statrow"><span>Cleared <b>{run.cleared}</b></span><span>Bonus <b>+{run.bonus} XP</b></span><span>Best <b>{Math.max(S.best.endless, run.cleared)}</b></span></div>
          <div className="row"><button className="btn primary" onClick={start}>Run again</button><button className="btn" onClick={() => go('map')}>Back to map</button></div>
        </div>
      </>
    )
  }
  const View = ROOM_COMPONENTS[run.room.id]
  const ctx = {
    index: run.cleared,
    last: false,
    next: () => { setRun((r) => ({ ...r, cleared: r.cleared + 1, room: pick(r.room) })); setKey((k) => k + 1) },
    finish: () => end(run.cleared),
  }
  return (
    <>
      <div className="card">
        <div className="statrow" style={{ margin: 0 }}><span>Endless</span><span>Cleared <b data-testid="endless-cleared">{run.cleared}</b></span><span>Now <b>{run.room.name}</b></span><span>Best <b>{S.best.endless}</b></span></div>
      </div>
      <RushFlag.Provider value={ctx}><View key={key} /></RushFlag.Provider>
    </>
  )
}
