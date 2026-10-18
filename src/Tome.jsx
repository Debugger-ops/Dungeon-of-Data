import { useState } from 'react'
import { ALGOS } from './lib/algos'
import { useProgress } from './progress'

const F = [
  ['O(1)', () => 1, '--ok', 'array index'],
  ['O(log n)', (n) => Math.log2(n), '--arc', 'binary search'],
  ['O(n)', (n) => n, '--torch', 'linear scan'],
  ['O(n log n)', (n) => n * Math.log2(n), '--vio', 'merge sort'],
  ['O(n²)', (n) => n * n, '--bad', 'bubble sort'],
  ['O(2ⁿ)', (n) => Math.pow(2, n), '--mut', 'all subsets'],
]

const fmt = (x) => (Number.isInteger(x) ? x.toLocaleString() : x.toFixed(2))
const time = (s) =>
  s < 1e-6 ? `${(s * 1e9).toFixed(s * 1e9 < 10 ? 1 : 0)} ns`
  : s < 1e-3 ? `${(s * 1e6).toFixed(1)} µs`
  : s < 1 ? `${(s * 1e3).toFixed(1)} ms`
  : s < 60 ? `${s.toFixed(1)} s`
  : s < 3600 ? `${(s / 60).toFixed(1)} min`
  : s < 86400 ? `${(s / 3600).toFixed(1)} h`
  : s < 3.15e7 ? `${(s / 86400).toFixed(1)} days`
  : `${(s / 3.156e7).toLocaleString(undefined, { maximumFractionDigits: 0 })} years`

function GrowthChart({ cur }) {
  const W = 640, H = 320, L = 56, R = 16, Tp = 12, B = 36, YM = 6, N = 64
  const pw = W - L - R
  const ph = H - Tp - B
  const X = (n) => L + ((n - 1) / (N - 1)) * pw
  const Y = (v) => Tp + ph - (Math.min(Math.log10(Math.max(v, 1)), YM) / YM) * ph
  return (
    <svg className="svgbox" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Growth rate chart">
      {['1', '10', '100', '1K', '10K', '100K', '1M'].map((t, i) => {
        const y = Tp + ph - (i / YM) * ph
        return (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y} y2={y} stroke="var(--line)" />
            <text x={L - 8} y={y + 4} fill="var(--mut)" fontSize="11" textAnchor="end">{t}</text>
          </g>
        )
      })}
      {[1, 8, 16, 24, 32, 40, 48, 56, 64].map((n) => (
        <text key={n} x={X(n)} y={H - 16} fill="var(--mut)" fontSize="11" textAnchor="middle">{n}</text>
      ))}
      <text x={L + pw / 2} y={H - 1} fill="var(--mut)" fontSize="11" textAnchor="middle">input size n</text>
      <text x="12" y={Tp + ph / 2} fill="var(--mut)" fontSize="11" textAnchor="middle" transform={`rotate(-90 12 ${Tp + ph / 2})`}>operations (log scale)</text>
      {F.map((f) => {
        const pts = []
        for (let n = 1; n <= N; n++) {
          const v = f[1](n)
          pts.push(`${X(n)},${Y(v)}`)
          if (v > 1e6) break
        }
        return <polyline key={f[0]} points={pts.join(' ')} fill="none" style={{ stroke: `var(${f[2]})` }} strokeWidth="2.5" strokeLinejoin="round" />
      })}
      <line x1={X(cur)} x2={X(cur)} y1={Tp} y2={Tp + ph} stroke="var(--fg)" strokeDasharray="4 4" opacity=".6" />
      {F.map((f) => {
        const v = f[1](cur)
        return v <= 1e6 ? <circle key={f[0]} cx={X(cur)} cy={Y(v)} r="4" style={{ fill: `var(${f[2]})` }} stroke="var(--bg)" strokeWidth="1.5" /> : null
      })}
    </svg>
  )
}

const Mono = ({ children }) => <td className="mono">{children}</td>

export default function Tome() {
  const { go } = useProgress()
  const [n, setN] = useState(16)
  return (
    <>
      <div className="roomhead">
        <div>
          <h2>The Tome of Growth</h2>
          <p className="lede">How the cost of each spell scales with input size n. Drag the slider to read exact operation counts. The y axis is logarithmic.</p>
        </div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      <div className="card">
        <div className="ctrl">
          <label htmlFor="nn">n = <b className="big">{n}</b></label>
          <input id="nn" type="range" min="2" max="64" value={n} onChange={(e) => setN(+e.target.value)} style={{ maxWidth: 360 }} />
        </div>
        <div style={{ marginTop: 8 }}><GrowthChart cur={n} /></div>
        <div className="legend">{F.map((f) => <span key={f[0]}><i style={{ background: `var(${f[2]})` }} />{f[0]}</span>)}</div>
      </div>
      <div className="card">
        <h3>Cost at this n</h3>
        <div className="scroll">
          <table>
            <thead><tr><th>Growth</th><th className="num">Operations</th><th className="num">Time at 10⁹ ops/s</th><th>Typical example</th></tr></thead>
            <tbody>
              {F.map((f) => {
                let ops, sec
                if (f[0] === 'O(2ⁿ)') {
                  const b = 2n ** BigInt(n)
                  ops = b.toLocaleString()
                  sec = Number(b) / 1e9
                } else {
                  const v = f[1](n)
                  ops = fmt(v)
                  sec = v / 1e9
                }
                return (
                  <tr key={f[0]}>
                    <td className="mono" style={{ color: `var(${f[2]})` }}>{f[0]}</td>
                    <td className="num">{ops}</td>
                    <td className="num">{time(sec)}</td>
                    <td>{f[3]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Data structures</h3>
          <div className="scroll">
            <table>
              <thead><tr><th>Structure</th><th>Access</th><th>Search</th><th>Insert</th><th>Delete</th></tr></thead>
              <tbody>
                {[
                  ['Array', 'O(1)', 'O(n)', 'O(n)', 'O(n)'],
                  ['Linked list', 'O(n)', 'O(n)', 'O(1) at head', 'O(1) given node'],
                  ['Stack / queue', 'O(n)', 'O(n)', 'O(1)', 'O(1)'],
                  ['BST (balanced)', '-', 'O(log n)', 'O(log n)', 'O(log n)'],
                  ['BST (skewed)', '-', 'O(n)', 'O(n)', 'O(n)'],
                  ['Min-heap', 'peek O(1)', 'O(n)', 'O(log n)', 'extract O(log n)'],
                  ['Hash table (avg)', '-', 'O(1)', 'O(1)', 'O(1)'],
                ].map((r) => (
                  <tr key={r[0]}><td>{r[0]}</td>{r.slice(1).map((c, i) => <Mono key={i}>{c}</Mono>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Sorting</h3>
          <div className="scroll">
            <table>
              <thead><tr><th>Sort</th><th>Best</th><th>Avg</th><th>Worst</th><th>Space</th><th>Stable</th></tr></thead>
              <tbody>
                {Object.values(ALGOS).map((a) => (
                  <tr key={a.n}><td>{a.n}</td>{a.cx.map((c, i) => <Mono key={i}>{c}</Mono>)}</tr>
                ))}
                <tr><td>Heap</td><Mono>O(n log n)</Mono><Mono>O(n log n)</Mono><Mono>O(n log n)</Mono><Mono>O(1)</Mono><Mono>no</Mono></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="card">
        <h3>Graph algorithms</h3>
        <div className="scroll">
          <table>
            <thead><tr><th>Algorithm</th><th>Time</th><th>Space</th><th>Use</th></tr></thead>
            <tbody>
              {[
                ['BFS', 'O(V+E)', 'O(V)', 'Fewest edges in unweighted graphs, level order'],
                ['DFS', 'O(V+E)', 'O(V)', 'Cycle detection, topological sort, components'],
                ['Dijkstra (binary heap)', 'O((V+E) log V)', 'O(V)', 'Shortest paths, non-negative weights'],
                ['Bellman-Ford', 'O(V·E)', 'O(V)', 'Shortest paths with negative weights'],
                ['Kruskal / Prim', 'O(E log V)', 'O(V)', 'Minimum spanning tree'],
              ].map((r) => (
                <tr key={r[0]}><td>{r[0]}</td><Mono>{r[1]}</Mono><Mono>{r[2]}</Mono><td>{r[3]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h3>Hash table collision strategies</h3>
        <div className="scroll">
          <table>
            <thead><tr><th>Strategy</th><th>Lookup (avg)</th><th>Lookup (worst)</th><th>Notes</th></tr></thead>
            <tbody>
              {[
                ['Separate chaining', 'O(1 + n/m)', 'O(n)', 'A list per bucket. Never fills up; extra pointer memory'],
                ['Linear probing', 'O(1) below load 0.7', 'O(n)', 'Cache friendly; primary clustering; deletes need tombstones'],
                ['Quadratic probing', 'O(1) below load 0.5', 'O(n)', 'Less clustering; may not reach every slot'],
                ['Double hashing', 'O(1)', 'O(n)', 'Step size from a second hash; least clustering, more computation'],
              ].map((r) => (
                <tr key={r[0]}><td>{r[0]}</td><Mono>{r[1]}</Mono><Mono>{r[2]}</Mono><td>{r[3]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
