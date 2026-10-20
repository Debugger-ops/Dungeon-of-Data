import { describe, expect, it } from 'vitest'
import { ADJ, EDGES, NODES, bfsSim, dfsSim } from '../../src/lib/graph'

describe('graph data', () => {
  it('adjacency is symmetric and covers every edge', () => {
    EDGES.forEach(([a, b]) => {
      expect(ADJ[a]).toContain(b)
      expect(ADJ[b]).toContain(a)
    })
  })
})

describe('traversals', () => {
  it('BFS and DFS visit every node once, starting at S', () => {
    for (const sim of [bfsSim(), dfsSim()]) {
      expect(sim.order[0]).toBe('S')
      expect([...sim.order].sort()).toEqual([...NODES].sort())
    }
  })
  it('BFS visits in non-decreasing distance from S', () => {
    const dist = { S: 0 }
    const q = ['S']
    while (q.length) {
      const u = q.shift()
      ADJ[u].forEach((v) => {
        if (dist[v] === undefined) {
          dist[v] = dist[u] + 1
          q.push(v)
        }
      })
    }
    const ds = bfsSim().order.map((n) => dist[n])
    expect(ds).toEqual([...ds].sort((a, b) => a - b))
  })
})
