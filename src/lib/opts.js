import { shuffle } from './util'
// Four distinct numeric choices: the answer plus near misses (can go negative).
export function numChoices(v) {
  const set = new Set([v])
  for (const d of [1, -1, 2, -2, 3, -3, 4]) if (set.size < 4) set.add(v + d)
  return shuffle([...set])
}
