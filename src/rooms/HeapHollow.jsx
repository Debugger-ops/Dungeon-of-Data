import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { heapPuzzle, heapifyRun } from '../lib/heapgame'
import { starsBad } from '../lib/util'

export default function HeapHollow() {
  const [round, setRound] = useState(0)
  const again = () => setRound((r) => r + 1)
  return (
    <Room
      title="Heap Hollow"
      lede="Build a heap from a messy array in O(n). Work from the last parent upward and sift each value down: swap with the better child, or stay put when it already fits."
      modes={[['min', 'Build a min-heap'], ['max', 'Build a max-heap']]}
    >
      {(mode) => <Build key={`${mode}${round}`} mode={mode} again={again} />}
    </Room>
  )
}

function Build({ mode, again }) {
  const run = useMemo(() => heapifyRun(heapPuzzle(), mode), [mode])
  const [i, setI] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('heap', run.steps.length, 5, `Sift down each parent (last one first). For the highlighted value choose Swap left, Swap right or Stay. Goal: every parent ${mode === 'min' ? 'smaller' : 'larger'} than its children.`)
  const st = run.steps[Math.min(i, run.steps.length - 1)]
  const a = st.before
  const act = (x) => {
    if (over) return
    if (x === st.action) {
      const n = i + 1
      setI(n)
      laneSet(lane.dist, n, true)
      if (n >= run.steps.length) return finish(true, starsBad(bad), `Heap built: ${run.result.join(', ')}. Bottom-up heapify costs O(n), which beats inserting n items one by one at O(n log n).`, n, bad)
      say(st.why, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, i, false)
      say(`Not ${x}. ${st.why}`, 'bad')
      if (d <= 0) finish(false, 0, `Compare the value with both children. Swap with the ${mode === 'min' ? 'smaller' : 'larger'} one if it beats the value, otherwise stay.`, i, b)
    }
  }
  const kids = [2 * st.i + 1, 2 * st.i + 2].filter((k) => k < a.length)
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="tokens" aria-label={`Array ${a.join(' ')}, sifting index ${st.i}`}>
          {a.map((v, k) => <span key={k} className={`tok ${k === st.i ? 'now' : kids.includes(k) ? 'kid' : ''}`}><small className="idx">{k}</small>{v}</span>)}
        </div>
        <div className="statrow" style={{ margin: '10px 0 4px' }}>
          <span>Step <b>{Math.min(i + 1, run.steps.length)}/{run.steps.length}</b></span>
          <span>Sifting <b data-testid="heap-val">{a[st.i]}</b> at index {st.i}</span>
          <span>Children {kids.length ? kids.map((k) => `${a[k]} (i${k})`).join(', ') : 'none'}</span>
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        {!over && (
          <div className="row" style={{ marginTop: 8 }} role="group" aria-label="Action">
            <button className="btn" onClick={() => act('left')}>Swap left</button>
            <button className="btn" onClick={() => act('right')}>Swap right</button>
            <button className="btn" onClick={() => act('stay')}>Stay</button>
            <HintButton onHint={() => hint(`Children of index ${st.i} are at ${2 * st.i + 1} and ${2 * st.i + 2}. Find the ${mode === 'min' ? 'smallest' : 'largest'} of the three values.`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
