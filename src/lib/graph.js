export const POS = { S: [50, 160], A: [160, 70], B: [160, 250], C: [290, 70], D: [290, 250], E: [430, 90], F: [430, 230], T: [590, 160] }
export const NODES = Object.keys(POS)
export const EDGES = [['S', 'A'], ['S', 'B'], ['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['C', 'E'], ['D', 'F'], ['E', 'F'], ['E', 'T'], ['F', 'T']]
export const ADJ = {}
NODES.forEach((n) => (ADJ[n] = []))
EDGES.forEach(([a, b]) => {
  ADJ[a].push(b)
  ADJ[b].push(a)
})
NODES.forEach((n) => ADJ[n].sort())
export const ek = (a, b) => [a, b].sort().join('')

// Each sim returns the visit order plus the queue / call stack after each visit.
export function bfsSim() {
  const order = []
  const snaps = []
  const q = ['S']
  const seen = new Set(['S'])
  while (q.length) {
    const u = q.shift()
    order.push(u)
    ADJ[u].forEach((v) => {
      if (!seen.has(v)) {
        seen.add(v)
        q.push(v)
      }
    })
    snaps.push(q.slice())
  }
  return { order, snaps }
}

export function dfsSim() {
  const order = []
  const snaps = []
  const seen = new Set()
  const path = []
  ;(function go(u) {
    seen.add(u)
    path.push(u)
    order.push(u)
    snaps.push(path.slice())
    ADJ[u].forEach((v) => {
      if (!seen.has(v)) go(v)
    })
    path.pop()
  })('S')
  return { order, snaps }
}

export function dijkSim(w) {
  const dist = {}
  const prev = {}
  const settled = new Set()
  const frames = []
  NODES.forEach((n) => (dist[n] = Infinity))
  dist.S = 0
  while (settled.size < NODES.length) {
    let u = null
    NODES.forEach((n) => {
      if (!settled.has(n) && dist[n] < Infinity && (u === null || dist[n] < dist[u] || (dist[n] === dist[u] && n < u))) u = n
    })
    settled.add(u)
    ADJ[u].forEach((v) => {
      if (!settled.has(v)) {
        const nd = dist[u] + w[ek(u, v)]
        if (nd < dist[v]) {
          dist[v] = nd
          prev[v] = u
        }
      }
    })
    frames.push({ u, dist: { ...dist }, prev: { ...prev }, settled: [...settled] })
  }
  return frames
}
