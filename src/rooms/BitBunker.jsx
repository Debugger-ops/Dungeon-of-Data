import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { W, genOp, toBits, trick } from '../lib/bits'
import { starsBad } from '../lib/util'

export default function BitBunker() {
  const [round, setRound] = useState(0)
  return (
    <Room
      title="Bit Bunker"
      lede="Everything is bits down here. Predict what the machine does to eight of them and the bunker door holds."
      modes={[['ops', 'Bit operations'], ['tricks', 'Bit tricks']]}
    >
      {(mode) => (mode === 'ops' ? <OpsPlay key={`o${round}`} again={() => setRound((r) => r + 1)} /> : <TrickPlay key={`t${round}`} again={() => setRound((r) => r + 1)} />)}
    </Room>
  )
}

function OpsPlay({ again }) {
  const puzzles = useMemo(() => Array.from({ length: 6 }, genOp), [])
  const [k, setK] = useState(0)
  const [bad, setBad] = useState(0)
  const [bits, setBits] = useState(Array(W).fill(0))
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('bits', puzzles.length, 4, 'Set the eight bits of the result (left is the highest bit), then press Check.')
  const p = puzzles[Math.min(k, puzzles.length - 1)]
  const value = bits.reduce((v, b) => v * 2 + b, 0)

  const check = () => {
    if (over) return
    if (value === p.result) {
      const n = k + 1
      laneSet(lane.dist, n, true)
      if (n >= puzzles.length) return finish(true, starsBad(bad), 'Bit operations work on every bit position independently (except shifts, which move them). Practise reading numbers in binary.', n, bad)
      setK(n)
      setBits(Array(W).fill(0))
      say(`Correct: ${p.text} = ${p.result}. ${p.rule}`, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, k, false)
      say(`${value} is not right. ${p.rule}`, 'bad')
      if (d <= 0) finish(false, 0, `${p.text} = ${p.result} (${toBits(p.result)}). ${p.rule}`, k, b)
    }
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <h3 className="mono" style={{ fontSize: 18 }}>{p.text}</h3>
        <div className="bitrows" aria-label="Inputs in binary">
          <div><span className="bl">a</span><code>{toBits(p.a)}</code></div>
          {p.b !== undefined && <div><span className="bl">b</span><code>{toBits(p.b)}</code></div>}
        </div>
        <div className="bitrow" role="group" aria-label="Your answer in binary">
          {bits.map((b, i) => (
            <button key={i} className={`bitbtn ${b ? 'on' : ''}`} aria-pressed={!!b} aria-label={`Bit ${W - 1 - i}`} disabled={over}
              onClick={() => setBits((x) => x.map((v, j) => (j === i ? 1 - v : v)))}>{b}</button>
          ))}
        </div>
        <div className="statrow" style={{ margin: '10px 0' }}>
          <span>Your answer <b data-testid="bitvalue">{value}</b></span>
          <span>Left to solve <b>{puzzles.length - k}</b></span>
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={check} disabled={over}>Check</button>
          <button className="btn ghost" onClick={() => setBits(Array(W).fill(0))} disabled={over}>Clear</button>
          <HintButton disabled={over} onHint={() => hint(p.rule)} />
        </div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

function TrickPlay({ again }) {
  const qs = useMemo(() => Array.from({ length: 6 }, trick), [])
  const [k, setK] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('bits', qs.length, 4, 'Pick the right answer. The one-liners x & (x - 1) and x & -x are classics.')
  const q = qs[Math.min(k, qs.length - 1)]
  const pick = (v) => {
    if (over) return
    if (v === q.answer) {
      const n = k + 1
      laneSet(lane.dist, n, true)
      if (n >= qs.length) return finish(true, starsBad(bad), 'Handy tricks: x & (x - 1) clears the lowest set bit, x & -x isolates it, and a power of two has exactly one set bit.', n, bad)
      setK(n)
      say(q.why, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, k, false)
      say(`Not ${v}. ${q.why}`, 'bad')
      if (d <= 0) finish(false, 0, q.why, k, b)
    }
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <h3 style={{ fontSize: 17 }}>{q.q}</h3>
        <div className={`msg ${msg.c}`} style={{ margin: '10px 0' }}>{msg.t}</div>
        {!over && (
          <div className="row">
            {q.opts.map((o) => <button key={o} className="btn optbtn" onClick={() => pick(o)}>{String(o)}</button>)}
            <HintButton onHint={() => hint(q.hint)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
