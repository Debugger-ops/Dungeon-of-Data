import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { DIFFS, ROOMS } from './lib/rooms'
import { ACHIEVEMENTS } from './lib/achievements'
import { dayKey, prevDay, weekKey } from './lib/util'
import { MAX_FREEZES, shopItem } from './lib/shop'
import { record as recordReview } from './lib/review'
import { sfx } from './lib/sfx'
import { addQuiz, addRound, blankQuests, forDay, isDone, questsFor } from './lib/quests'

export const LEGACY_KEY = 'dungeon-of-data-react-v1'
// Each local profile keeps its own progress under its own key.
export const progressKey = (id) => `${LEGACY_KEY}:${id}`
const blank = () => ({
  xp: 0,
  rooms: Object.fromEntries(ROOMS.map((r) => [r.id, { stars: 0, tries: 0, wins: 0, ok: 0, bad: 0 }])),
  hist: [],
  difficulty: 'normal',
  streak: { count: 0, best: 0, last: '' },
  daily: { date: '', done: false, stars: 0, room: '' },
  best: { wpm: 0, endless: 0, speed: {} },
  campaign: { stars: {} },
  ach: {},
  quiz: { taken: 0, correct: 0, perfect: 0 },
  activity: {},
  quests: blankQuests(),
  questsDone: 0,
  title: '',
  since: '',
  gold: 0,
  freezes: 0,
  owned: [],
  frame: '',
  review: {},
  weekly: { week: '', done: false, stars: 0, room: '' },
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
    best: { ...b.best, ...(d.best || {}), speed: d.best && d.best.speed && typeof d.best.speed === 'object' ? d.best.speed : {} },
    campaign: { stars: d.campaign && d.campaign.stars && typeof d.campaign.stars === 'object' ? d.campaign.stars : {} },
    ach: d.ach && typeof d.ach === 'object' ? d.ach : {},
    quiz: { ...b.quiz, ...(d.quiz || {}) },
    activity: d.activity && typeof d.activity === 'object' ? d.activity : {},
    quests: { ...blankQuests(), ...(d.quests && typeof d.quests === 'object' ? d.quests : {}), rooms: Array.isArray(d.quests && d.quests.rooms) ? d.quests.rooms : [], claimed: Array.isArray(d.quests && d.quests.claimed) ? d.quests.claimed : [] },
    questsDone: typeof d.questsDone === 'number' ? d.questsDone : 0,
    title: typeof d.title === 'string' ? d.title : '',
    gold: typeof d.gold === 'number' ? d.gold : d.xp,
    freezes: Math.min(MAX_FREEZES, Math.max(0, d.freezes | 0)),
    owned: Array.isArray(d.owned) ? d.owned.filter((x) => shopItem(x)) : [],
    frame: typeof d.frame === 'string' ? d.frame : '',
    review: d.review && typeof d.review === 'object' ? d.review : {},
    weekly: { ...b.weekly, ...(d.weekly || {}) },
    since: typeof d.since === 'string' && d.since ? d.since : dayKey(),
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
export const liveStreak = (S) => (S.streak.last === dayKey() || S.streak.last === prevDay(dayKey()) || (S.freezes > 0 && S.streak.last === prevDay(prevDay(dayKey()))) ? S.streak.count : 0)

const Ctx = createContext(null)
export const DailyFlag = createContext(false)
export const WeeklyFlag = createContext(false)
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
  const commit = (next, ev, notes = [], noGold = false) => {
    const today = dayKey()
    if (!noGold && next.xp > ref.current.xp && next.gold === ref.current.gold) next = { ...next, gold: next.gold + (next.xp - ref.current.xp) }
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
    const diff = opts.weekly ? 'hard' : opts.daily ? 'normal' : opts.diff && DIFFS[opts.diff] ? opts.diff : s.difficulty
    let gain = win ? Math.round((10 + stars * 15) * DIFFS[diff].xp) : 0
    const today = dayKey()
    const notes = []
    let streak = s.streak
    let daily = s.daily
    let freezes = s.freezes
    let weekly = s.weekly
    if (opts.daily && win && !(s.daily.date === today && s.daily.done)) {
      let count = s.streak.last === today ? s.streak.count : s.streak.last === prevDay(today) ? s.streak.count + 1 : 1
      if (count === 1 && s.freezes > 0 && s.streak.last === prevDay(prevDay(today)) && s.streak.count > 0) {
        count = s.streak.count + 1
        freezes = s.freezes - 1
        notes.push('Streak freeze used: your streak survived')
      }
      streak = { count, best: Math.max(s.streak.best, count), last: today }
      const bonus = 25 + Math.min(count, 7) * 5
      gain += bonus
      daily = { date: today, done: true, stars, room: id }
      notes.push(`Daily challenge cleared. Day ${count} streak, +${bonus} XP bonus`)
    }
    if (opts.weekly && win && !(s.weekly.week === weekKey() && s.weekly.done)) {
      const bonus = 100 + stars * 20
      gain += bonus
      weekly = { week: weekKey(), done: true, stars, room: id }
      notes.push(`Weekly challenge cleared: +${bonus} XP bonus`)
    }
    const r = s.rooms[id]
    commit(
      {
        ...s,
        xp: s.xp + gain,
        streak,
        daily,
        freezes,
        weekly,
        best: opts.wpm > s.best.wpm ? { ...s.best, wpm: Math.min(300, Math.round(opts.wpm)) } : s.best,
        activity: bumpAct(s.activity, today, gain),
        quests: addRound(s.quests, today, { id, win, stars, bad, diff, gain }),
        rooms: {
          ...s.rooms,
          [id]: { ...r, tries: r.tries + 1, wins: r.wins + (win ? 1 : 0), ok: r.ok + ok, bad: r.bad + bad, stars: win ? Math.max(r.stars, stars) : r.stars },
        },
        hist: [...s.hist, { id, win, stars, acc: ok + bad ? Math.round((100 * ok) / (ok + bad)) : 0 }].slice(-30),
      },
      { win, bad, diff, daily: !!opts.daily, wpm: opts.wpm || 0 },
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
    let review = s.review
    answers.forEach((a) => {
      if (a.id) review = recordReview(review, a.id, a.ok, dayKey())
      const r = rooms[a.room]
      if (r) rooms[a.room] = { ...r, ok: r.ok + (a.ok ? 1 : 0), bad: r.bad + (a.ok ? 0 : 1) }
    })
    commit(
      { ...s, xp: s.xp + gain, rooms, review, activity: bumpAct(s.activity, dayKey(), gain), quests: addQuiz(s.quests, dayKey(), gain), quiz: { taken: s.quiz.taken + 1, correct: s.quiz.correct + correct, perfect: s.quiz.perfect + (total && correct === total ? 1 : 0) } },
      { quiz: { correct, total } }
    )
    return gain
  }

  // A flat XP reward that is not tied to a room (used by Boss Rush).
  const awardBonus = (gain, ev = {}, label = 'Boss Rush bonus') => {
    const s = ref.current
    const best = ev.endless > s.best.endless ? { ...s.best, endless: ev.endless } : s.best
    commit({ ...s, best, xp: s.xp + gain, activity: bumpAct(s.activity, dayKey(), gain) }, ev, [`${label}: +${gain} XP`])
    return gain
  }

  // Record the best star rating for a campaign level. Returns the bonus XP (first clear 25, +10 per new star).
  const recordLevel = (id, stars) => {
    const s = ref.current
    const old = s.campaign.stars[id] || 0
    if (stars <= old) return 0
    const bonus = (old === 0 ? 25 : 0) + 10 * (stars - old)
    commit({ ...s, xp: s.xp + bonus, campaign: { stars: { ...s.campaign.stars, [id]: stars } } }, { level: id }, [old === 0 ? `Level ${id} cleared: +${bonus} XP bonus` : `Level ${id} improved to ${stars} stars: +${bonus} XP`])
    return bonus
  }

  // Claim the reward for a finished daily quest.
  const claimQuest = (qid) => {
    const s = ref.current
    const today = dayKey()
    const q = forDay(s.quests, today)
    const quest = questsFor(today).find((x) => x.id === qid)
    if (!quest || q.claimed.includes(qid) || !isDone(quest, q)) return 0
    commit({ ...s, xp: s.xp + quest.xp, quests: { ...q, claimed: [...q.claimed, qid], xp: q.xp + quest.xp }, questsDone: s.questsDone + 1, activity: bumpAct(s.activity, today, quest.xp) }, { quest: qid }, [`Quest complete: ${quest.text}, +${quest.xp} XP`])
    return quest.xp
  }
  const buy = (id) => {
    const s = ref.current
    const it = shopItem(id)
    if (!it || s.gold < it.cost) return false
    if (it.kind === 'freeze') {
      if (s.freezes >= MAX_FREEZES) return false
      commit({ ...s, gold: s.gold - it.cost, freezes: s.freezes + 1 }, {}, [`Bought: ${it.name}`])
      return true
    }
    if (s.owned.includes(id)) return false
    commit({ ...s, gold: s.gold - it.cost, owned: [...s.owned, id], frame: it.kind === 'frame' ? it.css : s.frame, title: it.kind === 'title' ? it.name : s.title }, {}, [`Bought: ${it.name}`])
    return true
  }
  const setFrame = (f) => commit({ ...ref.current, frame: f }, {})
  const recordSpeed = (room, secs) => {
    const s = ref.current
    const old = s.best.speed[room]
    if (old && old <= secs) return false
    commit({ ...s, best: { ...s.best, speed: { ...s.best.speed, [room]: secs } } }, {})
    return true
  }
  const reviewDone = (items) => {
    const s = ref.current
    let review = s.review
    items.forEach((a) => { review = recordReview(review, a.id, a.ok, dayKey()) })
    const gain = items.filter((a) => a.ok).length * 3
    commit({ ...s, review, xp: s.xp + gain, activity: bumpAct(s.activity, dayKey(), gain) }, {})
    return gain
  }
  const setTitle = (t) => commit({ ...ref.current, title: t }, {})
  const setDifficulty = (d) => {
    if (DIFFS[d]) commit({ ...ref.current, difficulty: d }, {})
  }
  const exportData = () => JSON.stringify({ app: 'dungeon-of-data', version: 2, saved: new Date().toISOString(), data: ref.current }, null, 2)
  const importData = (text) => {
    try {
      const j = JSON.parse(text)
      const n = normalize(j && j.app === 'dungeon-of-data' ? j.data : j)
      if (!n) return { ok: false, error: 'That file is not Dungeon of Data save data.' }
      commit(n, {}, [], true)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: 'Could not read that file as JSON.' }
    }
  }
  const resetAll = () => commit(blank(), {}, [], true)
  // Replace the whole state (used by cloud sync after a merge). Achievements are re-checked.
  const adopt = (state) => {
    const n = normalize(state)
    if (n) commit(n, {}, [], true)
  }

  return (
    <Ctx.Provider value={{ S, buy, setFrame, recordSpeed, reviewDone, claimQuest, setTitle, award, awardQuiz, awardBonus, recordLevel, setDifficulty, exportData, importData, resetAll, adopt, view, go: setView }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
      </div>
    </Ctx.Provider>
  )
}
