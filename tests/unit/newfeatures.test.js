import { describe, expect, it } from 'vitest'
import { FAMILIES, countPrefix, genWords, insertRun, insertWord, newNode, nodeCount, prefixPuzzle } from '../../src/lib/trie.js'
import { find, findPuzzle, genOps, ufRun } from '../../src/lib/unionfind.js'
import { rangeChoices } from '../../src/lib/opts.js'
import { POOL, addQuiz, addRound, blankQuests, forDay, isDone, questsFor } from '../../src/lib/quests.js'
import { normalize } from '../../src/progress.jsx'
import { mergeStates } from '../../src/lib/merge.js'
import { buildQuiz } from '../../src/lib/quiz.js'
import { RANKS } from '../../src/lib/rooms.js'

const many = (f, n = 200) => Array.from({ length: n }, f)

describe('trie', () => {
  it('counts shared prefixes once', () => {
    const r = newNode()
    expect(insertWord(r, 'car')).toBe(3)
    expect(insertWord(r, 'cat')).toBe(1)
    expect(insertWord(r, 'cart')).toBe(1)
    expect(insertWord(r, 'ca')).toBe(0)
    expect(nodeCount(r)).toBe(5)
  })
  it('insert run totals match the final node count', () => {
    many(() => genWords(6)).forEach((w) => {
      expect(new Set(w).size).toBe(6)
      const run = insertRun(w)
      const t = newNode()
      w.forEach((x) => insertWord(t, x))
      expect(run[run.length - 1].total).toBe(nodeCount(t))
    })
  })
  it('prefix puzzles have at least one match', () => {
    many(() => { const w = genWords(8); return { w, q: prefixPuzzle(w) } }).forEach(({ w, q }) => {
      expect(q.answer).toBeGreaterThanOrEqual(1)
      expect(q.answer).toBe(countPrefix(w, q.prefix))
    })
    expect(FAMILIES.length).toBeGreaterThan(2)
  })
})

describe('union-find', () => {
  it('counts components and finds roots', () => {
    const s = ufRun(5, [[0, 1], [1, 0], [2, 3], [1, 3]])
    expect(s.map((x) => x.comps)).toEqual([4, 4, 3, 2])
    expect(s.map((x) => x.merged)).toEqual([true, false, true, true])
    expect(find(s[3].parent, 0)).toBe(find(s[3].parent, 2))
  })
  it('puzzles are valid', () => {
    many(() => genOps(8, 6), 50).forEach((o) => expect(o).toHaveLength(6))
    many(() => findPuzzle(), 50).forEach((p) => p.queries.forEach((q) => {
      expect(find(p.parent, q.x)).toBe(q.root)
      expect(p.parent[q.root]).toBe(q.root)
    }))
  })
  it('rangeChoices gives four distinct values containing the answer', () => {
    many(() => rangeChoices(1, 1, 8)).forEach((c) => {
      expect(new Set(c).size).toBe(4)
      expect(c).toContain(1)
      c.forEach((x) => expect(x).toBeGreaterThanOrEqual(1))
    })
  })
})

describe('quests', () => {
  it('picks 3 distinct quests per day, the same for a given day', () => {
    const a = questsFor('2026-10-24')
    expect(a).toHaveLength(3)
    expect(new Set(a.map((x) => x.id)).size).toBe(3)
    expect(questsFor('2026-10-24').map((x) => x.id)).toEqual(a.map((x) => x.id))
    expect(new Set(Array.from({ length: 30 }, (_, i) => questsFor(`2026-11-${i + 1}`).map((x) => x.id).join())).size).toBeGreaterThan(5)
  })
  it('tracks rounds and resets on a new day', () => {
    let q = blankQuests('d1')
    q = addRound(q, 'd1', { id: 'sort', win: true, stars: 3, bad: 0, diff: 'hard', gain: 40 })
    q = addRound(q, 'd1', { id: 'sort', win: true, stars: 2, bad: 1, diff: 'normal', gain: 30 })
    q = addQuiz(q, 'd1', 10)
    expect(q).toMatchObject({ wins: 2, threeStar: 1, flawless: 1, hard: 1, quiz: 1, xp: 80 })
    expect(q.rooms).toEqual(['sort'])
    expect(forDay(q, 'd2')).toEqual(blankQuests('d2'))
    expect(POOL.find((p) => p.id === 'wins3')).toBeTruthy()
    expect(isDone(POOL.find((p) => p.id === 'wins3'), q)).toBe(false)
  })
})

describe('save data and quiz', () => {
  it('old saves gain quests, title and since', () => {
    const s = normalize({ xp: 5, rooms: {} })
    expect(s.quests.claimed).toEqual([])
    expect(s.questsDone).toBe(0)
    expect(s.title).toBe('')
    expect(s.since).toMatch(/^\d{4}-\d\d-\d\d$/)
    expect(s.rooms.trie).toBeTruthy()
    expect(s.rooms.union).toBeTruthy()
  })
  it('merge keeps the larger quest count and newer day', () => {
    const a = normalize({ xp: 1, rooms: {}, questsDone: 3, quests: { ...blankQuests('2026-10-20') } })
    const b = normalize({ xp: 1, rooms: {}, questsDone: 5, quests: { ...blankQuests('2026-10-24') } })
    const m = mergeStates(a, b)
    expect(m.questsDone).toBe(5)
    expect(m.quests.date).toBe('2026-10-24')
  })
  it('has ranks in ascending order and quizzes can include new rooms', () => {
    expect(RANKS.map((r) => r[0])).toEqual([...RANKS.map((r) => r[0])].sort((x, y) => x - y))
    const ids = new Set(many(() => buildQuiz(normalize({ xp: 0, rooms: {} })).map((q) => q.room), 100).flat())
    expect(ids.has('trie') || ids.has('union')).toBe(true)
  })
})

import { canReach, qBack, qDone, qInit, qOptions, qPlace, qSolve, qStuck, subsetOk, subsetPuzzle } from '../../src/lib/backtrack.js'
import { heapifyRun, isHeap } from '../../src/lib/heapgame.js'
import { GAPS, dueIds, record } from '../../src/lib/review.js'
import { MAX_FREEZES, SHOP } from '../../src/lib/shop.js'
import { weekKey, dayKey } from '../../src/lib/util.js'
import { liveStreak } from '../../src/progress.jsx'
import { mixedQuiz, qid, questionById } from '../../src/lib/quiz.js'

describe('backtracking', () => {
  it('the reference player always solves 5-queens', () => {
    const { state } = qSolve(5)
    expect(qDone(state)).toBe(true)
    expect(state.cols).toHaveLength(5)
  })
  it('detects dead ends and backtracks to a new option', () => {
    let s = qInit(4)
    s = qPlace(qPlace(s, 0), 2)
    expect(qStuck(s)).toBe(true)
    const b = qBack(s)
    expect(b.cols).toEqual([0])
    expect(qOptions(b)).not.toContain(2)
    expect(qOptions(b)).toContain(3)
  })
  it('subset puzzles are always solvable and decisions stay consistent', () => {
    many(() => subsetPuzzle(6), 100).forEach(({ items, target }) => {
      expect(canReach(items, 0, target)).toBe(true)
      let need = target
      items.forEach((v, i) => {
        const take = subsetOk(items, i, need, true)
        const skip = subsetOk(items, i, need, false)
        expect(take || skip).toBe(true)
        if (take) need -= v
      })
      expect(need).toBe(0)
    })
  })
})

describe('heap hollow', () => {
  it('heapify steps always end in a valid heap', () => {
    many(() => Array.from({ length: 7 }, (_, i) => (i * 37 + 11) % 41 + i), 1).forEach(() => {})
    for (let t = 0; t < 100; t++) {
      const a = Array.from(new Set(Array.from({ length: 12 }, () => Math.floor(Math.random() * 90) + 1))).slice(0, 7)
      for (const mode of ['min', 'max']) {
        const r = heapifyRun(a, mode)
        expect(isHeap(r.result, mode)).toBe(true)
        expect(r.steps.length).toBeGreaterThanOrEqual(Math.floor(a.length / 2))
      }
    }
  })
})

describe('review deck', () => {
  it('misses enter the deck, hits climb boxes, and mastery removes the card', () => {
    let r = record({}, 'q1', true, '2026-10-24')
    expect(r).toEqual({})
    r = record(r, 'q1', false, '2026-10-24')
    expect(r.q1).toEqual({ box: 0, due: '2026-10-25' })
    expect(dueIds(r, '2026-10-24')).toEqual([])
    expect(dueIds(r, '2026-10-25')).toEqual(['q1'])
    for (let i = 0; i < GAPS.length - 1; i++) r = record(r, 'q1', true, '2026-11-01')
    expect(r.q1.box).toBe(GAPS.length - 1)
    r = record(r, 'q1', true, '2026-11-01')
    expect(r.q1).toBeUndefined()
    r = record({ q2: { box: 3, due: 'x' } }, 'q2', false, '2026-10-24')
    expect(r.q2.box).toBe(0)
  })
  it('question ids resolve and interview quizzes are mixed', () => {
    const q = mixedQuiz(10)
    expect(q).toHaveLength(10)
    expect(new Set(q.map((x) => x.id)).size).toBe(10)
    expect(questionById(q[0].id).q).toBe(q[0].q)
    expect(qid('a')).toBe(qid('a'))
  })
})

describe('shop, freezes and weeks', () => {
  it('shop ids are unique and priced', () => {
    expect(new Set(SHOP.map((s) => s.id)).size).toBe(SHOP.length)
    SHOP.forEach((s) => expect(s.cost).toBeGreaterThan(0))
    expect(MAX_FREEZES).toBe(2)
  })
  it('a freeze keeps a streak alive after one missed day', () => {
    const today = dayKey()
    const two = (() => { const [y, m, d] = today.split('-').map(Number); return dayKey(new Date(y, m - 1, d - 2)) })()
    const base = normalize({ xp: 0, rooms: {} })
    expect(liveStreak({ ...base, freezes: 0, streak: { count: 4, best: 4, last: two } })).toBe(0)
    expect(liveStreak({ ...base, freezes: 1, streak: { count: 4, best: 4, last: two } })).toBe(4)
  })
  it('weekKey is always a Monday and stable through the week', () => {
    expect(weekKey(new Date(2026, 9, 24))).toBe('2026-10-19')
    expect(weekKey(new Date(2026, 9, 19))).toBe('2026-10-19')
    expect(weekKey(new Date(2026, 9, 25))).toBe('2026-10-19')
    expect(weekKey(new Date(2026, 9, 26))).toBe('2026-10-26')
  })
  it('old saves start with gold equal to their XP', () => {
    const s = normalize({ xp: 120, rooms: {} })
    expect(s.gold).toBe(120)
    expect(s.freezes).toBe(0)
    expect(s.best.speed).toEqual({})
    expect(s.best.endless).toBe(0)
  })
})
