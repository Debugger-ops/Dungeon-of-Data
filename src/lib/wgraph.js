import { rand, shuffle } from './util'

// A small connected weighted graph with distinct edge weights (so the minimum spanning tree is unique).
export function genGraph(n = 6) {
  const R = 105
  const nodes = Array.from({ length: n }, (_, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return { id: i, name: String.fromCharCode(65 + i), x: 170 + R * Math.cos(ang), y: 140 + R * Math.sin(ang) }
  })
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`)
  const have = new Set()
  const pairs = []
  const add = (a, b) => {
    if (a === b || have.has(key(a, b))) return false
    have.add(key(a, b))
    pairs.push([Math.min(a, b), Math.max(a, b)])
    return true
  }
  for (let i = 1; i < n; i++) add(i, rand(0, i - 1))
  let extra = 3
  let guard = 0
  while (extra > 0 && guard++ < 100) if (add(rand(0, n - 1), rand(0, n - 1))) extra--
  const w = shuffle(Array.from({ length: pairs.length }, (_, i) => i + 1))
  const edges = pairs.map(([a, b], i) => ({ a, b, w: w[i], id: i }))
  return { n, nodes, edges }
}

// ---- Dijkstra: the player picks the next node to finalize ----
export function dijkstraInit(g, src = 0) {
  const dist = Array(g.n).fill(Infinity)
  dist[src] = 0
  return { dist, done: Array(g.n).fill(false), order: [] }
}
export function dijkstraBest(s) {
  let best = Infinity
  s.dist.forEach((d, i) => {
    if (!s.done[i] && d < best) best = d
  })
  return best
}
// Returns { ok, state }. A pick is right if the node is unfinished and has the smallest tentative distance.
export function dijkstraPick(g, s, node) {
  if (s.done[node] || s.dist[node] === Infinity || s.dist[node] !== dijkstraBest(s)) return { ok: false, state: s }
  const dist = s.dist.slice()
  const done = s.done.slice()
  done[node] = true
  g.edges.forEach((e) => {
    const o = e.a === node ? e.b : e.b === node ? e.a : -1
    if (o >= 0 && !done[o] && dist[node] + e.w < dist[o]) dist[o] = dist[node] + e.w
  })
  return { ok: true, state: { dist, done, order: [...s.order, node] } }
}
export const dijkstraDone = (s) => s.done.every(Boolean)
export function dijkstraRef(g, src = 0) {
  let s = dijkstraInit(g, src)
  while (!dijkstraDone(s)) {
    const pick = s.dist.findIndex((d, i) => !s.done[i] && d === dijkstraBest(s))
    s = dijkstraPick(g, s, pick).state
  }
  return s.dist
}

// ---- Kruskal: edges in weight order, take each one unless it closes a cycle ----
export function kruskalRun(g) {
  const parent = Array.from({ length: g.n }, (_, i) => i)
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])))
  return g.edges
    .slice()
    .sort((x, y) => x.w - y.w)
    .map((e) => {
      const ra = find(e.a)
      const rb = find(e.b)
      if (ra === rb) return { e, action: 'skip', why: `${String.fromCharCode(65 + e.a)} and ${String.fromCharCode(65 + e.b)} are already connected, so this edge would make a cycle.` }
      parent[ra] = rb
      return { e, action: 'take', why: `${String.fromCharCode(65 + e.a)} and ${String.fromCharCode(65 + e.b)} are in different groups, so this is the cheapest way to join them.` }
    })
}
