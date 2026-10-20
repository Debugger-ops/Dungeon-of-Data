import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { DIFFS, ROOMS } from './lib/rooms'
import { ACHIEVEMENTS } from './lib/achievements'
import { dayKey, prevDay } from './lib/util'
import { sfx } from './lib/sfx'

export const LEGACY_KEY = 'dungeon-of-data-react-v1'
// Each local profile keeps its own progress under its own key.
export const progressKey = (id) => `${LEGACY_KEY}:${id}`
const blank = () => ({
  xp: 0,
  rooms: Object.fromEntries(ROOMS.map((r) => [r.id, { stars: 0, tries: 0, wins: 0, ok: 0, bad: 0 }])),
  hist: [],
  difficulty: 'normal',
  streak: { count: 0, best: 0, last: '' },
  daily: { date: '', done: false },
  ach: {},
  quiz: { taken: 0, correct: 0, perfect: 0 },
  activity: {},
})

// Merge saved data over a blank state so older saves gain the newer fields. Returns null if it is not save data.
export function normalize(d) {
  if (!d || typeof d !== 'object' || !d.rooms || typeof d.rooms !== 'object' || typeof d.xp !== 'number') return null
  const b = blank()
  const rooms = { ...b.rooms }
  Object.keys(rooms).forEach((k) => {
    if (d.rooms[k] && typeof d.rooms[k] === 'object') rooms[k] = { ...b.rooms[k], ...d.rooms[k] }
  })
  return {
    ...b,
    ...d,
    rooms,
    hist: Array.isArray(d.hist) ? d.hist.slice(-30) : [],
    difficulty: DIFFS[d.difficulty] ? d.difficulty : 'normal',
    streak: { ...b.streak, ...(d.streak || {}) },
    daily: { ...b.daily, ...(d.daily || {}) },
    ach: d.ach && typeof d.ach === 'object' ? d.ach : {},
    quiz: { ...b.quiz, ...(d.quiz || {}) },
    activity: d.activity && typeof d.activity === 'object' ? d.activity : {},
  }
}

function load(key) {
  try {
    const n = normalize(JSON.parse(localStorage.getItem(key)))
    if (n) return n
  } catch (e) {
    /* storage can be unavailable; start fresh */
  }
  return blank()
}

// Per-day tally of rounds/quizzes played and XP earned, kept for the Analytics charts (last ~200 days).
const bumpAct = (act, day, gain) => {
  const a = { ...act, [day]: { n: ((act[day] && act[day].n) || 0) + 1, xp: ((act[day] && act[day].xp) || 0) + gain } }
  const keys = Object.keys(a).sort()
  keys.slice(0, Math.max(0, keys.length - 200)).forEach((k) => delete a[k])
  return a
}

// The streak only counts if the last cleared day is today or yesterday.
export const liveStreak = (S) => (S.streak.last === dayKey() || S.streak.last === prevDay(dayKey()) ? S.streak.count : 0)

const Ctx = createContext(null)
export const DailyFlag = createContext(false)
export const useProgress = () => useContext(Ctx)

export function ProgressProvider({ children, profileId }) {
  const KEY = progressKey(profileId)
  const ref = useRef(null)
  if (!ref.current) ref.current = load(KEY)
  const [S, setS] = useState(ref.current)
  const [view, setView] = useState('map')
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(S))
    } catch (e) {
      /* ignore */
    }
  }, [S, KEY])

  const toast = (text) => {
    const id = Math.random()
    setToasts((t) => [...t, { id, text }].slice(-4))
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000)
  }

  // Apply a new state, then unlock any achievements it earns. ev describes what just happened.
  const commit = (next, ev, notes = []) => {
    const today = dayKey()
    const ach = { ...next.ach }
    ACHIEVEMENTS.forEach((a) => {
      if (!ach[a.id] && a.test(next, ev)) {
        ach[a.id] = today
        notes.push(`Achievement unlocked: ${a.name}`)
      }
    })
    next = { ...next, ach }
    ref.current = next
    setS(next)
    notes.forEach(toast)
    if (notes.some((n) => n.startsWith('Achievement'))) setTimeout(() => sfx('badge'), 400)
  }

  // Record a finished round. Returns the XP gained so the result card can show it.
  const award = (id, win, stars, ok, bad, opts = {}) => {
    const s = ref.current
    const diff = opts.daily ? 'normal' : s.difficulty
    let gain = win ? Math.round((10 + stars * 15) * DIFFS[diff].xp) : 0
    const today = dayKey()
    const notes = []
    let streak = s.streak
    let daily = s.daily
    if (opts.daily && win && !(s.daily.date === today && s.daily.done)) {
      const count = s.streak.last === today ? s.streak.count : s.streak.last === prevDay(today) ? s.streak.count + 1 : 1
      streak = { count, best: Math.max(s.streak.best, count), last: today }
      const bonus = 25 + Math.min(count, 7) * 5
      gain += bonus
      daily = { date: today, done: true }
      notes.push(`Daily challenge cleared. Day ${count} streak, +${bonus} XP bonus`)
    }
    const r = s.rooms[id]
    commit(
      {
        ...s,
        xp: s.xp + gain,
        streak,
        daily,
        activity: bumpAct(s.activity, today, gain),
        rooms: {
          ...s.rooms,
          [id]: { ...r, tries: r.tries + 1, wins: r.wins + (win ? 1 : 0), ok: r.ok + ok, bad: r.bad + bad, stars: win ? Math.max(r.stars, stars) : r.stars },
        },
        hist: [...s.hist, { id, win, stars, acc: ok + bad ? Math.round((100 * ok) / (ok + bad)) : 0 }].slice(-30),
      },
      { win, bad, diff, daily: !!opts.daily },
      notes
    )
    return gain
  }

  // Record a finished quiz. answers: [{ room, ok }]. Answers count toward each room's accuracy.
  const awardQuiz = (answers) => {
    const s = ref.current
    const correct = answers.filter((a) => a.ok).length
    const total = answers.length
    const gain = correct * 5 + (total && correct === total ? 10 : 0)
    const rooms = { ...s.rooms }
    answers.forEach((a) => {
      const r = rooms[a.room]
      if (r) rooms[a.room] = { ...r, ok: r.ok + (a.ok ? 1 : 0), bad: r.bad + (a.ok ? 0 : 1) }
    })
    commit(
      { ...s, xp: s.xp + gain, rooms, activity: bumpAct(s.activity, dayKey(), gain), quiz: { taken: s.quiz.taken + 1, correct: s.quiz.correct + correct, perfect: s.quiz.perfect + (total && correct === total ? 1 : 0) } },
      { quiz: { correct, total } }
    )
    return gain
  }

  const setDifficulty = (d) => {
    if (DIFFS[d]) commit({ ...ref.current, difficulty: d }, {})
  }
  const exportData = () => JSON.stringify({ app: 'dungeon-of-data', version: 2, saved: new Date().toISOString(), data: ref.current }, null, 2)
  const importData = (text) => {
    try {
      const j = JSON.parse(text)
      const n = normalize(j && j.app === 'dungeon-of-data' ? j.data : j)
      if (!n) return { ok: false, error: 'That file is not Dungeon of Data save data.' }
      commit(n, {})
      return { ok: true }
    } catch (e) {
      return { ok: false, error: 'Could not read that file as JSON.' }
    }
  }
  const resetAll = () => commit(blank(), {})

  return (
    <Ctx.Provider value={{ S, award, awardQuiz, setDifficulty, exportData, importData, resetAll, view, go: setView }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
      </div>
    </Ctx.Provider>
  )
}
