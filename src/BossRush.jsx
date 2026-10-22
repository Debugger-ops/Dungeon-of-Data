import { useState } from 'react'
import { useProgress } from './progress'
import { ROOMS } from './lib/rooms'
import { shuffle } from './lib/util'
import { ROOM_COMPONENTS } from './Daily'
import { RushFlag } from './rush'

const COUNT = 3
const PER_ROOM = 30
const CLEAR_BONUS = 60
export const rushBonus = (cleared) => cleared * PER_ROOM + (cleared === COUNT ? CLEAR_BONUS : 0)

// Three random rooms back to back. Win all three for a bonus; lose one and the run ends with what you cleared so far.
export default function BossRush() {
  const { go, awardBonus } = useProgress()
  const [run, setRun] = useState(null) // { rooms, i, cleared, over }
  const [key, setKey] = useState(0)

  // window.__dodRush (a list of room ids) lets automated tests pick the rooms; players never set it.
  const pick = () => (Array.isArray(window.__dodRush) ? window.__dodRush.map((id) => ROOMS.find((r) => r.id === id)).filter(Boolean) : shuffle(ROOMS).slice(0, COUNT))
  const start = () => setRun({ rooms: pick(), i: 0, cleared: 0, over: false, bonus: 0 })
  const finish = (cleared) => {
    const bonus = rushBonus(cleared)
    if (bonus) awardBonus(bonus, { rush: cleared === COUNT })
    setRun((r) => ({ ...r, cleared, over: true, bonus }))
  }
  const ctx = run && !run.over && {
    index: run.i,
    last: run.i === COUNT - 1,
    next: () => {
      setRun((r) => ({ ...r, i: r.i + 1, cleared: r.cleared + 1 }))
      setKey((k) => k + 1)
    },
    finish: (win) => finish(run.cleared + (win ? 1 : 0)),
  }

  if (!run) {
    return (
      <>
        <div className="roomhead">
          <div>
            <h2>Boss Rush</h2>
            <p className="lede">Three random rooms, back to back, no breaks. Clear one to move to the next. Win all three for a big bonus; fall in any room and the run ends with a smaller reward for what you cleared.</p>
          </div>
          <button className="btn ghost" onClick={() => go('map')}>← Map</button>
        </div>
        <div className="card">
          <div className="statrow"><span>Rooms <b>{COUNT}</b></span><span>Per room cleared <b>+{PER_ROOM} XP</b></span><span>Full clear <b>+{CLEAR_BONUS} XP</b></span></div>
          <p className="fine">Rounds still earn their normal XP and stars on top. Hints work as usual (and cap that round's stars at 2). The current difficulty applies.</p>
          <button className="btn primary" onClick={start}>Start the rush</button>
        </div>
      </>
    )
  }
  if (run.over) {
    return (
      <>
        <div className="roomhead">
          <div><h2>Boss Rush</h2><p className="lede">{run.cleared === COUNT ? 'Flawless sweep. The dungeon is yours.' : `The rush ended after ${run.cleared} of ${COUNT} rooms.`}</p></div>
        </div>
        <div className="card" role="status">
          <h3>{run.cleared === COUNT ? 'Rush cleared' : 'Rush over'}</h3>
          <div className="statrow"><span>Cleared <b data-testid="rush-cleared">{run.cleared}/{COUNT}</b></span><span>Rush bonus <b>+{run.bonus} XP</b></span></div>
          <p className="fine">{run.rooms.map((r, i) => `${i < run.cleared ? '✓' : '✗'} ${r.name}`).join('   ')}</p>
          <div className="row">
            <button className="btn primary" onClick={start}>New rush</button>
            <button className="btn" onClick={() => go('map')}>Back to map</button>
          </div>
        </div>
      </>
    )
  }
  const room = run.rooms[run.i]
  const View = ROOM_COMPONENTS[room.id]
  return (
    <>
      <div className="card">
        <div className="statrow" style={{ margin: 0 }}>
          <span>Boss Rush</span>
          <span>Room <b data-testid="rush-stage">{run.i + 1}/{COUNT}</b></span>
          <span>Now <b>{room.name}</b></span>
          <span>Cleared <b>{run.cleared}</b></span>
        </div>
      </div>
      <RushFlag.Provider value={ctx}>
        <View key={key} />
      </RushFlag.Provider>
    </>
  )
}
