import { useEffect } from 'react'
import { DailyFlag, liveStreak, useProgress } from './progress'
import { ROOMS } from './lib/rooms'
import { dayKey, hashStr, seedRng, unseedRng } from './lib/util'
import SortingHall from './rooms/SortingHall'
import BinaryVault from './rooms/BinaryVault'
import TheKeep from './rooms/TheKeep'
import RootCrypt from './rooms/RootCrypt'
import GraphLabyrinth from './rooms/GraphLabyrinth'
import HashForge from './rooms/HashForge'

const COMPONENTS = { sort: SortingHall, bsearch: BinaryVault, keep: TheKeep, crypt: RootCrypt, maze: GraphLabyrinth, hash: HashForge }

export const dailyRoom = (day = dayKey()) => ROOMS[hashStr(day) % ROOMS.length]

// One room per day, same puzzle for everyone (the random source is seeded by the date), always on Normal.
export default function Daily() {
  const { S, go } = useProgress()
  const today = dayKey()
  const room = dailyRoom(today)
  const View = COMPONENTS[room.id]
  const done = S.daily.date === today && S.daily.done
  const streak = liveStreak(S)

  seedRng(hashStr(`${today}:${room.id}`))
  useEffect(() => () => unseedRng(), [])

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2>Daily Challenge</h2>
            <p className="lede">{today}: today's trial is the <b>{room.name}</b>. Win once for a bonus of 25 XP plus 5 XP per streak day (up to 7). Plays on Normal difficulty.</p>
          </div>
          <button className="btn ghost" onClick={() => go('map')}>← Map</button>
        </div>
        <div className="statrow" style={{ marginTop: 10, marginBottom: 0 }}>
          <span>Status <b style={{ color: done ? 'var(--ok)' : 'var(--torch)' }}>{done ? 'cleared' : 'open'}</b></span>
          <span>Streak <b>{streak} day{streak === 1 ? '' : 's'}</b></span>
          <span>Best <b>{S.streak.best}</b></span>
        </div>
      </div>
      <DailyFlag.Provider value={true}>
        <View />
      </DailyFlag.Provider>
    </>
  )
}
