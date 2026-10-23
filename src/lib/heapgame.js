import { uniq } from './util'

// Bottom-up heapify as a series of sift-down decisions: swap with the left child, the right child, or stay.
export function heapifyRun(arr, mode = 'min') {
  const a = arr.slice()
  const n = a.length
  const better = (x, y) => (mode === 'min' ? x < y : x > y)
  const word = mode === 'min' ? 'smaller' : 'larger'
  const steps = []
  for (let root = Math.floor(n / 2) - 1; root >= 0; root--) {
    let k = root
    for (;;) {
      const l = 2 * k + 1
      const r = 2 * k + 2
      let best = k
      if (l < n && better(a[l], a[best])) best = l
      if (r < n && better(a[r], a[best])) best = r
      const action = best === k ? 'stay' : best === l ? 'left' : 'right'
      steps.push({
        i: k, root, before: a.slice(), action,
        why: action === 'stay' ? `${a[k]} is already ${word} than its children, so it stays.` : `${a[best]} is the ${word} child (and beats ${a[k]}), so swap them and keep sifting ${a[k]} down.`,
      })
      if (best === k) break
      ;[a[k], a[best]] = [a[best], a[k]]
      k = best
    }
  }
  return { steps, result: a }
}
export const isHeap = (a, mode = 'min') => a.every((v, i) => i === 0 || (mode === 'min' ? a[(i - 1) >> 1] <= v : a[(i - 1) >> 1] >= v))
export const heapPuzzle = () => uniq(7, 1, 40)
