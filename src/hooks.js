import { useContext, useRef, useState } from 'react'
import { DailyFlag, useProgress } from './progress'
import { LevelFlag } from './level'
import { DIFFS } from './lib/rooms'
import { sfx } from './lib/sfx'

// Shared state for one round of any room: goblin lane, status message, end-of-round card.
// Difficulty shifts the lane length (daily challenges always play on Normal).
export function useRound(room, total, baseMax, intro = '') {
  const { award } = useProgress()
  const daily = useContext(DailyFlag)
  const lv = useContext(LevelFlag)
  const { S } = useProgress()
  const max = Math.max(2, baseMax + DIFFS[lv ? lv.level.diff : daily ? 'normal' : S.difficulty].life)
  const [lane, setLane] = useState({ dist: max, killed: 0, hit: 0 })
  const [end, setEnd] = useState(null)
  const [msg, setMsg] = useState({ t: intro, c: '' })
  const hinted = useRef(false)

  const say = (t, c = '') => setMsg({ t, c })
  const laneSet = (dist, killed, fire) => {
    sfx(fire ? 'hit' : 'miss')
    setLane((l) => ({ dist, killed, hit: fire ? l.hit + 1 : l.hit }))
  }
  // Hints never fail a round; they just cap the stars at 2.
  const hint = (text) => {
    hinted.current = true
    setMsg({ t: `Hint: ${text}`, c: 'hint' })
  }
  const finish = (win, stars, text, ok, bad, extra = {}) => {
    const st = win && hinted.current ? Math.min(stars, 2) : stars
    const note = win && hinted.current && stars > 2 ? `${text} (Hint used, so this round is capped at 2 stars.)` : text
    sfx(win ? 'win' : 'lose')
    let gain = award(room, win, st, ok, bad, { daily, diff: lv ? lv.level.diff : undefined, ...extra })
    if (lv && win) gain += lv.record(st)
    setEnd({ win, stars: st, text: note, gain, room, daily })
  }

  return { lane: { total, max, ...lane }, laneSet, msg, say, hint, hinted: hinted.current, end, over: !!end, finish }
}
