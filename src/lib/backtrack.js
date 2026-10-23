import { rand, shuffle, uniq } from './util'

// ---- N-Queens, one row at a time ----
export const safe = (cols, c) => cols.every((cc, r) => cc !== c && Math.abs(cc - c) !== cols.length - r)
export const qInit = (n = 5) => ({ n, cols: [], tried: Array.from({ length: n + 1 }, () => []) })
// Columns the next queen may go in: not attacked, and not already tried (and abandoned) for this row.
export const qOptions = (s) => Array.from({ length: s.n }, (_, c) => c).filter((c) => safe(s.cols, c) && !s.tried[s.cols.length].includes(c))
export const qPlace = (s, c) => ({ ...s, cols: [...s.cols, c] })
export function qBack(s) {
  const last = s.cols[s.cols.length - 1]
  const cols = s.cols.slice(0, -1)
  const tried = s.tried.map((t) => t.slice())
  tried[cols.length].push(last)
  tried[s.cols.length] = []
  return { ...s, cols, tried }
}
export const qDone = (s) => s.cols.length === s.n
export const qStuck = (s) => !qDone(s) && qOptions(s).length === 0
// Reference player: always take the leftmost option, backtrack when stuck. Returns the number of actions.
export function qSolve(n = 5) {
  let s = qInit(n)
  let steps = 0
  while (!qDone(s) && steps < 500) {
    s = qStuck(s) ? qBack(s) : qPlace(s, qOptions(s)[0])
    steps++
  }
  return { state: s, steps }
}

// ---- Subset sum by include / skip decisions ----
export const canReach = (items, i, need) => (need === 0 ? true : need < 0 || i >= items.length ? false : canReach(items, i + 1, need - items[i]) || canReach(items, i + 1, need))
// Is this decision still compatible with hitting the target exactly?
export const subsetOk = (items, i, need, take) => {
  const n2 = take ? need - items[i] : need
  return n2 >= 0 && canReach(items, i + 1, n2)
}
export function subsetPuzzle(n = 6) {
  const items = uniq(n, 2, 14)
  const pick = shuffle(items.map((_, i) => i)).slice(0, rand(2, 3))
  return { items, target: pick.reduce((t, i) => t + items[i], 0) }
}
