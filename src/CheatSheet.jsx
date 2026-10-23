import { useProgress } from './progress'
import { ALGOS } from './lib/algos'
import { CLASSES } from './lib/bigo'

const STRUCTS = [
  ['Array', 'O(1)', 'O(n)', 'O(n)', 'O(n)', 'Contiguous; random access'],
  ['Linked list', 'O(n)', 'O(n)', 'O(1) at head', 'O(1) with pointer', 'Pointer rewiring'],
  ['Stack / Queue', 'O(n)', 'O(n)', 'O(1)', 'O(1)', 'LIFO / FIFO'],
  ['Hash table', 'O(1) avg', 'O(1) avg', 'O(1) avg', 'O(1) avg', 'Worst case O(n)'],
  ['Binary search tree (balanced)', 'O(log n)', 'O(log n)', 'O(log n)', 'O(log n)', 'In-order is sorted'],
  ['Binary heap', 'O(n)', 'O(n)', 'O(log n)', 'O(log n) extract', 'Peek min/max is O(1); build is O(n)'],
  ['Trie', 'O(L)', 'O(L)', 'O(L)', 'O(L)', 'L = word length; prefix queries'],
  ['Union-Find', '~O(1)', '', '~O(1) union', '', 'Path compression + rank'],
]
const GRAPHS = [
  ['BFS / DFS', 'O(V+E)', 'Fewest edges / cycles, components'],
  ['Dijkstra (heap)', 'O((V+E) log V)', 'Shortest paths, non-negative weights'],
  ['Kruskal', 'O(E log V)', 'Minimum spanning tree with Union-Find'],
  ['Topological sort', 'O(V+E)', 'Order a DAG'],
]

export default function CheatSheet() {
  const { go } = useProgress()
  return (
    <div className="cheat">
      <div className="roomhead noprint">
        <div><h2>Cheat Sheet</h2><p className="lede">One page of everything above. Press Print and choose "Save as PDF" to keep a copy.</p></div>
        <div className="row"><button className="btn primary" onClick={() => window.print()}>Print / save PDF</button><button className="btn ghost" onClick={() => go('map')}>← Map</button></div>
      </div>
      <h2 className="printonly">Dungeon of Data: DSA cheat sheet</h2>
      <div className="card">
        <h3>Growth classes (slowest growth first)</h3>
        <p className="fine">{CLASSES.join('  <  ')}</p>
      </div>
      <div className="card">
        <h3>Sorting</h3>
        <div className="scroll" tabIndex={0}><table>
          <thead><tr><th>Sort</th><th>Best</th><th>Average</th><th>Worst</th><th>Space</th><th>Stable</th></tr></thead>
          <tbody>{Object.values(ALGOS).map((a) => <tr key={a.n}><td>{a.n}</td>{a.cx.map((c, i) => <td key={i} className="num">{c}</td>)}</tr>)}</tbody>
        </table></div>
      </div>
      <div className="card">
        <h3>Data structures</h3>
        <div className="scroll" tabIndex={0}><table>
          <thead><tr><th>Structure</th><th>Access</th><th>Search</th><th>Insert</th><th>Delete</th><th>Notes</th></tr></thead>
          <tbody>{STRUCTS.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i && i < 5 ? 'num' : ''}>{c}</td>)}</tr>)}</tbody>
        </table></div>
      </div>
      <div className="card">
        <h3>Graph algorithms</h3>
        <div className="scroll" tabIndex={0}><table>
          <thead><tr><th>Algorithm</th><th>Time</th><th>Use</th></tr></thead>
          <tbody>{GRAPHS.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i === 1 ? 'num' : ''}>{c}</td>)}</tr>)}</tbody>
        </table></div>
      </div>
      <div className="card">
        <h3>Patterns to remember</h3>
        <p className="fine">Sorted + search: binary search. Prefix or window: two pointers, sliding window, trie. Overlapping subproblems: dynamic programming. Try-and-undo: backtracking. Connectivity: Union-Find or BFS. Top-k or priority: heap.</p>
      </div>
    </div>
  )
}
