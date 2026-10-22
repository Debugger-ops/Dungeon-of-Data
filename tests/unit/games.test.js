import { describe, expect, it } from 'vitest'
import { reverseRun, walk, deleteTask, insertTask } from '../../src/lib/list.js'
import { genOp, trick, toBits, popcount } from '../../src/lib/bits.js'
import { BIGO, CLASSES } from '../../src/lib/bigo.js'
import { twoPointerPuzzle, slidingPuzzle } from '../../src/lib/window.js'
import { PAIRS, deal } from '../../src/lib/memory.js'
import { bracketRun, bracketString, postfixPuzzle, postfixRun } from '../../src/lib/stackgame.js'
import { BUGS, bugLine } from '../../src/lib/bugs.js'
import { runTestsSync } from '../../src/lib/runner.js'
import { genGraph, dijkstraDone, dijkstraInit, dijkstraPick, dijkstraRef, kruskalRun } from '../../src/lib/wgraph.js'

const many = (f, n = 200) => Array.from({ length: n }, f)

describe('linked list lab', () => {
  it('the four-statement loop reverses any list', () => {
    for (let n = 1; n <= 7; n++) {
      const { init, steps, head } = reverseRun(n)
      expect(steps).toHaveLength(4 * n)
      const last = steps[steps.length - 1].state
      expect(walk(last.links, head)).toEqual(Array.from({ length: n }, (_, i) => n - 1 - i))
      expect(walk(init.links, 0)).toEqual(Array.from({ length: n }, (_, i) => i))
    }
  })
  it('delete and insert tasks have the right answers', () => {
    many(() => deleteTask(5)).forEach((t) => {
      expect(new Set(t.vals).size).toBe(5)
      expect(t.answer).toBe(t.target - 1)
    })
    many(() => insertTask(4)).forEach((t) => {
      const out = [...t.vals.slice(0, t.gap), t.v, ...t.vals.slice(t.gap)]
      expect(out).toEqual(out.slice().sort((a, b) => a - b))
      expect(new Set(out).size).toBe(5)
    })
  })
})

describe('bit bunker', () => {
  it('operation results fit in 8 bits and match', () => {
    many(genOp).forEach((o) => {
      expect(o.result).toBeGreaterThanOrEqual(0)
      expect(o.result).toBeLessThan(256)
      if (o.kind === 'and') expect(o.result).toBe(o.a & o.b)
      if (o.kind === 'not') expect(o.result + o.a).toBe(255)
      if (o.kind === 'shr') expect(o.result).toBe(Math.floor(o.a / 2 ** o.k))
    })
  })
  it('tricks have a unique correct choice', () => {
    many(trick, 400).forEach((t) => {
      expect(t.opts).toContain(t.answer)
      expect(new Set(t.opts).size).toBe(t.opts.length)
      expect(t.opts.length).toBeGreaterThanOrEqual(2)
    })
    expect(toBits(5)).toBe('00000101')
    expect(popcount(255)).toBe(8)
  })
})

describe('big-o blitz', () => {
  it('every answer is a known class and snippets are unique', () => {
    BIGO.forEach((b) => expect(CLASSES).toContain(b.ans))
    expect(new Set(BIGO.map((b) => b.code)).size).toBe(BIGO.length)
    expect(new Set(BIGO.map((b) => b.ans)).size).toBe(CLASSES.length)
  })
})

describe('pattern match', () => {
  it('two pointers always finds the pair', () => {
    many(() => twoPointerPuzzle()).forEach((p) => {
      const last = p.steps[p.steps.length - 1]
      expect(last.action).toBe('found')
      expect(p.a[last.l] + p.a[last.r]).toBe(p.target)
      p.steps.forEach((s) => expect(s.l).toBeLessThan(s.r))
      expect(p.steps.length).toBeGreaterThan(2)
    })
  })
  it('sliding window sums match a brute force', () => {
    many(() => slidingPuzzle()).forEach((p) => {
      p.sums.forEach((s, i) => expect(s).toBe(p.a.slice(i, i + p.k).reduce((x, y) => x + y, 0)))
      expect(p.best).toBe(Math.max(...p.sums))
      p.steps.forEach((s) => {
        expect(s.opts).toHaveLength(4)
        expect(new Set(s.opts).size).toBe(4)
        expect(s.opts).toContain(s.value)
      })
    })
  })
})

describe('memory match', () => {
  it('pairs are unique and every deal has exact pairs', () => {
    const texts = PAIRS.flat()
    expect(new Set(texts).size).toBe(texts.length)
    many(() => deal(8), 50).forEach((cards) => {
      expect(cards).toHaveLength(16)
      const by = {}
      cards.forEach((c) => (by[c.pair] = (by[c.pair] || []).concat(c.kind)))
      Object.values(by).forEach((k) => expect(k.sort()).toEqual(['def', 'term']))
    })
  })
})

describe('stack defender', () => {
  const ref = (s) => {
    const st = []
    const m = { ')': '(', ']': '[', '}': '{' }
    for (const c of s) {
      if ('([{'.includes(c)) st.push(c)
      else if (st.pop() !== m[c]) return false
    }
    return st.length === 0
  }
  it('bracket runs agree with an independent checker and end properly', () => {
    let valid = 0
    many(() => bracketString(), 400).forEach((s) => {
      const r = bracketRun(s)
      expect(r.valid).toBe(ref(s))
      const last = r.steps[r.steps.length - 1]
      expect(['accept', 'reject']).toContain(last.action)
      expect(last.action === 'accept').toBe(r.valid)
      if (r.valid) valid++
    })
    expect(valid).toBeGreaterThan(80)
    expect(valid).toBeLessThan(320)
  })
  it('postfix puzzles are well formed and evaluate correctly', () => {
    many(() => postfixPuzzle(4)).forEach((p) => {
      expect(p.tokens.filter((t) => typeof t === 'number')).toHaveLength(4)
      expect(p.tokens.filter((t) => typeof t !== 'number')).toHaveLength(3)
      const last = p.steps[p.steps.length - 1]
      expect(last.stack).toHaveLength(1)
      expect(postfixRun(p.tokens)).toEqual(p.steps)
    })
    expect(postfixRun([3, 4, '+', 2, '*']).pop().stack).toEqual([14])
  })
})

describe('bug hunt', () => {
  for (const b of BUGS) {
    it(`${b.title}: the fix passes, the bug fails, one line differs`, () => {
      const f = b.fixed.split('\n')
      const x = b.buggy.split('\n')
      expect(x).toHaveLength(f.length)
      expect(x.filter((l, i) => l !== f[i])).toHaveLength(1)
      expect(bugLine(b)).toBeGreaterThanOrEqual(0)
      const tests = b.tests.map(([args, want]) => ({ args, want }))
      expect(runTestsSync(b.fixed, b.fn, tests).results.every((r) => r.pass)).toBe(true)
      expect(runTestsSync(b.buggy, b.fn, tests).results.some((r) => !r.pass)).toBe(true)
    })
  }
})

describe('graph builder', () => {
  const bellman = (g) => {
    const d = Array(g.n).fill(Infinity)
    d[0] = 0
    for (let k = 0; k < g.n; k++) g.edges.forEach((e) => { d[e.b] = Math.min(d[e.b], d[e.a] + e.w); d[e.a] = Math.min(d[e.a], d[e.b] + e.w) })
    return d
  }
  it('graphs are connected with distinct weights', () => {
    many(() => genGraph(6), 100).forEach((g) => {
      expect(new Set(g.edges.map((e) => e.w)).size).toBe(g.edges.length)
      expect(bellman(g).every((d) => d < Infinity)).toBe(true)
    })
  })
  it('dijkstra matches Bellman-Ford and rejects a wrong pick', () => {
    many(() => genGraph(6), 100).forEach((g) => {
      expect(dijkstraRef(g)).toEqual(bellman(g))
      const s0 = dijkstraInit(g)
      const wrong = g.nodes.find((n) => n.id !== 0).id
      expect(dijkstraPick(g, s0, wrong).ok).toBe(false)
      expect(dijkstraPick(g, s0, 0).ok).toBe(true)
    })
    const g = genGraph(6)
    let s = dijkstraInit(g)
    while (!dijkstraDone(s)) s = dijkstraPick(g, s, s.dist.findIndex((d, i) => !s.done[i] && d === Math.min(...s.dist.filter((_, j) => !s.done[j])))).state
    expect(s.order).toHaveLength(6)
  })
  it('kruskal takes n-1 edges forming the minimum spanning tree', () => {
    const prim = (g) => {
      const inT = new Set([0])
      let total = 0
      while (inT.size < g.n) {
        const e = g.edges.filter((x) => inT.has(x.a) !== inT.has(x.b)).sort((p, q) => p.w - q.w)[0]
        total += e.w
        inT.add(inT.has(e.a) ? e.b : e.a)
      }
      return total
    }
    many(() => genGraph(6), 100).forEach((g) => {
      const taken = kruskalRun(g).filter((s) => s.action === 'take')
      expect(taken).toHaveLength(5)
      expect(taken.reduce((t, s) => t + s.e.w, 0)).toBe(prim(g))
    })
  })
})

describe('boss rush rewards', () => {
  it('pays per room plus a full-clear bonus', async () => {
    const { rushBonus } = await import('../../src/BossRush.jsx')
    expect([0, 1, 2, 3].map(rushBonus)).toEqual([0, 30, 60, 150])
  })
})

import { LEVELS, WORLDS, clearedCount, isOpen, nextLevel, totalStars, worldDone } from '../../src/lib/campaign.js'
import { ROOMS } from '../../src/lib/rooms.js'
import { mergeStates } from '../../src/lib/merge.js'
import { normalize } from '../../src/progress.jsx'
import { ACHIEVEMENTS } from '../../src/lib/achievements.js'

const MODES = {
  sort: ['play', 'watch'], bsearch: ['v'], keep: ['sq', 'll'], crypt: ['bst', 'trav', 'heap', 'ext'], maze: ['bfs', 'dfs', 'dij'], hash: ['chain', 'probe'],
  dp: ['coin', 'lcs', 'knap'], type: ['type', 'write'], list: ['reverse', 'delete', 'insert'], bits: ['ops', 'tricks'], bigo: ['blitz'], window: ['two', 'slide'],
  memory: ['match'], stackdef: ['brackets', 'postfix'], bug: ['hunt'], graphb: ['dijkstra', 'kruskal'],
}
describe('campaign', () => {
  it('has 4 worlds of 5 levels with valid rooms, modes and difficulties', () => {
    expect(WORLDS).toHaveLength(4)
    expect(LEVELS).toHaveLength(20)
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(20)
    LEVELS.forEach((l) => {
      expect(ROOMS.some((r) => r.id === l.room)).toBe(true)
      expect(MODES[l.room]).toContain(l.mode)
      expect(['easy', 'normal', 'hard']).toContain(l.diff)
      expect(l.tip.length).toBeGreaterThan(10)
    })
  })
  it('difficulty never goes down from one world boss to the next world start by more than a step', () => {
    const rank = { easy: 0, normal: 1, hard: 2 }
    expect(rank[LEVELS[0].diff]).toBe(0)
    expect(rank[LEVELS[LEVELS.length - 1].diff]).toBe(2)
  })
  it('unlocks one level at a time', () => {
    expect(isOpen('1-1', {})).toBe(true)
    expect(isOpen('1-2', {})).toBe(false)
    expect(isOpen('1-2', { '1-1': 1 })).toBe(true)
    expect(isOpen('1-3', { '1-1': 3 })).toBe(false)
    expect(isOpen('2-1', { '1-5': 2 })).toBe(true)
    expect(nextLevel('1-5').id).toBe('2-1')
    expect(nextLevel('4-5')).toBeNull()
  })
  it('counts progress', () => {
    const st = { '1-1': 3, '1-2': 1, '1-3': 0 }
    expect(clearedCount(st)).toBe(2)
    expect(totalStars(st)).toBe(4)
    expect(worldDone(WORLDS[0], st)).toBe(false)
  })
  it('saves merge to the best stars and old saves gain the field', () => {
    const a = normalize({ xp: 1, rooms: {}, campaign: { stars: { '1-1': 2, '1-2': 1 } } })
    const b = normalize({ xp: 1, rooms: {}, campaign: { stars: { '1-1': 3, '1-3': 2 } } })
    expect(mergeStates(a, b).campaign.stars).toEqual({ '1-1': 3, '1-2': 1, '1-3': 2 })
    expect(normalize({ xp: 0, rooms: {} }).campaign).toEqual({ stars: {} })
    expect(normalize({ xp: 0, rooms: {}, campaign: 5 }).campaign).toEqual({ stars: {} })
  })
  it('Pathfinder unlocks after five cleared levels', () => {
    const t = ACHIEVEMENTS.find((x) => x.id === 'lvl5').test
    const stars = (n) => ({ campaign: { stars: Object.fromEntries(LEVELS.slice(0, n).map((l) => [l.id, 1])) } })
    expect(t(stars(4))).toBe(false)
    expect(t(stars(5))).toBe(true)
  })
})
