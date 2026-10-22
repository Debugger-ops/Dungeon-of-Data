import { useEffect, useState } from 'react'
import { useProgress } from './progress'
import { useCloud } from './cloud'
import { BOARDS, fetchBoard } from './lib/sync'
import { ROOMS } from './lib/rooms'

const ORDER = ['xp', 'streak', 'wpm', 'daily']
const roomName = (id) => (ROOMS.find((r) => r.id === id) || { name: '' }).name

export default function Leaderboard() {
  const { go } = useProgress()
  const C = useCloud()
  const [kind, setKind] = useState('xp')
  const [state, setState] = useState({ s: 'loading', rows: [], error: '' })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!C.enabled || !C.client) return undefined
    let dead = false
    setState((p) => ({ ...p, s: 'loading' }))
    fetchBoard(C.client, kind)
      .then((rows) => !dead && setState({ s: 'ok', rows, error: '' }))
      .catch((e) => !dead && setState({ s: 'error', rows: [], error: e.message }))
    return () => {
      dead = true
    }
  }, [C.enabled, C.client, kind, tick])

  const b = BOARDS[kind]
  const me = C.user && C.user.id

  return (
    <>
      <div className="roomhead">
        <div>
          <h2>Leaderboard</h2>
          <p className="lede">See how you rank against other players. Only your name, colour and scores are shown, and you can hide yourself any time in Account.</p>
        </div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>

      {!C.enabled && (
        <div className="card">
          <h3>Online features are not set up on this copy</h3>
          <p className="fine">Leaderboards and cloud saves need a Supabase project. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see the README, section "Backend"), rebuild, and this page comes alive. Everything else works offline without it.</p>
        </div>
      )}

      {C.enabled && (
        <>
          <div className="chips" role="tablist" aria-label="Leaderboards">
            {ORDER.map((k) => (
              <button key={k} role="tab" aria-selected={k === kind} className={`chip ${k === kind ? 'on' : ''}`} onClick={() => setKind(k)}>{BOARDS[k].label}</button>
            ))}
            <button className="chip" onClick={() => setTick((t) => t + 1)}>Refresh</button>
          </div>
          <div className="card">
            {state.s === 'loading' && <p className="fine">Loading rankings...</p>}
            {state.s === 'error' && <div className="msg bad">Could not load the leaderboard: {state.error}</div>}
            {state.s === 'ok' && state.rows.length === 0 && <p className="fine">Nobody is on this board yet. Be the first: link your profile in Account and play a round.</p>}
            {state.s === 'ok' && state.rows.length > 0 && (
              <div className="scroll" tabIndex={0}>
                <table className="board" aria-label={`${b.label} ranking`}>
                  <thead>
                    <tr><th scope="col">#</th><th scope="col">Player</th><th scope="col" className="num">{b.unit}</th>{kind === 'daily' && <th scope="col">Room</th>}{kind === 'xp' && <th scope="col" className="num">Wins</th>}</tr>
                  </thead>
                  <tbody>
                    {state.rows.map((r) => (
                      <tr key={r.user_id} className={r.user_id === me ? 'me' : ''}>
                        <td className="num">{r.rank}</td>
                        <td><span className="dot" style={{ background: r.color }} aria-hidden="true" />{r.name}{r.user_id === me ? ' (you)' : ''}</td>
                        <td className="num"><b>{r.value}</b></td>
                        {kind === 'daily' && <td>{roomName(r.room)}</td>}
                        {kind === 'xp' && <td className="num">{r.wins}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {!C.linked && (
            <div className="card">
              <p className="fine" style={{ margin: 0 }}>{C.user ? 'Your account is signed in but this profile is not linked yet.' : 'Playing as a guest.'} <button className="btn" onClick={() => go('account')}>Open Account to join the board</button></p>
            </div>
          )}
        </>
      )}
    </>
  )
}
