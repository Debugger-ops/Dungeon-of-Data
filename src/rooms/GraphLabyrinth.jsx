import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import GraphSvg from '../components/GraphSvg'
import { HBars } from '../components/Charts'
import { useRound } from '../hooks'
import { EDGES, NODES, bfsSim, dfsSim, dijkSim, ek } from '../lib/graph'
import { rand, starsBad } from '../lib/util'

export default function GraphLabyrinth() {
  const [round, setRound] = useState(0)
  return (
    <Room title="Graph Labyrinth" lede="Rooms joined by corridors. Explore with BFS and DFS, then race Dijkstra to find the cheapest route from S to T." modes={[['bfs', 'BFS'], ['dfs', 'DFS'], ['dij', 'Dijkstra']]}>
      {(mode) => <Maze key={`${mode}${round}`} mode={mode} again={() => setRound((r) => r + 1)} />}
    </Room>
  )
}

const INTRO = {
  bfs: 'Breadth-first from S: finish a whole layer before going deeper. Visit neighbours in alphabetical order. Tap the next node the queue will release.',
  dfs: 'Depth-first from S: go as deep as possible, then backtrack. Visit neighbours in alphabetical order. Tap the next node visited.',
  dij: 'Dijkstra from S: always settle the unsettled node with the smallest known distance (ties go alphabetical). Edge numbers are costs. Tap the next node to settle.',
}

function Maze({ mode, again }) {
  const trav = mode !== 'dij'
  const w = useMemo(() => {
    if (trav) return null
    const o = {}
    EDGES.forEach(([a, b]) => (o[ek(a, b)] = rand(1, 9)))
    return o
  }, [])
  const sim = useMemo(() => (mode === 'bfs' ? bfsSim() : mode === 'dfs' ? dfsSim() : null), [])
  const frames = useMemo(() => (trav ? null : dijkSim(w)), [])
  const order = trav ? sim.order : frames.map((f) => f.u)
  const total = NODES.length
  const [k, setK] = useState(1)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, end, over, finish } = useRound('maze', total, 4, 'S is visited for free. Which node is next?')

  const visited = order.slice(0, k)
  const roles = {}
  visited.forEach((n) => (roles[n] = 'done'))
  if (trav) sim.snaps[k - 1].forEach((n) => { if (!roles[n]) roles[n] = 'front' })
  else NODES.forEach((n) => { if (!roles[n] && frames[k - 1].dist[n] < Infinity) roles[n] = 'front' })

  let hiEdges = null
  if (!trav && end && end.win) {
    hiEdges = new Set()
    const pv = frames[total - 1].prev
    let c = 'T'
    while (pv[c]) {
      hiEdges.add(ek(c, pv[c]))
      c = pv[c]
    }
  }

  const onNode = (n) => {
    if (over || visited.includes(n)) return
    if (n === order[k]) {
      const nk = k + 1
      setK(nk)
      say(`${n} ${trav ? 'visited' : 'settled'}.`, 'ok')
      if (nk >= total) {
        laneSet(lane.dist, total, true)
        const text = mode === 'bfs' ? 'BFS uses a queue and finds the fewest-edges path in O(V+E).' : mode === 'dfs' ? 'DFS uses a stack (here, the call stack) and runs in O(V+E). It is the base of cycle detection and topological sort.' : `Shortest cost to T is ${frames[total - 1].dist.T}. Dijkstra with a binary heap runs in O((V+E) log V) and needs non-negative edge weights.`
        finish(true, starsBad(bad), text, total - 1, bad)
      } else laneSet(lane.dist, nk - 1, true)
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, k - 1, false)
      say(mode === 'bfs' ? `Not ${n}. A queue releases the node that has waited longest, so finish the current layer first.` : mode === 'dfs' ? `Not ${n}. Go deeper from the node you just visited before backtracking, taking the alphabetically first unvisited neighbour.` : `Not ${n}. Pick the unsettled node with the smallest distance in the table.`, 'bad')
      if (d <= 0) finish(false, 0, 'Re-read the rule: ' + (mode === 'bfs' ? 'first in, first out.' : mode === 'dfs' ? 'deepest first.' : 'smallest known distance first.'), k - 1, b)
    }
  }

  const fr = trav ? null : frames[k - 1]
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="grid2">
        <div className="card">
          <p className="lede" style={{ marginBottom: 6 }}>{INTRO[mode]}</p>
          <GraphSvg roles={roles} w={w} pick={!over} hiEdges={hiEdges} onNode={onNode} />
          <div className={`msg ${msg.c}`}>{msg.t}</div>
        </div>
        <div className="card flat">
          {trav ? (
            <>
              <h3>{mode === 'bfs' ? 'Queue' : 'Call stack'}</h3>
              <div className="tag" style={{ textAlign: 'left', margin: '4px 0' }}>{mode === 'bfs' ? 'front → back' : 'bottom → top (current node last)'}</div>
              <div className="cells" style={{ margin: '6px 0 12px' }}>
                {sim.snaps[k - 1].length ? sim.snaps[k - 1].map((n) => <div key={n}>{n}</div>) : <div>∅</div>}
              </div>
              <h3>Visit order</h3>
              <div className="chipseq" style={{ marginTop: 6 }}>{visited.map((n) => <span key={n}>{n}</span>)}</div>
            </>
          ) : (
            <>
              <h3>Distance table</h3>
              <div className="scroll" tabIndex={0}>
                <table style={{ marginTop: 6 }}>
                  <thead><tr><th>Node</th><th className="num">dist</th><th>via</th><th>state</th></tr></thead>
                  <tbody>
                    {NODES.map((n) => (
                      <tr key={n}>
                        <td className="mono">{n}</td>
                        <td className="num">{fr.dist[n] === Infinity ? '∞' : fr.dist[n]}</td>
                        <td className="mono">{fr.prev[n] || '-'}</td>
                        <td>
                          {visited.includes(n) ? <span style={{ color: 'var(--ok)' }}>settled</span> : fr.dist[n] < Infinity ? <span style={{ color: 'var(--torch)' }}>frontier</span> : <span style={{ color: 'var(--mut)' }}>unseen</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      {!trav && end && end.win && (
        <div className="card">
          <h3>Shortest distance from S</h3>
          <div style={{ marginTop: 8 }}>
            <HBars groups={NODES.map((n) => ({ name: n, v: [frames[total - 1].dist[n]] }))} series={[['dist', 'var(--arc)']]} />
          </div>
        </div>
      )}
      <Result end={end} onAgain={again} />
    </>
  )
}
