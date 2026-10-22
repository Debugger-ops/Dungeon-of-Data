import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { dijkstraBest, dijkstraDone, dijkstraInit, dijkstraPick, genGraph, kruskalRun } from '../lib/wgraph'
import { starsBad } from '../lib/util'

export default function GraphBuilder() {
  const [round, setRound] = useState(0)
  const again = () => setRound((r) => r + 1)
  return (
    <Room
      title="Graph Builder"
      lede="Weighted graphs are roads with tolls. Grow a shortest-path tree with Dijkstra, or lay the cheapest network with Kruskal, one greedy choice at a time."
      modes={[['dijkstra', 'Shortest paths (Dijkstra)'], ['kruskal', 'Cheapest network (Kruskal)']]}
    >
      {(mode) => (mode === 'dijkstra' ? <DijkstraPlay key={`d${round}`} again={again} /> : <KruskalPlay key={`k${round}`} again={again} />)}
    </Room>
  )
}

const mid = (g, e) => ({ x: (g.nodes[e.a].x + g.nodes[e.b].x) / 2, y: (g.nodes[e.a].y + g.nodes[e.b].y) / 2 })

function Graph({ g, nodeCls = () => '', edgeCls = () => '', onNode, label = () => '' }) {
  return (
    <svg viewBox="0 0 340 290" className="wgraph" role="img" aria-label={`Weighted graph with ${g.n} nodes: ${g.edges.map((e) => `${g.nodes[e.a].name} to ${g.nodes[e.b].name} weight ${e.w}`).join(', ')}`}>
      {g.edges.map((e) => (
        <line key={e.id} x1={g.nodes[e.a].x} y1={g.nodes[e.a].y} x2={g.nodes[e.b].x} y2={g.nodes[e.b].y} className={`we ${edgeCls(e)}`} />
      ))}
      {g.edges.map((e) => {
        const m = mid(g, e)
        return (
          <g key={`w${e.id}`} className={`ew ${edgeCls(e)}`}>
            <rect x={m.x - 10} y={m.y - 9} width="20" height="18" rx="4" />
            <text x={m.x} y={m.y + 4} textAnchor="middle">{e.w}</text>
          </g>
        )
      })}
      {g.nodes.map((n) => (
        <g key={n.id} className={`wn ${nodeCls(n)}`} onClick={onNode ? () => onNode(n.id) : undefined} style={onNode ? { cursor: 'pointer' } : undefined}>
          <circle cx={n.x} cy={n.y} r="17" />
          <text x={n.x} y={n.y + 5} textAnchor="middle">{n.name}</text>
          <text x={n.x} y={n.y - 22} textAnchor="middle" className="nl">{label(n)}</text>
        </g>
      ))}
    </svg>
  )
}

function DijkstraPlay({ again }) {
  const g = useMemo(() => genGraph(6), [])
  const [s, setS] = useState(() => dijkstraInit(g))
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('graphb', g.n, 4, 'Start at A. Repeatedly finalize the unfinished node with the smallest tentative distance, then update its neighbours.')
  const fmt = (d) => (d === Infinity ? '∞' : d)

  const pick = (id) => {
    if (over || dijkstraDone(s)) return
    const r = dijkstraPick(g, s, id)
    if (r.ok) {
      const n = r.state.order.length
      setS(r.state)
      laneSet(lane.dist, n, true)
      if (dijkstraDone(r.state)) return finish(true, starsBad(bad), `Final distances from A: ${g.nodes.map((x) => `${x.name}=${fmt(r.state.dist[x.id])}`).join(', ')}. Dijkstra always finalizes the closest unfinished node, so its distance can never improve later (with non-negative weights).`, n, bad)
      say(`${g.nodes[id].name} is final at distance ${s.dist[id]}. Neighbours updated.`, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, s.order.length, false)
      const best = dijkstraBest(s)
      say(s.done[id] ? `${g.nodes[id].name} is already final.` : s.dist[id] === Infinity ? `${g.nodes[id].name} has not been reached yet (distance ∞).` : `${g.nodes[id].name} (${s.dist[id]}) is not the closest. The smallest unfinished distance is ${best}.`, 'bad')
      if (d <= 0) finish(false, 0, 'Always pick the unfinished node with the smallest tentative distance.', s.order.length, b)
    }
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <Graph g={g} nodeCls={(n) => (s.done[n.id] ? 'done' : '')} label={(n) => `${fmt(s.dist[n.id])}`} onNode={pick} />
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        {!over && (
          <div className="row" style={{ marginTop: 8 }} role="group" aria-label="Finalize a node">
            {g.nodes.map((n) => <button key={n.id} className="btn optbtn" disabled={s.done[n.id]} onClick={() => pick(n.id)}>Finalize {n.name}</button>)}
            <HintButton onHint={() => hint(`Look at the numbers above the unfinished nodes. The smallest finite one is ${dijkstraBest(s)}.`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

function KruskalPlay({ again }) {
  const g = useMemo(() => genGraph(6), [])
  const run = useMemo(() => kruskalRun(g), [g])
  const [i, setI] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('graphb', run.length, 4, 'Edges are tried from cheapest to dearest. Take an edge unless it joins two nodes that are already connected.')
  const cur = run[Math.min(i, run.length - 1)]
  const status = (e) => {
    const k = run.findIndex((r) => r.e.id === e.id)
    return k < i ? run[k].action : k === i && !over ? 'cur' : ''
  }
  const act = (a) => {
    if (over) return
    if (a === cur.action) {
      const n = i + 1
      setI(n)
      laneSet(lane.dist, n, true)
      if (n >= run.length) {
        const total = run.filter((r) => r.action === 'take').reduce((t, r) => t + r.e.w, 0)
        return finish(true, starsBad(bad), `Minimum spanning tree weight: ${total}. Kruskal sorts the edges and uses union-find to skip any edge that would create a cycle.`, n, bad)
      }
      say(cur.why, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, i, false)
      say(`Not ${a}. ${cur.why}`, 'bad')
      if (d <= 0) finish(false, 0, 'Take an edge only if its endpoints are in different groups; otherwise it forms a cycle.', i, b)
    }
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <Graph g={g} edgeCls={status} />
        <div className="statrow" style={{ margin: '8px 0' }}>
          <span>Edge <b>{g.nodes[cur.e.a].name}-{g.nodes[cur.e.b].name}</b> weight <b>{cur.e.w}</b></span>
          <span>Network edges <b>{run.slice(0, i).filter((r) => r.action === 'take').length}/{g.n - 1}</b></span>
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        {!over && (
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn primary" onClick={() => act('take')}>Take edge</button>
            <button className="btn" onClick={() => act('skip')}>Skip edge</button>
            <HintButton onHint={() => hint(`Follow the green edges already taken: are ${g.nodes[cur.e.a].name} and ${g.nodes[cur.e.b].name} already connected through them?`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
