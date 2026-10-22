import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { bracketRun, bracketString, postfixPuzzle } from '../lib/stackgame'
import { numChoices } from '../lib/opts'
import { starsBad } from '../lib/util'

export default function StackDefender() {
  const [round, setRound] = useState(0)
  const again = () => setRound((r) => r + 1)
  return (
    <Room
      title="Stack Defender"
      lede="Last in, first out. Feed the stack the right way and it will check brackets and crunch postfix maths faster than any goblin can march."
      modes={[['brackets', 'Bracket guard'], ['postfix', 'Postfix calculator']]}
    >
      {(mode) => (mode === 'brackets' ? <BracketPlay key={`b${round}`} again={again} /> : <PostfixPlay key={`p${round}`} again={again} />)}
    </Room>
  )
}

const StackView = ({ items }) => (
  <div className="stackview" aria-label={`Stack, top first: ${items.length ? [...items].reverse().join(' ') : 'empty'}`}>
    {items.length === 0 && <span className="fine">empty</span>}
    {[...items].reverse().map((x, i) => <span key={i} className="scell">{x}</span>)}
  </div>
)

function BracketPlay({ again }) {
  const runs = useMemo(() => Array.from({ length: 3 }, () => { const s = bracketString(); return { s, ...bracketRun(s) } }), [])
  const [si, setSi] = useState(0)
  const [ti, setTi] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('stackdef', runs.length, 4, 'For each symbol choose Push, Pop or Reject. At the end choose Accept if the stack is empty.')
  const run = runs[Math.min(si, runs.length - 1)]
  const step = run.steps[Math.min(ti, run.steps.length - 1)]
  const stack = ti === 0 ? [] : run.steps[ti - 1].after

  const act = (a) => {
    if (over) return
    if (a === step.action) {
      const last = a === 'reject' || a === 'accept'
      if (last) {
        const n = si + 1
        laneSet(lane.dist, n, true)
        if (n >= runs.length) return finish(true, starsBad(bad), 'A stack matches brackets: push every opener, pop on a matching closer, and reject on a mismatch or a leftover opener. It runs in O(n).', n, bad)
        setSi(n)
        setTi(0)
        say(step.why, 'ok')
      } else {
        setTi(ti + 1)
        say(step.why, 'ok')
      }
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, si, false)
      say(`Not ${a}. ${step.why}`, 'bad')
      if (d <= 0) finish(false, 0, 'Push openers, pop when the closer matches the top, reject otherwise.', si, b)
    }
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="tokens" aria-label={`String ${run.s}`}>
          {run.s.split('').map((c, i) => <span key={i} className={`tok ${i < ti ? 'past' : i === ti ? 'now' : ''}`}>{c}</span>)}
          <span className={`tok ${ti >= run.s.length ? 'now' : ''}`}>end</span>
        </div>
        <div className="statrow" style={{ margin: '10px 0 4px' }}><span>Stack (top first)</span><span>String <b>{si + 1}/{runs.length}</b></span></div>
        <StackView items={stack} />
        <div className={`msg ${msg.c}`} style={{ margin: '10px 0' }}>{msg.t}</div>
        {!over && (
          <div className="row" role="group" aria-label="Action">
            {['push', 'pop', 'reject', 'accept'].map((a) => <button key={a} className="btn" onClick={() => act(a)}>{a[0].toUpperCase() + a.slice(1)}</button>)}
            <HintButton onHint={() => hint(step.ch === 'end' ? 'At the end: is the stack empty?' : '([{ open a group. )]} close one, and only the matching top can be popped.')} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

function PostfixPlay({ again }) {
  const p = useMemo(() => postfixPuzzle(4), [])
  const opIdx = useMemo(() => p.steps.map((s, i) => (s.kind === 'op' ? i : -1)).filter((i) => i >= 0), [p])
  const opts = useMemo(() => opIdx.map((i) => numChoices(p.steps[i].value)), [p, opIdx])
  const [q, setQ] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('stackdef', opIdx.length, 4, 'Numbers go on the stack. An operator pops the top two (second-from-top first), applies itself and pushes the result. Pick the result.')
  const at = opIdx[Math.min(q, opIdx.length - 1)]
  const step = p.steps[at]
  const before = at === 0 ? [] : p.steps[at - 1].stack

  const pick = (v) => {
    if (over) return
    if (v === step.value) {
      const n = q + 1
      laneSet(lane.dist, n, true)
      if (n >= opIdx.length) return finish(true, starsBad(bad), `The expression equals ${p.steps[p.steps.length - 1].value}. Postfix needs no brackets or precedence rules: a stack evaluates it left to right in one pass.`, n, bad)
      setQ(n)
      say(`${step.a} ${step.t} ${step.b} = ${step.value}. Pushed.`, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, q, false)
      say(`Not ${v}. The top two are ${step.a} (below) and ${step.b} (top), so compute ${step.a} ${step.t} ${step.b}.`, 'bad')
      if (d <= 0) finish(false, 0, `For "${step.t}" pop b (the top) then a, and push a ${step.t} b.`, q, b)
    }
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="tokens" aria-label={`Postfix ${p.tokens.join(' ')}`}>
          {p.tokens.map((t, i) => <span key={i} className={`tok ${i < at ? 'past' : i === at ? 'now' : ''}`}>{t}</span>)}
        </div>
        <div className="statrow" style={{ margin: '10px 0 4px' }}><span>Stack before the operator (top first)</span><span>Operators left <b>{opIdx.length - q}</b></span></div>
        <StackView items={before} />
        <div className={`msg ${msg.c}`} style={{ margin: '10px 0' }}>{msg.t}</div>
        {!over && (
          <div className="row">
            <span className="fine" style={{ margin: 0 }}>{step.a} {step.t} {step.b} ?</span>
            {opts[q].map((o) => <button key={o} className="btn optbtn" onClick={() => pick(o)}>{o}</button>)}
            <HintButton onHint={() => hint(`The operator ${step.t} takes the top two values. For - the order matters: second-from-top minus top.`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
