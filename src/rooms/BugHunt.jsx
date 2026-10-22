import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { BUGS, bugLine } from '../lib/bugs'
import { runTestsSync } from '../lib/runner'
import { shuffle, starsBad } from '../lib/util'

const COUNT = 5

export default function BugHunt() {
  const [round, setRound] = useState(0)
  return (
    <Room title="Bug Hunt" lede="Each function has exactly one bug on one line. Read it, find it and click it. Off-by-one errors, flipped comparisons and missing base cases hide in plain sight." modes={[['hunt', 'Hunt']]}>
      {() => <Play key={round} again={() => setRound((r) => r + 1)} />}
    </Room>
  )
}

// A concrete failing example for the hint, found by actually running the buggy code.
function failingExample(b) {
  const tests = b.tests.map(([args, want]) => ({ args, want }))
  const r = runTestsSync(b.buggy, b.fn, tests)
  const i = r.results.findIndex((x) => !x.pass)
  if (i < 0) return ''
  const x = r.results[i]
  return `${b.fn}(${b.tests[i][0].map((a) => JSON.stringify(a)).join(', ')}) gives ${x.err ? `an error (${x.err})` : x.got} but should give ${JSON.stringify(b.tests[i][1])}.`
}

function Play({ again }) {
  const picks = useMemo(() => shuffle(BUGS).slice(0, COUNT), [])
  const [k, setK] = useState(0)
  const [bad, setBad] = useState(0)
  const [found, setFound] = useState(false)
  const [wrong, setWrong] = useState([])
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('bug', COUNT, 4, 'Click the line that contains the bug.')
  const b = picks[Math.min(k, COUNT - 1)]
  const lines = b.buggy.split('\n')
  const at = bugLine(b)

  const click = (i) => {
    if (over || found) return
    if (i === at) {
      const n = k + 1
      setFound(true)
      laneSet(lane.dist, n, true)
      const fix = b.fixed.split('\n')[at].trim()
      say(`Found it. ${b.why} Fix: ${fix}`, 'ok')
      if (n >= COUNT) finish(true, starsBad(bad), 'Most bugs are boundaries (< vs <=, start and end values), flipped conditions, or missing base cases. Test the smallest and emptiest inputs first.', n, bad)
    } else {
      const m = bad + 1
      const d = lane.dist - 1
      setBad(m)
      setWrong((w) => [...w, i])
      laneSet(d, k, false)
      say(`Line ${i + 1} is fine. Keep looking.`, 'bad')
      if (d <= 0) finish(false, 0, `The bug was on line ${at + 1}. ${b.why}`, k, m)
    }
  }
  const next = () => {
    setK(k + 1)
    setFound(false)
    setWrong([])
    say('Next function. Find the bug.', '')
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <h3 style={{ fontSize: 16 }}>{b.title} <span className="fine">({k + 1} of {COUNT})</span></h3>
        <div className="codelist" role="group" aria-label="Function code, click the buggy line">
          {lines.map((l, i) => (
            <button key={i} className={`cl ${wrong.includes(i) ? 'wrong' : ''} ${found && i === at ? 'bug' : ''}`} onClick={() => click(i)} disabled={over || found} aria-label={`Line ${i + 1}: ${l.trim() || 'blank'}`}>
              <span className="ln">{i + 1}</span><span className="src">{l}</span>
            </button>
          ))}
        </div>
        <div className={`msg ${msg.c}`} style={{ marginTop: 10 }}>{msg.t}</div>
        <div className="row" style={{ marginTop: 8 }}>
          {found && !over && k + 1 < COUNT && <button className="btn primary" onClick={next}>Next bug</button>}
          {!found && <HintButton disabled={over} onHint={() => hint(failingExample(b))} />}
        </div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
