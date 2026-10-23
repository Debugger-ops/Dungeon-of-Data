import { hashStr } from './util'

// Daily quests: three picked from this pool by date, the same for every player on a given day.
export const POOL = [
  { id: 'wins3', text: 'Win 3 rounds', goal: 3, xp: 20, stat: (q) => q.wins },
  { id: 'wins5', text: 'Win 5 rounds', goal: 5, xp: 35, stat: (q) => q.wins },
  { id: 'rooms3', text: 'Win in 3 different rooms', goal: 3, xp: 25, stat: (q) => q.rooms.length },
  { id: 'star3', text: 'Earn 3 stars in a round', goal: 1, xp: 20, stat: (q) => q.threeStar },
  { id: 'flaw2', text: 'Win 2 flawless rounds', goal: 2, xp: 30, stat: (q) => q.flawless },
  { id: 'quiz', text: 'Finish a quiz', goal: 1, xp: 15, stat: (q) => q.quiz },
  { id: 'xp60', text: 'Earn 60 XP', goal: 60, xp: 25, stat: (q) => q.xp },
  { id: 'hard1', text: 'Win a round on Hard', goal: 1, xp: 30, stat: (q) => q.hard },
]

export const blankQuests = (date = '') => ({ date, wins: 0, rooms: [], threeStar: 0, flawless: 0, quiz: 0, xp: 0, hard: 0, claimed: [] })

export const questsFor = (day) =>
  POOL.map((p) => ({ p, k: hashStr(`${day}:${p.id}`) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 3)
    .map((x) => x.p)

export const progressOf = (quest, q) => Math.min(quest.goal, quest.stat(q))
export const isDone = (quest, q) => quest.stat(q) >= quest.goal

// Counters for the current day; a new day starts from zero.
export const forDay = (q, day) => (q && q.date === day ? q : blankQuests(day))

// Fold one finished round into the day's counters.
export function addRound(q, day, { id, win, stars, bad, diff, gain }) {
  const c = forDay(q, day)
  return {
    ...c,
    xp: c.xp + (gain || 0),
    wins: c.wins + (win ? 1 : 0),
    rooms: win && !c.rooms.includes(id) ? [...c.rooms, id] : c.rooms,
    threeStar: c.threeStar + (win && stars >= 3 ? 1 : 0),
    flawless: c.flawless + (win && bad === 0 ? 1 : 0),
    hard: c.hard + (win && diff === 'hard' ? 1 : 0),
  }
}

export const addQuiz = (q, day, gain) => ({ ...forDay(q, day), quiz: forDay(q, day).quiz + 1, xp: forDay(q, day).xp + gain })
