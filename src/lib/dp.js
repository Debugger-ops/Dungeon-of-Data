import { rand, shuffle } from './util'

// Each builder returns a puzzle:
//   rows, cols: table size; rowLabels / colLabels: header text
//   init: { 'r,c': value } cells given for free (base cases)
//   cells: ordered cells to fill: { r, c, value, deps: [[r,c],...], why }
//   formula: recurrence shown to the player, lesson: shown at the end

const key = (r, c) => `${r},${c}`

export function coinChange(pick = rand) {
  const SETS = [[1, 3, 4], [1, 4, 5], [1, 5, 6], [1, 2, 5], [1, 3, 5]]
  const coins = SETS[pick(0, SETS.length - 1)]
  const N = 8
  const dp = [0]
  const cells = []
  for (let a = 1; a <= N; a++) {
    const usable = coins.filter((c) => c <= a)
    const best = Math.min(...usable.map((c) => dp[a - c]))
    dp[a] = 1 + best
    cells.push({
      r: 0,
      c: a,
      value: dp[a],
      deps: usable.map((c) => [0, a - c]),
      why: `dp[${a}] = 1 + min(${usable.map((c) => `dp[${a - c}]=${dp[a - c]}`).join(', ')}) = ${dp[a]}`,
    })
  }
  return {
    kind: 'coin',
    title: `Fewest coins to make each amount with coins {${coins.join(', ')}}`,
    rows: 1,
    cols: N + 1,
    rowLabels: ['min coins'],
    colLabels: Array.from({ length: N + 1 }, (_, i) => String(i)),
    colHead: 'amount',
    init: { [key(0, 0)]: 0 },
    cells,
    formula: `dp[a] = 1 + min over coins c of dp[a - c]   (dp[0] = 0)`,
    lesson: `Each amount reuses answers for smaller amounts, so every subproblem is solved once: O(amount x coins) instead of exponential. Greedy "biggest coin first" can fail here (try 6 with {1, 3, 4}).`,
    final: dp[N],
  }
}

export function lcs(pick = rand) {
  const L = ['A', 'B', 'C', 'D']
  let s
  let t
  let table
  do {
    s = Array.from({ length: 3 }, () => L[pick(0, 3)])
    t = Array.from({ length: 4 }, () => L[pick(0, 3)])
    table = Array.from({ length: 4 }, () => Array(5).fill(0))
    for (let i = 1; i <= 3; i++) for (let j = 1; j <= 4; j++) table[i][j] = s[i - 1] === t[j - 1] ? table[i - 1][j - 1] + 1 : Math.max(table[i - 1][j], table[i][j - 1])
  } while (table[3][4] < 2)
  const init = {}
  for (let i = 0; i <= 3; i++) init[key(i, 0)] = 0
  for (let j = 0; j <= 4; j++) init[key(0, j)] = 0
  const cells = []
  for (let i = 1; i <= 3; i++) {
    for (let j = 1; j <= 4; j++) {
      const match = s[i - 1] === t[j - 1]
      cells.push({
        r: i,
        c: j,
        value: table[i][j],
        deps: match ? [[i - 1, j - 1]] : [[i - 1, j], [i, j - 1]],
        why: match
          ? `${s[i - 1]} = ${t[j - 1]}, so take the diagonal and add 1: ${table[i - 1][j - 1]} + 1 = ${table[i][j]}`
          : `${s[i - 1]} != ${t[j - 1]}, so take the larger of up (${table[i - 1][j]}) and left (${table[i][j - 1]}) = ${table[i][j]}`,
      })
    }
  }
  return {
    kind: 'lcs',
    title: `Longest common subsequence of ${s.join('')} and ${t.join('')}`,
    rows: 4,
    cols: 5,
    rowLabels: ['-', ...s],
    colLabels: ['-', ...t],
    colHead: '',
    init,
    cells,
    formula: `match: dp[i][j] = dp[i-1][j-1] + 1;  otherwise dp[i][j] = max(dp[i-1][j], dp[i][j-1])`,
    lesson: `The table answers "how long is the common subsequence of these two prefixes", building from empty prefixes. The corner cell is the answer: ${table[3][4]}. Time and space O(n x m).`,
    final: table[3][4],
  }
}

export function knapsack(pick = rand) {
  const W = 4
  const items = Array.from({ length: 3 }, () => ({ w: pick(1, 3), v: pick(2, 9) }))
  const dp = Array.from({ length: 4 }, () => Array(W + 1).fill(0))
  const cells = []
  for (let i = 1; i <= 3; i++) {
    const { w, v } = items[i - 1]
    for (let c = 1; c <= W; c++) {
      const skip = dp[i - 1][c]
      const take = w <= c ? dp[i - 1][c - w] + v : -1
      dp[i][c] = Math.max(skip, take)
      cells.push({
        r: i,
        c,
        value: dp[i][c],
        deps: w <= c ? [[i - 1, c], [i - 1, c - w]] : [[i - 1, c]],
        why:
          w > c
            ? `item ${i} (weight ${w}) does not fit in capacity ${c}, so copy the cell above: ${skip}`
            : `max(skip = ${skip}, take = dp[${i - 1}][${c - w}] + ${v} = ${take}) = ${dp[i][c]}`,
      })
    }
  }
  const init = {}
  for (let i = 0; i <= 3; i++) init[key(i, 0)] = 0
  for (let c = 0; c <= W; c++) init[key(0, c)] = 0
  return {
    kind: 'knap',
    title: `0/1 knapsack, capacity ${W}`,
    rows: 4,
    cols: W + 1,
    rowLabels: ['no items', ...items.map((it, i) => `item ${i + 1} (w${it.w}, v${it.v})`)],
    colLabels: Array.from({ length: W + 1 }, (_, i) => String(i)),
    colHead: 'capacity',
    init,
    cells,
    formula: `if w > c: dp[i][c] = dp[i-1][c];  else dp[i][c] = max(dp[i-1][c], dp[i-1][c-w] + v)`,
    lesson: `Each cell asks "best value using the first i items with capacity c". Skip the item or take it, reusing smaller subproblems. Time O(items x capacity).`,
    final: dp[3][W],
  }
}

// Four distinct non-negative answers: the right one plus plausible near misses.
export function options(value, pick = rand) {
  const set = new Set([value])
  const tries = [value + 1, value - 1, value + 2, value - 2, value + 3]
  for (const t of tries) if (set.size < 4 && t >= 0) set.add(t)
  while (set.size < 4) set.add(pick(0, value + 4))
  return shuffle([...set])
}
