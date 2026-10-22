import { useEffect, useMemo, useRef, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { deal } from '../lib/memory'

const PAIRS = 8

export default function MemoryMatch() {
  const [round, setRound] = useState(0)
  return (
    <Room title="Memory Match" lede="Every structure has a signature trait. Flip two cards to match each term with what it is known for. Wrong flips let the goblins creep forward." modes={[['match', 'Match']]}>
      {() => <Play key={round} again={() => setRound((r) => r + 1)} />}
    </Room>
  )
}

function Play({ again }) {
  const cards = useMemo(() => deal(PAIRS), [])
  const [open, setOpen] = useState([])
  const [done, setDone] = useState([])
  const [miss, setMiss] = useState(0)
  const [lock, setLock] = useState(false)
  const timer = useRef(null)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('memory', PAIRS, 8, 'Flip a card, then flip another. Match each term with its trait.')
  useEffect(() => () => clearTimeout(timer.current), [])

  const flip = (c) => {
    if (over || lock || open.includes(c.id) || done.includes(c.pair)) return
    const now = [...open, c.id]
    setOpen(now)
    if (now.length < 2) return
    const [a, b] = now.map((id) => cards.find((x) => x.id === id))
    if (a.pair === b.pair) {
      const d = [...done, a.pair]
      setDone(d)
      setOpen([])
      laneSet(lane.dist, d.length, true)
      say(`Match: ${cards.find((x) => x.pair === a.pair && x.kind === 'term').text} is ${cards.find((x) => x.pair === a.pair && x.kind === 'def').text}.`, 'ok')
      if (d.length >= PAIRS) finish(true, miss <= 3 ? 3 : miss <= 6 ? 2 : 1, `Cleared with ${miss} wrong flip${miss === 1 ? '' : 's'}. Knowing each structure's signature (LIFO, O(log n), O(1) average...) is half of choosing the right one.`, PAIRS, miss)
    } else {
      const m = miss + 1
      const dist = lane.dist - 1
      setMiss(m)
      setLock(true)
      laneSet(dist, done.length, false)
      say('No match. Remember where those were.', 'bad')
      if (dist <= 0) {
        finish(false, 0, 'Too many wrong flips. Try remembering each card before you flip the next.', done.length, m)
        return
      }
      timer.current = setTimeout(() => {
        setOpen([])
        setLock(false)
      }, 800)
    }
  }
  const show = (c) => open.includes(c.id) || done.includes(c.pair)
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="statrow"><span>Pairs <b>{done.length}/{PAIRS}</b></span><span>Wrong flips <b data-testid="misses">{miss}</b></span></div>
        <div className="memgrid" role="group" aria-label="Cards">
          {cards.map((c, i) => (
            <button key={c.id} data-pair={c.pair} className={`mcard ${show(c) ? 'up' : ''} ${done.includes(c.pair) ? 'ok' : ''} ${c.kind}`} onClick={() => flip(c)}
              aria-label={show(c) ? c.text : `Card ${i + 1}, face down`} aria-pressed={show(c)}>
              {show(c) ? c.text : '?'}
            </button>
          ))}
        </div>
        <div className={`msg ${msg.c}`} style={{ marginTop: 10 }} role="status">{msg.t}</div>
        <div className="row" style={{ marginTop: 8 }}>
          <HintButton disabled={over} onHint={() => hint(`Term cards are outlined and trait cards are filled. Each term has exactly one trait. Peek at the unmatched terms: ${cards.filter((c) => c.kind === 'term' && !done.includes(c.pair)).map((c) => c.text).slice(0, 3).join(', ')}.`)} />
        </div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
