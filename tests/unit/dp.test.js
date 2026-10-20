import { describe, expect, it } from 'vitest'
import { coinChange, knapsack, lcs, options } from '../../src/lib/dp'

// independent reference implementations
const refCoins = (coins, n) => {
  const dp = [0]
  for (let a = 1; a <= n; a++) dp[a] = 1 + Math.min(...coins.filter((c) => c <= a).map((c) => dp[a - c]))
  return dp
}
const refLcs = (s, t) => {
  const d = Array.from({ length: s.length + 1 }, () => Array(t.length + 1).fill(0))
  for (let i = 1; i <= s.length; i++) for (let j = 1; j <= t.length; j++) d[i][j] = s[i - 1] === t[j - 1] ? d[i - 1][j - 1] + 1 : Math.max(d[i - 1][j], d[i][j - 1])
  return d[s.length][t.length]
}

describe('puzzles', () => {
  it('coin change matches a reference solution', () => {
    for (let k = 0; k < 50; k++) {
      const p = coinChange()
      const coins = p.title.match(/\{(.+)\}/)[1].split(', ').map(Number)
      const want = refCoins(coins, 8)
      p.cells.forEach((c) => expect(c.value).toBe(want[c.c]))
      expect(p.final).toBe(want[8])
    }
  })
  it('LCS matches a reference solution', () => {
    for (let k = 0; k < 50; k++) {
      const p = lcs()
      const [, s, t] = p.title.match(/of (\w+) and (\w+)/)
      expect(p.final).toBe(refLcs(s, t))
      expect(p.final).toBeGreaterThanOrEqual(2)
    }
  })
  it('knapsack never exceeds the sum of values and is monotone in capacity', () => {
    for (let k = 0; k < 50; k++) {
      const p = knapsack()
      const total = p.rowLabels.slice(1).reduce((a, l) => a + Number(l.match(/v(\d+)/)[1]), 0)
      expect(p.final).toBeLessThanOrEqual(total)
      const row3 = p.cells.filter((c) => c.r === 3).sort((a, b) => a.c - b.c).map((c) => c.value)
      expect(row3).toEqual([...row3].sort((a, b) => a - b))
    }
  })
  it('every cell depends only on cells filled earlier (or given)', () => {
    for (const build of [coinChange, lcs, knapsack]) {
      const p = build()
      const known = new Set(Object.keys(p.init))
      p.cells.forEach((c) => {
        c.deps.forEach(([r, col]) => expect(known.has(`${r},${col}`)).toBe(true))
        known.add(`${c.r},${c.c}`)
      })
    }
  })
})

describe('answer options', () => {
  it('always gives four distinct non-negative choices including the answer', () => {
    for (let v = 0; v < 40; v++)
      for (let k = 0; k < 10; k++) {
        const o = options(v)
        expect(o).toHaveLength(4)
        expect(new Set(o).size).toBe(4)
        expect(o).toContain(v)
        o.forEach((x) => expect(x).toBeGreaterThanOrEqual(0))
      }
  })
})
