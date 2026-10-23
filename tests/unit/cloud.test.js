import { describe, expect, it } from 'vitest'
import { normalize } from '../../src/progress.jsx'
import { ACHIEVEMENTS } from '../../src/lib/achievements.js'
import { mergeStates } from '../../src/lib/merge.js'
import { BOARDS, boardRow, dailyRow, deleteCloud, fetchBoard, pullSave, pushAll, setPublic } from '../../src/lib/sync.js'
import { shareText } from '../../src/lib/share.js'
import { dayKey, prevDay } from '../../src/lib/util.js'
import { fakeClient } from './fakeSupabase.js'

const mk = (patch = {}) => normalize({ xp: 0, rooms: {}, ...patch })
const withRoom = (s, id, v) => ({ ...s, rooms: { ...s.rooms, [id]: { ...s.rooms[id], ...v } } })

describe('mergeStates', () => {
  const a = withRoom(mk({ xp: 120, streak: { count: 2, best: 4, last: dayKey() }, ach: { first: '2026-10-01' }, activity: { '2026-10-01': { n: 2, xp: 40 } }, best: { wpm: 30 } }), 'sort', { stars: 2, wins: 3, tries: 4 })
  const b = withRoom(mk({ xp: 90, streak: { count: 5, best: 5, last: prevDay(dayKey()) }, ach: { first: '2026-09-20', flawless: '2026-10-02' }, activity: { '2026-10-01': { n: 1, xp: 60 } }, best: { wpm: 55 } }), 'sort', { stars: 3, wins: 1, tries: 6 })

  it('keeps the best of both saves', () => {
    const m = mergeStates(a, b)
    expect(m.xp).toBe(120)
    expect(m.rooms.sort).toMatchObject({ stars: 3, wins: 3, tries: 6 })
    expect(m.best.wpm).toBe(55)
    expect(m.activity['2026-10-01']).toEqual({ n: 2, xp: 60 })
    expect(m.ach).toEqual({ first: '2026-09-20', flawless: '2026-10-02' })
  })
  it('takes the more recent streak and the larger best', () => {
    const m = mergeStates(a, b)
    expect(m.streak.last).toBe(dayKey())
    expect(m.streak.count).toBe(2)
    expect(m.streak.best).toBe(5)
  })
  it('is order independent and repeatable', () => {
    expect(mergeStates(a, b)).toEqual(mergeStates(b, a))
    const m = mergeStates(a, b)
    expect(mergeStates(m, a)).toEqual(m)
    expect(mergeStates(m, m)).toEqual(m)
  })
  it('never loses progress', () => {
    const m = mergeStates(a, b)
    expect(m.xp).toBeGreaterThanOrEqual(Math.max(a.xp, b.xp))
    Object.keys(a.rooms).forEach((id) => expect(m.rooms[id].stars).toBeGreaterThanOrEqual(Math.max(a.rooms[id].stars, b.rooms[id].stars)))
  })
  it('handles junk and empty input', () => {
    expect(mergeStates(a, null)).toEqual(a)
    expect(mergeStates(null, b)).toEqual(b)
    expect(mergeStates(null, null)).toBeNull()
  })
})

describe('state additions', () => {
  it('older saves gain the new fields', () => {
    const s = normalize({ xp: 5, rooms: {} })
    expect(s.best).toEqual({ wpm: 0, endless: 0, speed: {} })
    expect(s.daily).toMatchObject({ stars: 0, room: '' })
  })
  it('Speed Scribe unlocks at 40 WPM', () => {
    const t = ACHIEVEMENTS.find((x) => x.id === 'wpm40').test
    expect(t(mk({ best: { wpm: 39 } }), {})).toBe(false)
    expect(t(mk({ best: { wpm: 40 } }), {})).toBe(true)
  })
})

describe('sync with a fake Supabase', () => {
  const profile = { name: 'Asha', color: '#6aa9ff' }
  const played = mk({ xp: 200, best: { wpm: 61 }, streak: { count: 3, best: 3, last: dayKey() }, daily: { date: dayKey(), done: true, stars: 3, room: 'type' } })

  it('publishes only the safe columns and clamps values', () => {
    const r = boardRow('u1', { name: 'x'.repeat(40), color: 'javascript:1' }, mk({ xp: 5e9, best: { wpm: 9999 } }))
    expect(r.name).toHaveLength(20)
    expect(r.color).toBe('#f2b24d')
    expect(r.xp).toBe(1000000)
    expect(r.best_wpm).toBe(300)
    expect(Object.keys(r).sort()).toEqual(['best_streak', 'best_wpm', 'color', 'name', 'public', 'stars', 'streak', 'updated_at', 'user_id', 'wins', 'xp'])
  })
  it('daily row exists only for a cleared daily today', () => {
    expect(dailyRow('u', profile, played)).toMatchObject({ day: dayKey(), stars: 3, room: 'type' })
    expect(dailyRow('u', profile, mk())).toBeNull()
    expect(dailyRow('u', profile, mk({ daily: { date: prevDay(dayKey()), done: true, stars: 3 } }))).toBeNull()
  })
  it('round-trips a save and builds the boards', async () => {
    const c = fakeClient()
    await pushAll(c, 'u1', profile, played)
    await pushAll(c, 'u2', { name: 'Ben', color: '#62d3a3' }, mk({ xp: 500, best: { wpm: 20 } }))
    expect(await pullSave(c, 'u1')).toEqual(played)
    expect(await pullSave(c, 'nobody')).toBeNull()
    const xp = await fetchBoard(c, 'xp')
    expect(xp.map((r) => [r.name, r.rank, r.value])).toEqual([['Ben', 1, 500], ['Asha', 2, 200]])
    const wpm = await fetchBoard(c, 'wpm')
    expect(wpm[0]).toMatchObject({ name: 'Asha', value: 61 })
    const daily = await fetchBoard(c, 'daily')
    expect(daily).toHaveLength(1)
    expect(daily[0]).toMatchObject({ name: 'Asha', value: 3 })
    expect(Object.keys(BOARDS)).toEqual(['xp', 'streak', 'wpm', 'daily'])
  })
  it('upserts instead of duplicating', async () => {
    const c = fakeClient()
    await pushAll(c, 'u1', profile, played)
    await pushAll(c, 'u1', profile, { ...played, xp: 250 })
    expect(c.db.leaderboard).toHaveLength(1)
    expect(c.db.leaderboard[0].xp).toBe(250)
  })
  it('hiding removes you from boards, and delete wipes everything', async () => {
    const c = fakeClient()
    await pushAll(c, 'u1', profile, played)
    await setPublic(c, 'u1', false)
    expect(await fetchBoard(c, 'xp')).toHaveLength(0)
    expect(await fetchBoard(c, 'daily')).toHaveLength(0)
    await setPublic(c, 'u1', true)
    expect(await fetchBoard(c, 'xp')).toHaveLength(1)
    await deleteCloud(c, 'u1')
    expect(c.db.saves.length + c.db.leaderboard.length + c.db.daily_scores.length).toBe(0)
  })
  it('surfaces database errors', async () => {
    const bad = { from: () => ({ upsert: () => Promise.resolve({ error: { message: 'boom' } }) }) }
    await expect(pushAll(bad, 'u', profile, played)).rejects.toThrow('boom')
  })
})

describe('shareText', () => {
  it('formats a win', () => {
    expect(shareText({ room: 'type', stars: 2, gain: 55, url: 'https://x.dev/' })).toBe('Dungeon of Data: Scribe Tower ★★☆ | +55 XP\nhttps://x.dev/')
  })
  it('adds the daily streak', () => {
    expect(shareText({ room: 'dp', stars: 3, gain: 120, streak: 4, daily: true, url: '' })).toContain('daily challenge, DP Dungeon')
    expect(shareText({ room: 'dp', stars: 3, gain: 120, streak: 4, daily: true, url: '' })).toContain('4-day streak')
  })
})
