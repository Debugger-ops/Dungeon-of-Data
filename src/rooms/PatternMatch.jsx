import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { TP_ACTIONS, slidingPuzzle, twoPointerPuzzle } from '../lib/window'
import { starsBad } from '../lib/util'

export default function PatternMatch() {
  const [round, setRound] = useState(0)
  const again = () => setRound((r) => r + 1)
  return (
    <Room
      title="Pattern Match"
      lede="Brute force checks everything. Two pointers and sliding windows reuse the work from the last step and finish in one pass."
      modes={[['two', 'Two pointers'], ['slide', 'Sliding window']]}
    >
      {(mode) => (mode === 'two' ? <TwoPlay key={`a${round}`} again={again} /> : <SlidePlay key={`b${round}`} again={again} />)}
    </Room>
  )
}

const Cells = ({ a, mark, win }) => (
  <div className="cells" role="group" aria-label={`Array ${a.join(', ')}`}>
    {a.map((v, i) => (
      <span key={i} className={`acell ${win && i >= win[0] && i < win[1] ? 'win' : ''} ${mark && mark[i] ? 'mk' : ''}`}>
        <b>{v}</b>
        <small>{mark && mark[i] ? mark[i] : ' '}</small>
      </span>
    ))}
  </div>
)

function TwoPlay({ again }) {
  const p = useMemo(() => twoPointerPuzzle(), [])
  const [i, setI] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('window', p.steps.length, 4, `Find two numbers that add up to ${p.target}. Compare the sum of the two ends and decide which pointer moves.`)
  const s = p.steps[Math.min(i, p.steps.length - 1)]

  const act = (a) => {
    if (over) return
    if (a === s.action) {
      const n = i + 1
      laneSet(lane.dist, n, true)
      if (a === 'found') return finish(true, starsBad(bad), `${p.a[s.l]} + ${p.a[s.r]} = ${p.target}. On a sorted array, a sum that is too small needs a bigger left value and one that is too big needs a smaller right value, so each pointer only moves one way: O(n) instead of checking all pairs.`, n, bad)
      setI(n)
      say(a === 'l' ? 'Sum was too small, so the left pointer moved right.' : 'Sum was too big, so the right pointer moved left.', 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, i, false)
      say(`Not that. ${s.sum} ${s.sum < p.target ? 'is smaller than' : s.sum > p.target ? 'is bigger than' : 'equals'} ${p.target}.`, 'bad')
      if (d <= 0) finish(false, 0, 'If the sum is too small move the left pointer right; if it is too big move the right pointer left.', i, b)
    }
  }
  const mark = { [s.l]: 'L', [s.r]: 'R' }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <p style={{ margin: '0 0 8px' }}>Target <b className="big">{p.target}</b> in a sorted array</p>
        <Cells a={p.a} mark={mark} />
        <div className="statrow" style={{ margin: '10px 0' }}>
          <span>{p.a[s.l]} + {p.a[s.r]} = <b data-testid="tpsum">{s.sum}</b></span>
          <span>Steps <b>{i}</b></span>
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        {!over && (
          <div className="row" style={{ marginTop: 8 }} role="group" aria-label="Choose the move">
            {TP_ACTIONS.map(([k, label]) => <button key={k} className="btn" onClick={() => act(k)}>{label}</button>)}
            <HintButton onHint={() => hint(`Compare ${s.sum} with the target ${p.target}. Smaller means you need a bigger number, bigger means you need a smaller one.`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

function SlidePlay({ again }) {
  const p = useMemo(() => slidingPuzzle(), [])
  const [i, setI] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('window', p.steps.length, 4, `The window holds ${p.k} numbers. Slide it right: subtract the number that leaves, add the one that enters.`)
  const st = p.steps[Math.min(i, p.steps.length - 1)]
  const prev = p.sums[i]
  const pick = (v) => {
    if (over) return
    if (v === st.value) {
      const n = i + 1
      laneSet(lane.dist, n, true)
      if (n >= p.steps.length) return finish(true, starsBad(bad), `The best window sum is ${p.best}. Updating the sum in O(1) (subtract the leaving value, add the entering value) beats re-adding the whole window every time.`, n, bad)
      setI(n)
      say(`${prev} - ${st.leaving} + ${st.entering} = ${st.value}.`, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, i, false)
      say(`Not ${v}. New sum = old sum - leaving + entering = ${prev} - ${st.leaving} + ${st.entering}.`, 'bad')
      if (d <= 0) finish(false, 0, 'new sum = old sum - leaving value + entering value.', i, b)
    }
  }
  const mark = { [st.start - 1]: `-${st.leaving}`, [st.start + p.k - 1]: `+${st.entering}` }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <Cells a={p.a} mark={mark} win={[st.start, st.start + p.k]} />
        <div className="statrow" style={{ margin: '10px 0' }}>
          <span>Current window sum <b data-testid="winsum">{prev}</b></span>
          <span>Windows done <b>{i}/{p.steps.length}</b></span>
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        {!over && (
          <div className="row" style={{ marginTop: 8 }}>
            <span className="fine" style={{ margin: 0 }}>New window sum?</span>
            {st.opts.map((o) => <button key={o} className="btn optbtn" onClick={() => pick(o)}>{o}</button>)}
            <HintButton onHint={() => hint(`Take the old sum ${prev}, remove ${st.leaving}, add ${st.entering}.`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
