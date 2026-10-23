import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { findPuzzle, genOps, ufRun } from '../lib/unionfind'
import { rangeChoices } from '../lib/opts'
import { shuffle, starsBad } from '../lib/util'

const N = 8

export default function UnionYard() {
  const [round, setRound] = useState(0)
  const again = () => setRound((r) => r + 1)
  return (
    <Room
      title="Union Yard"
      lede="Union-Find keeps track of which things belong together. Every group has a root; merging two groups hangs one root under the other. Count the groups, or trace a member to its chief."
      modes={[['count', 'Count the groups'], ['find', 'Find the chief']]}
    >
      {(mode) => (mode === 'count' ? <CountPlay key={`c${round}`} again={again} /> : <FindPlay key={`f${round}`} again={again} />)}
    </Room>
  )
}

const ParentTable = ({ parent }) => (
  <div className="uf-table" role="table" aria-label={`Parent array: ${parent.map((p, i) => `${i} has parent ${p}`).join(', ')}`}>
    <div role="row">{parent.map((_, i) => <span key={i} className="ufh" role="columnheader">{i}</span>)}</div>
    <div role="row">{parent.map((p, i) => <span key={i} className={`ufc ${p === i ? 'root' : ''}`} role="cell">{p}</span>)}</div>
  </div>
)

function CountPlay({ again }) {
  const steps = useMemo(() => ufRun(N, genOps(N, 6)), [])
  const [i, setI] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('union', steps.length, 4, `${N} separate people. After each union(a, b), how many groups remain? Joining people already in the same group changes nothing.`)
  const s = steps[Math.min(i, steps.length - 1)]
  const before = i === 0 ? N : steps[i - 1].comps
  const opts = useMemo(() => steps.map((x) => rangeChoices(x.comps, 1, N)), [steps])
  const pick = (v) => {
    if (over) return
    if (v === s.comps) {
      const n = i + 1
      setI(n)
      laneSet(lane.dist, n, true)
      if (n >= steps.length) return finish(true, starsBad(bad), `Ended with ${s.comps} group${s.comps === 1 ? '' : 's'}. Union-Find answers "are these connected?" in almost O(1) with path compression and union by rank. It also powers Kruskal's algorithm.`, n, bad)
      say(s.why, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, i, false)
      say(`Not ${v}. ${s.why}`, 'bad')
      if (d <= 0) finish(false, 0, 'A union lowers the group count by one only when the two roots differ.', i, b)
    }
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="tokens" aria-label="Unions so far">
          {steps.map((x, k) => <span key={k} className={`tok ${k < i ? 'past' : k === i ? 'now' : ''}`}>{x.a}-{x.b}</span>)}
        </div>
        <div className="statrow" style={{ margin: '10px 0 4px' }}>
          <span>Groups before <b>{before}</b></span>
          <span>Now <b data-testid="uf-op">union({s.a}, {s.b})</b></span>
        </div>
        {i > 0 && <ParentTable parent={steps[i - 1].parent} />}
        <div className={`msg ${msg.c}`} style={{ marginTop: 10 }}>{msg.t}</div>
        {!over && (
          <div className="row" style={{ marginTop: 8 }} role="group" aria-label="Groups after the union">
            <span className="fine" style={{ margin: 0 }}>Groups after?</span>
            {opts[Math.min(i, steps.length - 1)].map((o) => <button key={o} className="btn optbtn" onClick={() => pick(o)}>{o}</button>)}
            <HintButton onHint={() => hint(`Follow ${s.a} and ${s.b} up to their roots. If the roots are the same, the count stays at ${before}.`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

function FindPlay({ again }) {
  const pz = useMemo(() => findPuzzle(N, 6), [])
  const opts = useMemo(() => pz.queries.map((q) => shuffle([q.root, ...shuffle(Array.from({ length: N }, (_, k) => k).filter((k) => k !== q.root)).slice(0, 3)])), [pz])
  const [i, setI] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('union', pz.queries.length, 4, 'The parent array shows each node\'s parent. A root is its own parent. Which node is the root of the query?')
  const q = pz.queries[Math.min(i, pz.queries.length - 1)]
  const pick = (v) => {
    if (over) return
    const trail = q.path.join(' → ')
    if (v === q.root) {
      const n = i + 1
      setI(n)
      laneSet(lane.dist, n, true)
      if (n >= pz.queries.length) return finish(true, starsBad(bad), 'find(x) walks parents until a node is its own parent. Without path compression the walk can be long, which is why real implementations flatten the path as they go.', n, bad)
      say(`Path: ${trail}. Root ${q.root}.`, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, i, false)
      say(`Not ${v}. Follow the parents: ${trail}. The root is ${q.root}.`, 'bad')
      if (d <= 0) finish(false, 0, 'Keep reading parent[x] until parent[x] equals x.', i, b)
    }
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="fine" style={{ margin: '0 0 6px' }}>After {pz.ops.map(([a, b]) => `union(${a},${b})`).join(', ')}:</div>
        <ParentTable parent={pz.parent} />
        <div className="statrow" style={{ margin: '10px 0 4px' }}><span>Query <b>{Math.min(i + 1, pz.queries.length)}/{pz.queries.length}</b></span><span>find(<b data-testid="uf-q">{q.x}</b>) = ?</span></div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        {!over && (
          <div className="row" style={{ marginTop: 8 }} role="group" aria-label="Root">
            {opts[Math.min(i, pz.queries.length - 1)].map((o) => <button key={o} className="btn optbtn" onClick={() => pick(o)}>{o}</button>)}
            <HintButton onHint={() => hint(`Look up column ${q.x} in the second row, then jump to that column, and repeat until a column holds its own number.`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
