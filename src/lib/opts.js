import { shuffle } from './util'
// Four distinct numeric choices: the answer plus near misses (can go negative).
export function numChoices(v) {
  const set = new Set([v])
  for (const d of [1, -1, 2, -2, 3, -3, 4]) if (set.size < 4) set.add(v + d)
  return shuffle([...set])
}

// Four distinct integer choices inside [lo, hi]: the answer plus its nearest neighbours.
export function rangeChoices(v, lo, hi) {
  const others = []
  for (let x = lo; x <= hi; x++) if (x !== v) others.push(x)
  others.sort((a, b) => Math.abs(a - v) - Math.abs(b - v) || a - b)
  return shuffle([v, ...others.slice(0, 3)])
}
