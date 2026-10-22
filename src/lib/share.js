import { ROOMS } from './rooms'

// Text for the Share button on a won round. Keeps to plain characters so it pastes anywhere.
export function shareText({ room, stars, gain, streak = 0, daily = false, url = '' }) {
  const r = ROOMS.find((x) => x.id === room)
  const name = r ? r.name : 'the dungeon'
  const bar = '★'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars))
  const bits = [`Dungeon of Data: ${daily ? 'daily challenge, ' : ''}${name} ${bar}`, `+${gain} XP`]
  if (daily && streak > 0) bits.push(`${streak}-day streak`)
  return `${bits.join(' | ')}\n${url}`.trim()
}

export async function share(text) {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ text })
      return 'shared'
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled'
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch (e) {
    return 'failed'
  }
}
