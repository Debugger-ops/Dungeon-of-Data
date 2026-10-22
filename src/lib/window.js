import { rand, uniq } from './util'
import { options } from './dp'

// ---- Two pointers on a sorted array: find two numbers that add up to the target ----
export function twoPointerPuzzle(n = 8) {
  for (;;) {
    const p = twoPointerOnce(n)
    if (p.steps.length >= 3) return p
  }
}

function twoPointerOnce(n) {
  const a = uniq(n, 1, 30).sort((x, y) => x - y)
  let i = rand(0, n - 2)
  const j = rand(i + 1, n - 1)
  const target = a[i] + a[j]
  const steps = []
  let l = 0
  let r = n - 1
  for (;;) {
    const sum = a[l] + a[r]
    const action = sum === target ? 'found' : sum < target ? 'l' : 'r'
    steps.push({ l, r, sum, action })
    if (action === 'found') break
    if (action === 'l') l++
    else r--
  }
  return { a, target, steps }
}
export const TP_ACTIONS = [
  ['l', 'Sum too small: move left pointer right'],
  ['r', 'Sum too big: move right pointer left'],
  ['found', 'Sum equals the target: found it'],
]

// ---- Sliding window: the sum of every window of size k, updated in O(1) per step ----
export function slidingPuzzle(n = 9, k = 3) {
  const a = Array.from({ length: n }, () => rand(1, 9))
  const sums = [a.slice(0, k).reduce((s, x) => s + x, 0)]
  for (let i = 1; i + k <= n; i++) sums.push(sums[i - 1] - a[i - 1] + a[i + k - 1])
  const steps = sums.slice(1).map((v, i) => ({ start: i + 1, leaving: a[i], entering: a[i + k], value: v, opts: options(v) }))
  return { a, k, sums, steps, best: Math.max(...sums) }
}
