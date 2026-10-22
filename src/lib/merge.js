// Merging two saves of the same player (this device and the cloud). Progress only ever grows, so every field takes
// the larger or earlier value. That makes merging safe to repeat and order-independent.
import { normalize } from '../progress'

const max = (a, b) => Math.max(a || 0, b || 0)

export function mergeStates(a, b) {
  const x = normalize(a)
  const y = normalize(b)
  if (!x) return y
  if (!y) return x
  const lead = y.xp > x.xp ? y : x // history and difficulty follow whichever save has more progress

  const rooms = {}
  Object.keys({ ...x.rooms, ...y.rooms }).forEach((id) => {
    const p = x.rooms[id] || {}
    const q = y.rooms[id] || {}
    rooms[id] = { stars: max(p.stars, q.stars), tries: max(p.tries, q.tries), wins: max(p.wins, q.wins), ok: max(p.ok, q.ok), bad: max(p.bad, q.bad) }
  })

  const ach = { ...y.ach }
  Object.entries(x.ach).forEach(([k, d]) => {
    ach[k] = ach[k] && ach[k] < d ? ach[k] : d
  })

  const activity = {}
  new Set([...Object.keys(x.activity), ...Object.keys(y.activity)]).forEach((day) => {
    const p = x.activity[day] || {}
    const q = y.activity[day] || {}
    activity[day] = { n: max(p.n, q.n), xp: max(p.xp, q.xp) }
  })

  const cstars = { ...x.campaign.stars }
  Object.entries(y.campaign.stars).forEach(([k, v]) => {
    cstars[k] = Math.max(cstars[k] || 0, v)
  })

  const sx = x.streak
  const sy = y.streak
  const newer = sx.last === sy.last ? (sx.count >= sy.count ? sx : sy) : sx.last > sy.last ? sx : sy
  const streak = { count: newer.count, last: newer.last, best: Math.max(sx.best, sy.best, newer.count) }

  let daily = x.daily.date === y.daily.date ? (x.daily.done || !y.daily.done ? x.daily : y.daily) : x.daily.date > y.daily.date ? x.daily : y.daily
  if (x.daily.date === y.daily.date && x.daily.done && y.daily.done && y.daily.stars > x.daily.stars) daily = y.daily

  return {
    ...lead,
    xp: max(x.xp, y.xp),
    rooms,
    ach,
    activity,
    streak,
    daily,
    best: { ...lead.best, wpm: max(x.best.wpm, y.best.wpm) },
    campaign: { stars: cstars },
    quiz: { taken: max(x.quiz.taken, y.quiz.taken), correct: max(x.quiz.correct, y.quiz.correct), perfect: max(x.quiz.perfect, y.quiz.perfect) },
  }
}

// A short, human description of a save for the "what changed" message.
export const describeState = (s) => {
  const n = normalize(s)
  if (!n) return 'no data'
  const wins = Object.values(n.rooms).reduce((t, r) => t + r.wins, 0)
  return `${n.xp} XP, ${wins} wins, ${Object.keys(n.ach).length} achievements`
}
