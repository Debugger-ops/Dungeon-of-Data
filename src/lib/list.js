import { rand, shuffle, uniq } from './util'

// ---- Reverse a singly linked list, one statement at a time ----
export const REV = [
  { id: 'next', code: 'next = curr.next' },
  { id: 'point', code: 'curr.next = prev' },
  { id: 'prev', code: 'prev = curr' },
  { id: 'curr', code: 'curr = next' },
]

// links[i] is the index that node i points to (-1 = null). Returns the starting state and every statement in order,
// each with the state AFTER it runs. The reversed list starts at `prev` when the loop ends.
export function reverseRun(n) {
  const links = Array.from({ length: n }, (_, i) => (i + 1 < n ? i + 1 : -1))
  let prev = -1
  let curr = 0
  let nxt = null
  const init = { links: links.slice(), prev, curr, nxt }
  const steps = []
  while (curr !== -1) {
    for (const s of REV) {
      if (s.id === 'next') nxt = links[curr]
      else if (s.id === 'point') links[curr] = prev
      else if (s.id === 'prev') prev = curr
      else curr = nxt
      steps.push({ stmt: s.id, state: { links: links.slice(), prev, curr, nxt } })
    }
  }
  return { init, steps, head: prev }
}

// Walk a links array from a head and return the visiting order of node indices.
export function walk(links, head) {
  const out = []
  let i = head
  while (i !== -1 && out.length <= links.length) {
    out.push(i)
    i = links[i]
  }
  return out
}

// ---- Delete: click the node whose next pointer must change (or "head" when deleting the first node) ----
export function deleteTask(n = 5) {
  const vals = shuffle(uniq(n, 10, 99))
  const target = rand(0, n - 1)
  return { vals, target, answer: target - 1 } // answer -1 means the head pointer
}

// ---- Insert into a sorted list: pick the gap (0 = before the first node, n = after the last) ----
export function insertTask(n = 4) {
  const all = uniq(n + 1, 10, 99)
  const v = all[0]
  const vals = all.slice(1).sort((a, b) => a - b)
  const gap = vals.filter((x) => x < v).length
  return { vals, v, gap }
}

