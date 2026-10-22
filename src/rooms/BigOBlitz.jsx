import { useEffect, useRef, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { BIGO, CLASSES } from '../lib/bigo'
import { shuffle, starsBad } from '../lib/util'

const SECONDS = 15
const COUNT = 10

export default function BigOBlitz() {
  const [round, setRound] = useState(0)
  return (
    <Room
      title="Big-O Blitz"
      lede="Read the code, name its growth rate, and do it before the clock runs out. Miss one and it comes back later, with the goblins one step closer."
      modes={[['blitz', 'Blitz']]}
    >
      {() => <Play key={round} again={() => setRound((r) => r + 1)} />}
    </Room>
  )
}

function Play({ again }) {
  const [queue, setQueue] = useState(() => shuffle(BIGO).slice(0, COUNT))
  const [killed, setKilled] = useState(0)
  const [bad, setBad] = useState(0)
  const [left, setLeft] = useState(SECONDS)
  const deadline = useRef(Date.now() + SECONDS * 1000)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('bigo', COUNT, 5, `You have ${SECONDS} seconds per snippet. Choose its time complexity.`)
  const item = queue[0]

  const miss = (why) => {
    const b = bad + 1
    const d = lane.dist - 1
    setBad(b)
    laneSet(d, killed, false)
    say(why, 'bad')
    if (d <= 0) return finish(false, 0, `${item.ans}: ${item.why}`, killed, b)
    setQueue((q) => (q.length > 1 ? [...q.slice(1), q[0]] : q))
    deadline.current = Date.now() + SECONDS * 1000
  }
  const answer = (c) => {
    if (over) return
    if (c === item.ans) {
      const n = killed + 1
      setKilled(n)
      laneSet(lane.dist, n, true)
      if (n >= COUNT) return finish(true, starsBad(bad), 'Count how many times the work repeats as n grows: nested loops multiply, sequential loops add, halving gives log n, branching recursion can blow up to 2^n.', n, bad)
      say(`Correct: ${item.ans}. ${item.why}`, 'ok')
      setQueue((q) => q.slice(1))
      deadline.current = Date.now() + SECONDS * 1000
    } else miss(`Not ${c}. It is ${item.ans}: ${item.why}`)
  }

  const missRef = useRef(miss)
  missRef.current = miss
  useEffect(() => {
    if (over) return undefined
    const t = setInterval(() => {
      const s = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))
      setLeft(s)
      if (s <= 0) missRef.current('Time is up.')
    }, 200)
    return () => clearInterval(t)
  }, [over])

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="statrow">
          <span>Time <b data-testid="timer" style={{ color: left <= 5 ? 'var(--bad)' : undefined }}>{left}s</b></span>
          <span>Solved <b>{killed}/{COUNT}</b></span>
          <span>Misses <b>{bad}</b></span>
        </div>
        <div className="timerbar" aria-hidden="true"><i style={{ width: `${(left / SECONDS) * 100}%` }} /></div>
        <pre className="codebox ref" data-testid="snippet" style={{ marginTop: 10 }}>{item.code}</pre>
        <div className={`msg ${msg.c}`} style={{ margin: '10px 0' }}>{msg.t}</div>
        {!over && (
          <div className="row" role="group" aria-label="Time complexity">
            {CLASSES.map((c) => <button key={c} className="btn optbtn" onClick={() => answer(c)}>{c}</button>)}
            <HintButton onHint={() => hint(`${item.why.split('. ')[0].replace(/\.$/, '')}.`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
