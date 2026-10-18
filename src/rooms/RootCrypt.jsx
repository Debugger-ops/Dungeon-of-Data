import { useMemo, useRef, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import TreeSvg from '../components/TreeSvg'
import { useRound } from '../hooks'
import { bstInsert, mk, pathText, traverse, treeLayout } from '../lib/tree'
import { rand, starsBad, uniq } from '../lib/util'

export default function RootCrypt() {
  const [round, setRound] = useState(0)
  const [kind, setKind] = useState(() => ['pre', 'in', 'post'][rand(0, 2)])
  const again = () => setRound((r) => r + 1)
  return (
    <Room
      title="Root Crypt"
      lede="Trees branch below the keep. Place runes in a binary search tree, walk it in the right order, and sift values through a min-heap."
      modes={[['bst', 'Insert into BST'], ['trav', 'Traversals'], ['heap', 'Min-heap'], ['ext', 'Heap extract-min']]}
    >
      {(mode) =>
        mode === 'bst' ? <Bst key={`b${round}`} again={again} /> : mode === 'trav' ? <Traversal key={`t${kind}${round}`} kind={kind} setKind={setKind} again={again} /> : mode === 'heap' ? <Heap key={`h${round}`} again={again} /> : <HeapExtract key={`x${round}`} again={again} />
      }
    </Room>
  )
}

function Bst({ again }) {
  const vals = useMemo(() => uniq(7, 5, 95), [])
  const rootRef = useRef(null)
  if (!rootRef.current) rootRef.current = mk(vals[0])
  const root = rootRef.current
  const [i, setI] = useState(1)
  const [ok, setOk] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, end, over, finish } = useRound('crypt', 6, 4, `Where does ${vals[1]} go?`)

  const onGhost = (parent, side) => {
    if (over) return
    const v = vals[i]
    const pt = pathText(root, v)
    if (parent.id === pt.parent.id && side === pt.side) {
      bstInsert(root, v)
      const ni = i + 1
      const k = ok + 1
      setI(ni)
      setOk(k)
      laneSet(lane.dist, k, true)
      if (ni >= vals.length) finish(true, starsBad(bad), 'Each insert walks one root-to-leaf path: O(height), which is O(log n) when the tree stays balanced.', k, bad)
      else say(`Correct: ${pt.parts.join(', ')}, empty slot. Next: ${vals[ni]}.`, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, ok, false)
      say(`Not there. Walk from the root: ${pt.parts.join(', ')}.`, 'bad')
      if (d <= 0) finish(false, 0, 'At every node compare once and descend: left if smaller, right if larger.', ok, b)
    }
  }

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="statrow">
          <span>Next rune <span className="big">{i < vals.length ? vals[i] : 'done'}</span></span>
          <span>Placed <b>{Math.min(i, 7)}</b>/7</span>
        </div>
        <p className="lede" style={{ marginBottom: 6 }}>Tap the dashed slot where this value belongs in the binary search tree. Smaller goes left, bigger goes right.</p>
        <TreeSvg root={root} ghosts={!over} onGhost={onGhost} />
        <div className={`msg ${msg.c}`}>{msg.t}</div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

const ORDERS = { pre: 'Preorder: node, left, right', in: 'Inorder: left, node, right', post: 'Postorder: left, right, node' }

function Traversal({ kind, setKind, again }) {
  // Keep trees shallow so the drawing stays readable.
  const root = useMemo(() => {
    let r
    let tries = 0
    do {
      r = null
      uniq(7, 5, 95).forEach((v) => (r = bstInsert(r, v)))
      tries++
    } while (treeLayout(r, false).H > 30 + 3 * 56 + 34 && tries < 60)
    return r
  }, [])
  const seq = useMemo(() => traverse(root, kind), [root, kind])
  const [k, setK] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, end, over, finish } = useRound('crypt', 7, 4)
  const roles = new Map(seq.slice(0, k).map((n) => [n, 'done']))

  const onNode = (n) => {
    if (over || roles.has(n)) return
    if (n === seq[k]) {
      const nk = k + 1
      setK(nk)
      laneSet(lane.dist, nk, true)
      say(`Visited ${n.v}.`, 'ok')
      if (nk >= seq.length) {
        const lesson = kind === 'in' ? 'Inorder on a binary search tree prints the values in sorted order.' : kind === 'pre' ? 'Preorder visits a node before its children, which is how you copy a tree.' : 'Postorder visits children first, which is how you delete a tree safely.'
        finish(true, starsBad(bad), lesson, nk, bad)
      }
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, k, false)
      say(`Not that one. ${ORDERS[kind]}.`, 'bad')
      if (d <= 0) finish(false, 0, `${ORDERS[kind]}. Apply the rule recursively on each subtree.`, k, b)
    }
  }

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="big">{ORDERS[kind]}</span>
          <div className="chips">
            {['pre', 'in', 'post'].map((x) => (
              <button key={x} className={`opt ${x === kind ? 'on' : ''}`} onClick={() => setKind(x)}>{x}order</button>
            ))}
          </div>
        </div>
        <p className="lede" style={{ margin: '6px 0' }}>Tap the nodes in the order that traversal would visit them.</p>
        <TreeSvg root={root} ghosts={false} roles={roles} pick={!over} onNode={onNode} />
        <div className="chipseq">{seq.slice(0, k).map((n) => <span key={n.id}>{n.v}</span>)}</div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

function HeapSvg({ heap, cur }) {
  const W = 640
  const pos = (i) => {
    const L = Math.floor(Math.log2(i + 1))
    const p = i + 1 - Math.pow(2, L)
    return [((p + 0.5) / Math.pow(2, L)) * W, 30 + L * 56]
  }
  const lv = Math.floor(Math.log2(heap.length))
  return (
    <svg className="svgbox tree" viewBox={`0 0 ${W} ${30 + lv * 56 + 34}`}>
      {heap.map((_, i) => {
        if (i === 0) return null
        const [a, b] = pos((i - 1) >> 1)
        const [c, d] = pos(i)
        return <line key={`e${i}`} className="e" x1={a} y1={b} x2={c} y2={d} />
      })}
      {heap.map((v, i) => {
        const [x, y] = pos(i)
        return (
          <g key={i} className={`n ${i === cur ? 'cur' : ''}`}>
            <circle cx={x} cy={y} r="17" />
            <text x={x} y={y} dy=".35em">{v}</text>
          </g>
        )
      })}
    </svg>
  )
}

function Heap({ again }) {
  const start = useMemo(() => {
    const h = []
    const push = (v) => {
      h.push(v)
      let i = h.length - 1
      while (i > 0) {
        const p = (i - 1) >> 1
        if (h[p] > h[i]) {
          ;[h[p], h[i]] = [h[i], h[p]]
          i = p
        } else break
      }
    }
    const base = uniq(8, 3, 90)
    base.slice(0, 5).forEach(push)
    return { heap: h, incoming: base.slice(5) }
  }, [])
  const { incoming } = start
  const [heap, setHeap] = useState(() => [...start.heap, incoming[0]])
  const [cur, setCur] = useState(start.heap.length)
  const [ins, setIns] = useState(1)
  const [ok, setOk] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, end, over, finish } = useRound('crypt', 3, 4, `${incoming[0]} was appended at index ${start.heap.length}. Does it need to move up?`)

  const settled = (h) => {
    const k = ok + 1
    setOk(k)
    laneSet(lane.dist, k, true)
    if (ins >= incoming.length) {
      setCur(-1)
      finish(true, starsBad(bad), 'Insert appends at the end, then sifts up: at most log₂ n swaps. Min-heaps keep the smallest item at index 0, so peeking is O(1).', k, bad)
    } else {
      const nh = [...h, incoming[ins]]
      setHeap(nh)
      setCur(nh.length - 1)
      setIns(ins + 1)
      say(`${incoming[ins]} was appended at index ${nh.length - 1}. Does it need to move up?`)
    }
  }
  const wrong = (t) => {
    const b = bad + 1
    const d = lane.dist - 1
    setBad(b)
    laneSet(d, ok, false)
    say(t, 'bad')
    if (d <= 0) finish(false, 0, 'Swap up only while the child is smaller than its parent.', ok, b)
  }
  const up = () => {
    if (over || cur < 0) return
    const p = (cur - 1) >> 1
    if (cur > 0 && heap[cur] < heap[p]) {
      const h = [...heap]
      ;[h[cur], h[p]] = [h[p], h[cur]]
      setHeap(h)
      setCur(p)
      say('Swapped up.', 'ok')
      if (p === 0) settled(h)
    } else wrong(cur === 0 ? 'It is already the root.' : `${heap[cur]} is not smaller than its parent ${heap[p]}, so swapping would break the heap.`)
  }
  const settle = () => {
    if (over || cur < 0) return
    const p = (cur - 1) >> 1
    if (cur === 0 || heap[cur] >= heap[p]) settled(heap)
    else wrong(`${heap[cur]} is smaller than its parent ${heap[p]}. It still has to move up.`)
  }
  const disabled = over || cur < 0

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="statrow">
          <span>Min-heap: every parent is smaller than its children.</span>
          <span>Incoming <b>{ins < incoming.length ? incoming.slice(ins).join(', ') : 'none'}</b></span>
        </div>
        <HeapSvg heap={heap} cur={cur} />
        <div className="cells" style={{ margin: '8px 0' }}>
          {heap.map((v, i) => <div key={i} className={i === cur ? 'cur' : ''}><small>{i}</small>{v}</div>)}
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn" disabled={disabled} onClick={up}>Swap up with parent</button>
          <button className="btn primary" disabled={disabled} onClick={settle}>Settle here</button>
        </div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

// Remove the root, move the last item to the top, and let the player sift it down.
function takeRoot(h) {
  const nh = [...h]
  const root = nh[0]
  const last = nh.pop()
  if (nh.length) nh[0] = last
  return { nh, root }
}

function HeapExtract({ again }) {
  const first = useMemo(() => {
    const h = []
    uniq(8, 3, 90).forEach((v) => {
      h.push(v)
      let i = h.length - 1
      while (i > 0) {
        const p = (i - 1) >> 1
        if (h[p] > h[i]) {
          ;[h[p], h[i]] = [h[i], h[p]]
          i = p
        } else break
      }
    })
    return takeRoot(h)
  }, [])
  const [heap, setHeap] = useState(first.nh)
  const [out, setOut] = useState([first.root])
  const [cur, setCur] = useState(0)
  const [done, setDone] = useState(0)
  const [bad, setBad] = useState(0)
  const rounds = 2
  const { lane, laneSet, msg, say, end, over, finish } = useRound('crypt', rounds, 4, `extract-min returned ${first.root}. The last item moved to the root, so sift it down: swap with the smaller child while it is larger.`)

  const settled = (h) => {
    const k = done + 1
    setDone(k)
    laneSet(lane.dist, k, true)
    if (k >= rounds) {
      setCur(-1)
      return finish(true, starsBad(bad), 'Extract-min removes the root, moves the last item to the top, then sifts down by swapping with the smaller child: at most log₂ n swaps, so O(log n). Doing it n times is heap sort.', k, bad)
    }
    const { nh, root } = takeRoot(h)
    setHeap(nh)
    setOut((o) => [...o, root])
    setCur(0)
    say(`Second extract-min returned ${root}. Sift the new root down.`, 'ok')
  }
  const wrong = (t) => {
    const b = bad + 1
    const d = lane.dist - 1
    setBad(b)
    laneSet(d, done, false)
    say(t, 'bad')
    if (d <= 0) finish(false, 0, 'Sift down: swap with the smaller child while the item is larger than it. Picking the larger child would break the heap.', done, b)
  }
  const down = (side) => {
    if (over || cur < 0) return
    const c = 2 * cur + 1 + side
    if (c >= heap.length) return wrong(`Index ${cur} has no ${side ? 'right' : 'left'} child.`)
    const sib = side ? c - 1 : c + 1
    if (sib < heap.length && heap[sib] < heap[c]) return wrong(`The other child ${heap[sib]} is smaller than ${heap[c]}. Swap with the smaller child, or the new parent would be larger than a child.`)
    if (heap[c] >= heap[cur]) return wrong(`${heap[c]} is not smaller than ${heap[cur]}, so there is nothing to fix on that side.`)
    const h = [...heap]
    ;[h[cur], h[c]] = [h[c], h[cur]]
    setHeap(h)
    setCur(c)
    say('Swapped down with the smaller child.', 'ok')
    if (2 * c + 1 >= h.length) settled(h)
  }
  const settle = () => {
    if (over || cur < 0) return
    const kids = [2 * cur + 1, 2 * cur + 2].filter((x) => x < heap.length)
    const m = kids.length ? Math.min(...kids.map((x) => heap[x])) : Infinity
    if (heap[cur] <= m) settled(heap)
    else wrong(`A child (${m}) is smaller than ${heap[cur]}. It still has to move down.`)
  }
  const disabled = over || cur < 0

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="statrow">
          <span>Extracted so far <b>{out.join(', ')}</b></span>
          <span>Extractions left to repair <b>{rounds - done}</b></span>
        </div>
        <HeapSvg heap={heap} cur={cur} />
        <div className="cells" style={{ margin: '8px 0' }}>
          {heap.map((v, i) => <div key={i} className={i === cur ? 'cur' : ''}><small>{i}</small>{v}</div>)}
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn" disabled={disabled} onClick={() => down(0)}>Swap with left child</button>
          <button className="btn" disabled={disabled} onClick={() => down(1)}>Swap with right child</button>
          <button className="btn primary" disabled={disabled} onClick={settle}>Settle here</button>
        </div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
