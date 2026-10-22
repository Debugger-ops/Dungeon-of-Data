import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { REV, deleteTask, insertTask, reverseRun } from '../lib/list'
import { shuffle, starsBad, uniq } from '../lib/util'

export default function LinkedListLab() {
  const [round, setRound] = useState(0)
  const again = () => setRound((r) => r + 1)
  return (
    <Room
      title="Linked List Lab"
      lede="Nodes only know their next neighbour. Rewire the pointers in exactly the right order or the chain snaps and the goblins march through."
      modes={[['reverse', 'Reverse the list'], ['delete', 'Delete a node'], ['insert', 'Insert in order']]}
    >
      {(mode) => (mode === 'reverse' ? <ReversePlay key={`r${round}`} again={again} /> : <EditPlay key={`${mode}${round}`} kind={mode} again={again} />)}
    </Room>
  )
}

/* ---------- Reverse: pick each statement in order ---------- */

function ReversePlay({ again }) {
  const run = useMemo(() => {
    const n = 4
    return { n, vals: uniq(n, 10, 99), ...reverseRun(n) }
  }, [])
  const orders = useMemo(() => run.steps.map(() => shuffle(REV)), [run])
  const [i, setI] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('list', run.n, 4, 'Reverse the list with the loop: pick the next statement. Each full pass of four statements moves one node.')
  const done = i >= run.steps.length
  const st = i === 0 ? run.init : run.steps[i - 1].state
  const want = done ? null : run.steps[i].stmt

  const pick = (id) => {
    if (over || done) return
    if (id === want) {
      const n = i + 1
      setI(n)
      if (n % 4 === 0) {
        laneSet(lane.dist, n / 4, true)
        if (n === run.steps.length) return finish(true, starsBad(bad), 'The loop is: save next, point curr back at prev, move prev forward, move curr forward. Order matters: if you overwrite curr.next before saving it, the rest of the list is lost.', run.n, bad)
        say('A node is reversed. Next pass.', 'ok')
      } else say(`${REV.find((r) => r.id === id).code}  done.`, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, Math.floor(i / 4), false)
      say(wrongWhy(id, want), 'bad')
      if (d <= 0) finish(false, 0, 'Save curr.next first, then redirect curr.next to prev, then advance prev and curr.', Math.floor(i / 4), b)
    }
  }
  const name = (x) => (x === -1 ? 'null' : run.vals[x])
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <ListSvg vals={run.vals} st={st} />
        <div className="statrow" style={{ margin: '8px 0' }}>
          <span>prev <b>{name(st.prev)}</b></span>
          <span>curr <b>{name(st.curr)}</b></span>
          <span>next <b>{st.nxt === null ? '-' : name(st.nxt)}</b></span>
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        {!done && !over && (
          <div className="row" style={{ marginTop: 8 }} role="group" aria-label="Choose the next statement">
            {orders[i].map((s) => <button key={s.id} className="btn mono" onClick={() => pick(s.id)}>{s.code}</button>)}
            <HintButton onHint={() => hint('Think about what would be lost: save curr.next before you change it, and only move curr after you have saved where to go.')} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

const wrongWhy = (id, want) => {
  if (want === 'next') return 'Too early. Before changing curr.next you must remember what it points to: next = curr.next.'
  if (want === 'point') return 'Not yet. The next pointer is saved, so now redirect it: curr.next = prev.'
  if (want === 'prev') return 'Not yet. The pointer is flipped, so now move prev forward: prev = curr.'
  return id === 'next' ? 'next is already saved. Finish the pass: curr = next.' : 'Not yet. The last statement of each pass is curr = next.'
}

function ListSvg({ vals, st }) {
  const n = vals.length
  const W = n * 100 + 50
  const X = (i) => 20 + i * 100
  const tags = (i) => [st.prev === i && 'prev', st.curr === i && 'curr', st.nxt === i && 'next'].filter(Boolean).join(' ')
  return (
    <svg viewBox={`0 0 ${W} 150`} className="listsvg" role="img" aria-label={`Linked list ${vals.map((v, i) => `${v} points to ${st.links[i] === -1 ? 'null' : vals[st.links[i]]}`).join(', ')}`}>
      <defs>
        <marker id="ah" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="var(--torch)" /></marker>
      </defs>
      {vals.map((v, i) => (
        <g key={i}>
          <rect x={X(i)} y="40" width="60" height="36" rx="4" className={`lbox ${tags(i) ? 'hot' : ''}`} />
          <text x={X(i) + 30} y="63" textAnchor="middle" className="ltext">{v}</text>
          <text x={X(i) + 30} y="28" textAnchor="middle" className="ltag">{tags(i)}</text>
        </g>
      ))}
      {vals.map((_, i) => {
        const j = st.links[i]
        if (j === -1) return (<g key={`a${i}`}><line x1={X(i) + 60} y1="58" x2={X(i) + 86} y2="58" className="larrow" markerEnd="url(#ah)" /><text x={X(i) + 70} y="52" className="ltag" textAnchor="middle">null</text></g>)
        if (j > i) return <line key={`a${i}`} x1={X(i) + 60} y1="58" x2={X(j) - 2} y2="58" className="larrow" markerEnd="url(#ah)" />
        return <path key={`a${i}`} d={`M ${X(i) + 30} 76 Q ${(X(i) + X(j)) / 2 + 30} 130 ${X(j) + 30} 78`} className="larrow" fill="none" markerEnd="url(#ah)" />
      })}
    </svg>
  )
}

/* ---------- Delete and insert ---------- */

function EditPlay({ kind, again }) {
  const tasks = useMemo(() => Array.from({ length: 5 }, () => (kind === 'delete' ? deleteTask(5) : insertTask(4))), [kind])
  const [k, setK] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('list', tasks.length, 4,
    kind === 'delete' ? 'Click the pointer that must change to remove the target node: "head" or the node just before it.' : 'Click the gap where the new value belongs to keep the list sorted.')
  const t = tasks[Math.min(k, tasks.length - 1)]

  const guess = (g) => {
    if (over) return
    const right = kind === 'delete' ? g === t.answer : g === t.gap
    if (right) {
      const n = k + 1
      laneSet(lane.dist, n, true)
      if (n >= tasks.length) return finish(true, starsBad(bad), kind === 'delete' ? 'To delete a node, rewire the node BEFORE it: prev.next = prev.next.next. Deleting the first node changes the head pointer instead.' : 'To insert, walk to the last node smaller than the new value, then set new.next = prev.next and prev.next = new. Do the two links in that order.', n, bad)
      setK(n)
      say(kind === 'delete' ? 'Pointer rewired, node gone.' : 'Inserted in order.', 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, k, false)
      say(kind === 'delete' ? (t.target === 0 ? 'That is not it. The first node has no node before it, so the head pointer changes.' : `Not that one. To remove ${t.vals[t.target]} you change the pointer of the node just before it.`) : `Not there. ${t.v} goes after every smaller value and before every larger one.`, 'bad')
      if (d <= 0) finish(false, 0, 'Deleting rewires the previous node; inserting finds the last smaller value first.', k, b)
    }
  }
  const hintText = kind === 'delete' ? 'The node you want to delete is skipped by the node before it, so that earlier node is the one to click.' : `Find the last value smaller than ${t.v}. The new node goes right after it.`

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <p style={{ margin: '0 0 10px' }}>
          {kind === 'delete' ? <>Delete the node with value <b className="big">{t.vals[t.target]}</b></> : <>Insert <b className="big">{t.v}</b> into the sorted list</>}
        </p>
        <div className="lrow" role="group" aria-label={kind === 'delete' ? 'List nodes' : 'List with insert positions'}>
          {kind === 'delete' && <button className="lnode head" onClick={() => guess(-1)} disabled={over} aria-label="Head pointer">head</button>}
          {t.vals.map((v, i) => (
            <span key={`${k}-${i}`} className="lcell">
              {kind === 'insert' && <button className="lgap" onClick={() => guess(i)} disabled={over} aria-label={`Insert before ${v}`}>+</button>}
              {kind === 'delete'
                ? <button className="lnode" onClick={() => guess(i)} disabled={over} aria-label={`Node ${v}`}>{v}</button>
                : <span className="lnode static">{v}</span>}
              <span className="larr" aria-hidden="true">→</span>
            </span>
          ))}
          {kind === 'insert' && <button className="lgap" onClick={() => guess(t.vals.length)} disabled={over} aria-label="Insert at the end">+</button>}
          <span className="lnode static null">null</span>
        </div>
        <div className={`msg ${msg.c}`} style={{ marginTop: 10 }}>{msg.t}</div>
        <div className="row" style={{ marginTop: 8 }}><HintButton disabled={over} onHint={() => hint(hintText)} /></div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
