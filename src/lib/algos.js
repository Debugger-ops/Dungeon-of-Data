export const inv = (a) => {
  let c = 0
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) c++
  return c
}

// Minimum swaps to sort = n - number of cycles in the permutation
export function minSwaps(a) {
  const s = a.slice().sort((x, y) => x - y)
  const pos = new Map(s.map((v, i) => [v, i]))
  const seen = new Array(a.length).fill(false)
  let cyc = 0
  for (let i = 0; i < a.length; i++) {
    if (seen[i]) continue
    cyc++
    let j = i
    while (!seen[j]) {
      seen[j] = true
      j = pos.get(a[j])
    }
  }
  return a.length - cyc
}

export const ALGOS = {
  bubble: { n: 'Bubble', code: ['for i = 0 .. n-2', '  for j = 0 .. n-i-2', '    if a[j] > a[j+1]', '      swap(a[j], a[j+1])'], cx: ['O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'yes'] },
  selection: { n: 'Selection', code: ['for i = 0 .. n-2', '  m = i', '  for j = i+1 .. n-1', '    if a[j] < a[m]: m = j', '  swap(a[i], a[m])'], cx: ['O(n²)', 'O(n²)', 'O(n²)', 'O(1)', 'no'] },
  insertion: { n: 'Insertion', code: ['for i = 1 .. n-1', '  j = i', '  while j > 0 and a[j-1] > a[j]', '    swap(a[j-1], a[j]); j--'], cx: ['O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'yes'] },
  merge: { n: 'Merge', code: ['mergeSort(l, r):', '  if l >= r: return', '  mergeSort(l, mid); mergeSort(mid+1, r)', '  merge: take the smaller front element', '  write it back into a[l..r]'], cx: ['O(n log n)', 'O(n log n)', 'O(n log n)', 'O(n)', 'yes'] },
  quick: { n: 'Quick', code: ['quickSort(l, r):', '  pivot = a[r]; i = l', '  for j = l .. r-1', '    if a[j] < pivot: swap(a[i++], a[j])', '  swap(a[i], a[r])   // pivot lands', '  quickSort(l, i-1); quickSort(i+1, r)'], cx: ['O(n log n)', 'O(n log n)', 'O(n²)', 'O(log n)', 'no'] },
}

// Precompute every animation frame so the UI can scrub forward and backward.
export function buildFrames(algo, input) {
  const a = input.slice()
  const n = a.length
  const F = []
  let cmp = 0
  let swp = 0
  const all = () => Array.from({ length: n }, (_, k) => k)
  const snap = (hi, kind, line, msg, done) => F.push({ a: a.slice(), hi, kind, line, msg, done: (done || []).slice(), cmp, swp })
  const sw = (i, j) => {
    ;[a[i], a[j]] = [a[j], a[i]]
    swp++
  }
  snap([], 'start', -1, 'Starting array.')

  if (algo === 'bubble') {
    const done = []
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        cmp++
        snap([j, j + 1], 'cmp', 2, `Compare ${a[j]} and ${a[j + 1]}.`, done)
        if (a[j] > a[j + 1]) {
          sw(j, j + 1)
          snap([j, j + 1], 'swap', 3, `${a[j]} is smaller, so it moved left.`, done)
        }
      }
      done.push(n - i - 1)
    }
  } else if (algo === 'selection') {
    const done = []
    for (let i = 0; i < n - 1; i++) {
      let m = i
      for (let j = i + 1; j < n; j++) {
        cmp++
        snap([j, m], 'cmp', 3, `Is ${a[j]} smaller than the current minimum ${a[m]}?`, done)
        if (a[j] < a[m]) m = j
      }
      if (m !== i) sw(i, m)
      snap([i, m], 'swap', 4, `Minimum ${a[i]} goes to position ${i + 1}.`, done)
      done.push(i)
    }
  } else if (algo === 'insertion') {
    for (let i = 1; i < n; i++) {
      const pre = Array.from({ length: i }, (_, k) => k)
      let j = i
      while (j > 0) {
        cmp++
        snap([j - 1, j], 'cmp', 2, `Is ${a[j - 1]} bigger than ${a[j]}?`, pre)
        if (a[j - 1] > a[j]) {
          sw(j - 1, j)
          snap([j - 1, j], 'swap', 3, `Shift ${a[j]} left.`, pre)
          j--
        } else break
      }
    }
  } else if (algo === 'merge') {
    const ms = (l, r) => {
      if (l >= r) return
      const m = (l + r) >> 1
      ms(l, m)
      ms(m + 1, r)
      const L = a.slice(l, m + 1)
      const R = a.slice(m + 1, r + 1)
      const out = []
      let i = 0
      let j = 0
      while (i < L.length && j < R.length) {
        cmp++
        snap([l + out.length, l + out.length + L.length - i], 'cmp', 3, `Fronts: ${L[i]} vs ${R[j]}. Take the smaller.`)
        out.push(L[i] <= R[j] ? L[i++] : R[j++])
        const seg = out.concat(L.slice(i), R.slice(j))
        for (let k = 0; k < seg.length; k++) a[l + k] = seg[k]
        swp++
        snap([l + out.length - 1], 'swap', 4, `Placed ${out[out.length - 1]}.`)
      }
    }
    ms(0, n - 1)
  } else {
    const fixed = []
    const qs = (l, r) => {
      if (l > r) return
      if (l === r) {
        fixed.push(l)
        return
      }
      const p = a[r]
      let i = l
      snap([r], 'pivot', 1, `Pivot is ${p}.`, fixed)
      for (let j = l; j < r; j++) {
        cmp++
        snap([j, r], 'cmp', 3, `Is ${a[j]} smaller than pivot ${p}?`, fixed)
        if (a[j] < p) {
          if (i !== j) {
            sw(i, j)
            snap([i, j], 'swap', 3, `${a[i]} moves to the left block.`, fixed)
          }
          i++
        }
      }
      if (i !== r) sw(i, r)
      fixed.push(i)
      snap([i, r], 'swap', 4, `Pivot ${p} lands in its final spot.`, fixed)
      qs(l, i - 1)
      qs(i + 1, r)
    }
    qs(0, n - 1)
  }
  snap([], 'done', -1, 'Sorted.', all())
  return F
}
