import { useEffect, useState } from 'react'
import { useProgress } from './progress'
import { ROOMS } from './lib/rooms'
import { hashStr, seedRng, unseedRng } from './lib/util'
import { ROOM_COMPONENTS } from './Daily'
import { share } from './lib/share'

const WORDS = ['torch', 'goblin', 'rune', 'keep', 'moat', 'siege', 'ember', 'vault', 'crypt', 'shield']
export const parseChallenge = (search) => {
  const c = new URLSearchParams(search).get('c')
  if (!c) return null
  const [room, ...rest] = c.split(':')
  const seed = rest.join(':')
  return ROOMS.some((r) => r.id === room) && seed ? { room, seed } : null
}
export const challengeLink = (room, seed) => `${location.origin}${location.pathname}?c=${encodeURIComponent(`${room}:${seed}`)}`
// Set once from the page address so a shared link opens straight into the challenge.
export const incoming = typeof location === 'undefined' ? null : parseChallenge(location.search)

// Friend challenge: the same room and seed give the same puzzle, so you can send a link and compare stars.
export default function Challenge() {
  const { go } = useProgress()
  const [room, setRoom] = useState(incoming ? incoming.room : ROOMS[0].id)
  const [seed, setSeed] = useState(incoming ? incoming.seed : WORDS[Math.floor(Math.random() * WORDS.length)] + Math.floor(Math.random() * 90 + 10))
  const [active, setActive] = useState(incoming ? { room, seed } : null)
  const [note, setNote] = useState('')
  const View = active && ROOM_COMPONENTS[active.room]
  if (active) seedRng(hashStr(`challenge:${active.room}:${active.seed}`))
  useEffect(() => () => unseedRng(), [])
  const send = async () => {
    const name = ROOMS.find((r) => r.id === room).name
    const r = await share(`I challenge you: ${name}, puzzle "${seed}". Same puzzle for both of us. Beat my stars!\n${challengeLink(room, seed)}`)
    setNote(r === 'copied' ? 'Link copied. Send it to a friend.' : r === 'shared' ? 'Shared' : r === 'failed' ? 'Could not copy' : '')
  }
  return (
    <>
      <div className="roomhead">
        <div><h2>Friend Challenge</h2><p className="lede">Pick a room and a puzzle name. Everyone who opens the link gets exactly the same puzzle, so you can compare stars. Rounds still earn normal XP.</p></div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      <div className="card formcard">
        <label className="field">Room
          <select className="input" value={room} onChange={(e) => setRoom(e.target.value)}>{ROOMS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
        </label>
        <label className="field">Puzzle name
          <input className="input" maxLength={24} value={seed} onChange={(e) => setSeed(e.target.value.replace(/[^\w-]/g, ''))} aria-label="Puzzle name" />
        </label>
        <div className="row">
          <button className="btn primary" disabled={!seed} onClick={() => setActive({ room, seed })}>{active ? 'Restart this puzzle' : 'Play it'}</button>
          <button className="btn" disabled={!seed} onClick={send}>Copy challenge link</button>
          <span className="fine" role="status" aria-live="polite" style={{ margin: 0 }}>{note}</span>
        </div>
      </div>
      {active && <View key={`${active.room}:${active.seed}:${Math.random()}`} />}
    </>
  )
}
