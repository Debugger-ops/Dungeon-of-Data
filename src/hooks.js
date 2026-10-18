import { useContext, useState } from 'react'
import { DailyFlag, useProgress } from './progress'
import { DIFFS } from './lib/rooms'

// Shared state for one round of any room: goblin lane, status message, end-of-round card.
// Difficulty shifts the lane length (daily challenges always play on Normal).
export function useRound(room, total, baseMax, intro = '') {
  const { award, S } = useProgress()
  const daily = useContext(DailyFlag)
  const max = Math.max(2, baseMax + DIFFS[daily ? 'normal' : S.difficulty].life)
  const [lane, setLane] = useState({ dist: max, killed: 0, hit: 0 })
  const [end, setEnd] = useState(null)
  const [msg, setMsg] = useState({ t: intro, c: '' })

  const say = (t, c = '') => setMsg({ t, c })
  const laneSet = (dist, killed, fire) => setLane((l) => ({ dist, killed, hit: fire ? l.hit + 1 : l.hit }))
  const finish = (win, stars, text, ok, bad) => {
    const gain = award(room, win, stars, ok, bad, { daily })
    setEnd({ win, stars, text, gain })
  }

  return { lane: { total, max, ...lane }, laneSet, msg, say, end, over: !!end, finish }
}
