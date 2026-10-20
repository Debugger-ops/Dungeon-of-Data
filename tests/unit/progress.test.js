import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS } from '../../src/lib/achievements'
import { DIFFS, ROOMS } from '../../src/lib/rooms'
import { dayKey, hashStr, prevDay, rand, seedRng, unseedRng } from '../../src/lib/util'
import { liveStreak, normalize } from '../../src/progress'
import { validName, validPin } from '../../src/accounts'

describe('normalize (save-data validation)', () => {
  it('rejects things that are not save data', () => {
    expect(normalize(null)).toBeNull()
    expect(normalize({})).toBeNull()
    expect(normalize({ xp: 'a', rooms: {} })).toBeNull()
  })
  it('fills in every room and the newer fields for old saves', () => {
    const s = normalize({ xp: 40, rooms: { sort: { wins: 2 } } })
    expect(Object.keys(s.rooms)).toEqual(ROOMS.map((r) => r.id))
    expect(s.rooms.sort).toMatchObject({ wins: 2, tries: 0, stars: 0 })
    expect(s.difficulty).toBe('normal')
    expect(s.streak).toEqual({ count: 0, best: 0, last: '' })
    expect(s.activity).toEqual({})
  })
  it('falls back to Normal for an unknown difficulty and caps history', () => {
    expect(normalize({ xp: 0, rooms: {}, difficulty: 'nightmare' }).difficulty).toBe('normal')
    expect(normalize({ xp: 0, rooms: {}, hist: Array(50).fill({}) }).hist).toHaveLength(30)
  })
})

describe('streaks and dates', () => {
  it('prevDay handles month and year boundaries', () => {
    expect(prevDay('2026-03-01')).toBe('2026-02-28')
    expect(prevDay('2027-01-01')).toBe('2026-12-31')
    expect(prevDay('2028-03-01')).toBe('2028-02-29')
  })
  it('a streak only counts if it ended today or yesterday', () => {
    const today = dayKey()
    const base = normalize({ xp: 0, rooms: {} })
    expect(liveStreak({ ...base, streak: { count: 5, best: 5, last: today } })).toBe(5)
    expect(liveStreak({ ...base, streak: { count: 5, best: 5, last: prevDay(today) } })).toBe(5)
    expect(liveStreak({ ...base, streak: { count: 5, best: 5, last: prevDay(prevDay(today)) } })).toBe(0)
  })
})

describe('seeded randomness (daily challenge)', () => {
  it('gives the same sequence for the same seed, and restores Math.random', () => {
    seedRng(hashStr('2026-10-19:sort'))
    const a = Array.from({ length: 8 }, () => rand(0, 1000))
    seedRng(hashStr('2026-10-19:sort'))
    const b = Array.from({ length: 8 }, () => rand(0, 1000))
    seedRng(hashStr('2026-10-20:sort'))
    const c = Array.from({ length: 8 }, () => rand(0, 1000))
    unseedRng()
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
  })
})

describe('achievements and difficulty', () => {
  it('have unique ids', () => expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length))
  it('unlock on the right events', () => {
    const s = normalize({ xp: 0, rooms: {} })
    const get = (id) => ACHIEVEMENTS.find((a) => a.id === id)
    expect(get('flawless').test(s, { win: true, bad: 0 })).toBe(true)
    expect(get('flawless').test(s, { win: true, bad: 1 })).toBe(false)
    expect(get('flawless').test(s, { win: false, bad: 0 })).toBe(false)
    expect(get('hard').test(s, { win: true, diff: 'hard' })).toBe(true)
    expect(get('quizwhiz').test(s, { quiz: { correct: 6, total: 6 } })).toBe(true)
    expect(get('quizwhiz').test(s, { quiz: { correct: 5, total: 6 } })).toBe(false)
    expect(get('knight').test({ ...s, xp: 150 }, {})).toBe(true)
  })
  it('hard is harder and pays more than easy', () => {
    expect(DIFFS.hard.life).toBeLessThan(DIFFS.normal.life)
    expect(DIFFS.easy.life).toBeGreaterThan(DIFFS.normal.life)
    expect(DIFFS.hard.xp).toBeGreaterThan(DIFFS.easy.xp)
  })
})

describe('profile validation', () => {
  const profiles = [{ id: 'a', name: 'Asha' }]
  it('validates names', () => {
    expect(validName('', profiles)).not.toBe('')
    expect(validName('x'.repeat(21), profiles)).not.toBe('')
    expect(validName('asha', profiles)).toMatch(/already used/)
    expect(validName('asha', profiles, 'a')).toBe('')
    expect(validName('Ravi', profiles)).toBe('')
  })
  it('validates PINs', () => {
    expect(validPin('1234')).toBe('')
    expect(validPin('12345678')).toBe('')
    expect(validPin('123')).not.toBe('')
    expect(validPin('12a4')).not.toBe('')
    expect(validPin('123456789')).not.toBe('')
  })
})
