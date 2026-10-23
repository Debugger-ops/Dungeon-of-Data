import { useEffect } from 'react'
import { DailyFlag, WeeklyFlag, useProgress } from './progress'
import { ROOMS } from './lib/rooms'
import { hashStr, seedRng, unseedRng, weekKey } from './lib/util'
import { ROOM_COMPONENTS } from './Daily'

export const weeklyRoom = (wk = weekKey()) => ROOMS[hashStr(`week:${wk}`) % ROOMS.length]

// One harder puzzle a week, the same for everyone, always on Hard. Win it once for 100 XP plus 20 per star.
export default function Weekly() {
  const { S, go } = useProgress()
  const wk = weekKey()
  const room = weeklyRoom(wk)
  const View = ROOM_COMPONENTS[room.id]
  const done = S.weekly.week === wk && S.weekly.done
  seedRng(hashStr(`${wk}:weekly:${room.id}`))
  useEffect(() => () => unseedRng(), [])
  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2>Weekly Challenge</h2>
            <p className="lede">Week of {wk}: this week's trial is the <b>{room.name}</b> on Hard. Win once for 100 XP plus 20 XP per star. The puzzle resets every Monday.</p>
          </div>
          <button className="btn ghost" onClick={() => go('map')}>← Map</button>
        </div>
        <div className="statrow" style={{ marginTop: 10, marginBottom: 0 }}>
          <span>Status <b style={{ color: done ? 'var(--ok)' : 'var(--torch)' }}>{done ? `cleared (${S.weekly.stars} stars)` : 'open'}</b></span>
          <span>Difficulty <b>Hard</b></span>
        </div>
      </div>
      <DailyFlag.Provider value={false}>
        <WeeklyFlag.Provider value={true}>
          <View />
        </WeeklyFlag.Provider>
      </DailyFlag.Provider>
    </>
  )
}
