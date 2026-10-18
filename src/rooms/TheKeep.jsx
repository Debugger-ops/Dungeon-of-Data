import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import { useRound } from '../hooks'
import { rand, rnd, shuffle, starsBad } from '../lib/util'

export default function TheKeep() {
  const [round, setRound] = useState(0)
  const [kind, setKind] = useState('stack')
  const again = () => setRound((r) => r + 1)
  return (
    <Room
      title="The Keep"
      lede="Stacks and queues guard the gate; a linked list hides the keep's secret passage. Predict what leaves first, then rewire pointers."
      modes={[['sq', 'Stack and queue'], ['ll', 'Reverse a list']]}
    >
      {(mode) => (mode === 'sq' ? <StackQueue key={kind + round} kind={kind} setKind={setKind} again={again} /> : <ListReverse key={`l${round}`} again={again} />)}
    </Room>
  )
}

// Build a script of push/pop operations that never pops an empty structure.
function makeOps() {
  let ops
  let pops
  do {
    ops = []
    let size = 0
    let pushes = 0
    const used = new Set()
    for (let k = 0; k < 10; k++) {
      if (size === 0 || (rnd() < 0.6 && pushes < 7)) {
        let v
        do {
          v = rand(1, 99)
        } while (used.has(v))
        used.add(v)
        ops.push({ t: 'push', v })
        size++
        pushes++
      } else {
        ops.push({ t: 'pop' })
        size--
      }
    }
    pops = ops.filter((o) => o.t === 'pop').length
  } while (pops < 3 || pops > 5)
  return ops
}

function StackQueue({ kind, setKind, again }) {
  const isStack = kind === 'stack'
  const pn = isStack ? 'push' : 'enqueue'
  const qn = isStack ? 'pop' : 'dequeue'
  const ops = useMemo(makeOps, [])
  const pops = ops.filter((o) => o.t === 'pop').length
  const { lane, laneSet, msg, say, end, over, finish } = useRound('keep', pops, 4, 'Press Run pushes to execute the script until the next removal.')
  const [pc, setPc] = useState(0)
  const [struct, setStruct] = useState([])
  const [bad, setBad] = useState(0)
  const nextPop = pc < ops.length && ops[pc].t === 'pop'
  const lesson = isStack ? 'Stacks are LIFO: the last item pushed is the first popped. Think of a pile of plates.' : 'Queues are FIFO: the first item enqueued is the first dequeued. Think of a line at a gate.'

  const run = () => {
    let p = pc
    const s = [...struct]
    while (p < ops.length && ops[p].t === 'push') {
      s.push(ops[p].v)
      p++
    }
    setStruct(s)
    setPc(p)
    if (p >= ops.length) {
      laneSet(lane.dist, pops, true)
      finish(true, starsBad(bad), lesson, pops, bad)
    } else say(`Next is ${qn}(). Tap the item it will remove.`)
  }

  const pop = (i) => {
    if (over || !nextPop) return
    const want = isStack ? struct.length - 1 : 0
    if (i === want) {
      const v = struct[i]
      const p = pc + 1
      const k = lane.killed + 1
      setStruct(struct.filter((_, x) => x !== i))
      setPc(p)
      laneSet(lane.dist, k, true)
      say(`${qn}() returned ${v}. Goblin slain.`, 'ok')
      if (p >= ops.length) finish(true, starsBad(bad), lesson, pops, bad)
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, lane.killed, false)
      say(isStack ? 'A stack removes from the top, the most recently pushed item.' : 'A queue removes from the front, the item that has waited longest.', 'bad')
      if (d <= 0) finish(false, 0, isStack ? 'Remember: last in, first out.' : 'Remember: first in, first out.', lane.killed, b)
    }
  }

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="grid2">
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b className="mono">Script</b>
            <div className="chips">
              <button className={`opt ${isStack ? 'on' : ''}`} onClick={() => setKind('stack')}>Stack</button>
              <button className={`opt ${!isStack ? 'on' : ''}`} onClick={() => setKind('queue')}>Queue</button>
            </div>
          </div>
          <div className="ops" style={{ margin: '10px 0' }}>
            {ops.map((o, i) => (
              <div key={i} className={i < pc ? 'past' : i === pc ? 'now' : ''}>{o.t === 'push' ? `${pn}(${o.v})` : `${qn}()`}</div>
            ))}
          </div>
          <button className="btn primary" disabled={over || nextPop || pc >= ops.length} onClick={run}>Run pushes</button>
        </div>
        <div className="card">
          <div className="tag">{isStack ? 'top (pop here)' : 'front (dequeue here)'}</div>
          <div className={`struct ${kind}`}>
            {struct.length === 0 && <span className="tag">empty</span>}
            {struct.map((v, i) => (
              <div key={v} className={`item ${nextPop && !over ? 'can' : ''}`} onClick={() => pop(i)}>{v}</div>
            ))}
          </div>
          <div className="tag">{isStack ? 'bottom' : 'back (enqueue here)'}</div>
          <div className={`msg ${msg.c}`} style={{ marginTop: 8 }}>{msg.t}</div>
        </div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

function ListReverse({ again }) {
  const n = 5
  const vals = useMemo(() => shuffle(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']).slice(0, n), [])
  const [nx, setNx] = useState(() => vals.map((_, i) => (i + 1 < n ? i + 1 : null)))
  const [prev, setPrev] = useState(null)
  const [curr, setCurr] = useState(0)
  const [nxt, setNxt] = useState(undefined)
  const [phase, setPhase] = useState(0)
  const [steps, setSteps] = useState(0)
  const [bad, setBad] = useState(0)
  const total = 3 * n
  const { lane, laneSet, msg, say, end, over, finish } = useRound('keep', total, 4, 'Start by saving curr.next before you change it.')
  const X = (i) => 70 + i * 110

  const act = (o) => {
    if (over) return
    if (o === phase) {
      let nc = curr
      if (o === 0) {
        setNxt(nx[curr])
        say('Saved next so we do not lose the rest of the list.', 'ok')
      } else if (o === 1) {
        const copy = [...nx]
        copy[curr] = prev
        setNx(copy)
        say('Flipped the pointer to look backwards.', 'ok')
      } else {
        nc = nxt
        setPrev(curr)
        setCurr(nc)
        setNxt(undefined)
        say('Advanced both pointers.', 'ok')
      }
      const s = steps + 1
      setSteps(s)
      setPhase((phase + 1) % 3)
      laneSet(lane.dist, s, true)
      if (o === 2 && nc === null) finish(true, starsBad(bad), 'In-place reversal runs in O(n) time and O(1) extra space. The trick is saving next before overwriting curr.next.', total, bad)
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, steps, false)
      say(['Not yet: the first move each round is saving curr.next.', 'Not yet: next is saved, so flip curr.next to prev.', 'Not yet: the pointer is flipped, now advance prev and curr.'][phase], 'bad')
      if (d <= 0) finish(false, 0, 'Order matters: save next, flip curr.next, then advance prev and curr.', steps, b)
    }
  }

  const tag = (idx, name, col, row) => (idx === null || idx === undefined ? null : <text className="ptag" x={X(idx)} y={row} style={{ fill: col }}>{name}</text>)

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <p className="lede" style={{ marginBottom: 8 }}>Reverse the list in place using three pointers. Pick the correct next line of code each turn.</p>
        <svg className="svgbox ll" viewBox="0 0 640 150" role="img" aria-label="Linked list">
          {vals.map((v, i) => (
            <g key={v}>
              <rect className="box" x={X(i) - 34} y="52" width="68" height="40" rx="4" />
              <text x={X(i)} y="77">{v}</text>
            </g>
          ))}
          {nx.map((j, i) => {
            if (j === null) return (
              <g key={`a${i}`}>
                <path className="ar" d={`M${X(i) + 34} 72 h14`} />
                <text x={X(i) + 58} y="77" style={{ fontSize: 16 }}>∅</text>
              </g>
            )
            if (j === i + 1) return (
              <g key={`a${i}`}>
                <path className="ar" d={`M${X(i) + 34} 64 H${X(j) - 38}`} />
                <path className="ar" d={`M${X(j) - 44} 59 l6 5 l-6 5`} />
              </g>
            )
            return (
              <g key={`a${i}`}>
                <path className="ar" d={`M${X(i) - 34} 82 H${X(j) + 38}`} />
                <path className="ar" d={`M${X(j) + 44} 77 l-6 5 l6 5`} />
              </g>
            )
          })}
          {tag(curr, 'curr', 'var(--torch)', 34)}
          {tag(prev, 'prev', 'var(--arc)', 116)}
          {tag(nxt, 'next', 'var(--vio)', 134)}
          {prev === null && !over && <text className="ptag" x="14" y="116" style={{ fill: 'var(--arc)', textAnchor: 'start' }}>prev = ∅</text>}
          {end && end.win && <text x="320" y="20" style={{ fill: 'var(--ok)', fontSize: 13 }}>head is now {vals[prev]}</text>}
        </svg>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn" onClick={() => act(0)}>next = curr.next</button>
          <button className="btn" onClick={() => act(1)}>curr.next = prev</button>
          <button className="btn" onClick={() => act(2)}>prev = curr; curr = next</button>
        </div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
