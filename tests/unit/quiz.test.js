import { describe, expect, it } from 'vitest'
import { BANK_SIZE, QUIZ_LEN, buildQuiz, roomWeights } from '../../src/lib/quiz'
import { ROOMS } from '../../src/lib/rooms'
import { normalize } from '../../src/progress'

const blank = () => normalize({ xp: 0, rooms: {} })

describe('quiz', () => {
  it('has questions for every room', () => {
    expect(BANK_SIZE).toBeGreaterThanOrEqual(ROOMS.length * 6)
    const rooms = new Set()
    for (let k = 0; k < 300; k++) buildQuiz(blank()).forEach((q) => rooms.add(q.room))
    ROOMS.forEach((r) => expect(rooms.has(r.id)).toBe(true))
  })
  it('builds well-formed quizzes with no repeated question', () => {
    for (let k = 0; k < 100; k++) {
      const quiz = buildQuiz(blank())
      expect(quiz).toHaveLength(QUIZ_LEN)
      expect(new Set(quiz.map((q) => q.q)).size).toBe(QUIZ_LEN)
      quiz.forEach((q) => {
        expect(q.opts).toHaveLength(4)
        expect(new Set(q.opts).size).toBe(4)
        expect(q.answer).toBeGreaterThanOrEqual(0)
        expect(q.answer).toBeLessThan(4)
        expect(q.why.length).toBeGreaterThan(10)
      })
    }
  })
  it('weights weaker rooms more heavily', () => {
    const s = blank()
    s.rooms.sort = { ...s.rooms.sort, ok: 9, bad: 1 }
    s.rooms.maze = { ...s.rooms.maze, ok: 2, bad: 8 }
    const w = Object.fromEntries(roomWeights(s).map((x) => [x.id, x.w]))
    expect(w.maze).toBeGreaterThan(w.sort)
  })
})
