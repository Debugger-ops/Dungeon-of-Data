// Talking to Supabase. Every function takes the client as its first argument so it can be tested with a fake.
import { liveStreak } from '../progress'
import { ROOMS } from './rooms'
import { dayKey } from './util'

export const BOARDS = {
  xp: { label: 'All-time XP', col: 'xp', unit: 'XP' },
  streak: { label: 'Best streak', col: 'best_streak', unit: 'days' },
  wpm: { label: 'Typing speed', col: 'best_wpm', unit: 'WPM' },
  daily: { label: "Today's daily", col: 'stars', unit: 'stars' },
}

// What the public leaderboard sees. Nothing else from the save is published.
export const boardRow = (uid, profile, S, isPublic = true) => ({
  user_id: uid,
  name: String(profile.name).slice(0, 20),
  color: /^#[0-9a-fA-F]{6}$/.test(profile.color) ? profile.color : '#f2b24d',
  xp: Math.min(1000000, Math.max(0, Math.round(S.xp))),
  streak: liveStreak(S),
  best_streak: S.streak.best,
  stars: ROOMS.reduce((t, r) => t + S.rooms[r.id].stars, 0),
  wins: ROOMS.reduce((t, r) => t + S.rooms[r.id].wins, 0),
  best_wpm: Math.min(300, Math.max(0, Math.round(S.best.wpm))),
  public: !!isPublic,
  updated_at: new Date().toISOString(),
})

export const dailyRow = (uid, profile, S, isPublic = true) =>
  S.daily.done && S.daily.date === dayKey()
    ? { day: S.daily.date, user_id: uid, name: String(profile.name).slice(0, 20), color: boardRow(uid, profile, S).color, room: S.daily.room || '', stars: Math.min(3, S.daily.stars || 0), public: !!isPublic }
    : null

const fail = (error) => {
  throw new Error(error.message || String(error))
}

export async function pullSave(client, uid) {
  const { data, error } = await client.from('saves').select('data').eq('user_id', uid).maybeSingle()
  if (error) fail(error)
  return data ? data.data : null
}

export async function pushAll(client, uid, profile, S, isPublic = true) {
  let r = await client.from('saves').upsert({ user_id: uid, data: S, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (r.error) fail(r.error)
  r = await client.from('leaderboard').upsert(boardRow(uid, profile, S, isPublic), { onConflict: 'user_id' })
  if (r.error) fail(r.error)
  const d = dailyRow(uid, profile, S, isPublic)
  if (d) {
    r = await client.from('daily_scores').upsert(d, { onConflict: 'day,user_id' })
    if (r.error) fail(r.error)
  }
}

export async function fetchBoard(client, kind, day = dayKey(), limit = 50) {
  const b = BOARDS[kind]
  let q
  if (kind === 'daily') {
    q = client.from('daily_scores').select('user_id,name,color,room,stars').eq('day', day).eq('public', true).order('stars', { ascending: false }).limit(limit)
  } else {
    q = client.from('leaderboard').select('user_id,name,color,xp,streak,best_streak,stars,wins,best_wpm').eq('public', true)
    if (kind === 'wpm') q = q.gt('best_wpm', 0)
    q = q.order(b.col, { ascending: false }).order('updated_at', { ascending: true }).limit(limit)
  }
  const { data, error } = await q
  if (error) fail(error)
  return (data || []).map((r, i) => ({ ...r, rank: i + 1, value: r[b.col] }))
}

export async function deleteCloud(client, uid) {
  for (const t of ['daily_scores', 'leaderboard', 'saves']) {
    const { error } = await client.from(t).delete().eq('user_id', uid)
    if (error) fail(error)
  }
}

export async function setPublic(client, uid, isPublic) {
  for (const t of ['leaderboard', 'daily_scores']) {
    const { error } = await client.from(t).update({ public: !!isPublic }).eq('user_id', uid)
    if (error) fail(error)
  }
}
