// Empirical operation counts for the Analytics "Algorithm lab". Deterministic: own LCG, never touches the game's RNG.
export const SIZES = [8, 16, 32, 64, 128, 256, 512, 1024]

const lcg = (seed) => {
  let a = seed >>> 0
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0
    return a / 4294967296
  }
}
const makeInput = (kind, n) => {
  const r = lcg(n * 7919)
  const base = Array.from({ length: n }, (_, i) => i)
  if (kind === 'sorted') return base
  if (kind === 'reversed') return base.reverse()
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[base[i], base[j]] = [base[j], base[i]]
  }
  return base
}

// Each sorter returns the number of element comparisons made (same algorithms as the Sorting Hall).
const SORTERS = {
  bubble(a) {
    let c = 0
    for (let i = 0; i < a.length - 1; i++) {
      let sw = false
      for (let j = 0; j < a.length - i - 1; j++) {
        c++
        if (a[j] > a[j + 1]) {
          ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
          sw = true
        }
      }
      if (!sw) break
    }
    return c
  },
  selection(a) {
    let c = 0
    for (let i = 0; i < a.length - 1; i++) {
      let m = i
      for (let j = i + 1; j < a.length; j++) {
        c++
        if (a[j] < a[m]) m = j
      }
      ;[a[i], a[m]] = [a[m], a[i]]
    }
    return c
  },
  insertion(a) {
    let c = 0
    for (let i = 1; i < a.length; i++) {
      let j = i
      while (j > 0) {
        c++
        if (a[j - 1] > a[j]) {
          ;[a[j - 1], a[j]] = [a[j], a[j - 1]]
          j--
        } else break
      }
    }
    return c
  },
  merge(a) {
    let c = 0
    const go = (l, r) => {
      if (l >= r) return
      const m = (l + r) >> 1
      go(l, m)
      go(m + 1, r)
      const t = []
      let i = l
      let j = m + 1
      while (i <= m && j <= r) {
        c++
        t.push(a[i] <= a[j] ? a[i++] : a[j++])
      }
      while (i <= m) t.push(a[i++])
      while (j <= r) t.push(a[j++])
      t.forEach((v, k) => (a[l + k] = v))
    }
    go(0, a.length - 1)
    return c
  },
  quick(a) {
    let c = 0
    const go = (l, r) => {
      if (l >= r) return
      const p = a[r]
      let i = l
      for (let j = l; j < r; j++) {
        c++
        if (a[j] < p) {
          ;[a[i], a[j]] = [a[j], a[i]]
          i++
        }
      }
      ;[a[i], a[r]] = [a[r], a[i]]
      go(l, i - 1)
      go(i + 1, r)
    }
    go(0, a.length - 1)
    return c
  },
}
export const SORT_NAMES = { bubble: 'Bubble', selection: 'Selection', insertion: 'Insertion', merge: 'Merge', quick: 'Quick' }

export function sortCounts(kind) {
  return Object.fromEntries(Object.entries(SORTERS).map(([k, f]) => [k, SIZES.map((n) => Math.max(1, f(makeInput(kind, n))))]))
}

// Height (levels) of a plain BST after inserting n keys: random order (average of trials) vs sorted order.
export function bstHeights() {
  const height = (keys) => {
    const L = new Map()
    const R = new Map()
    let root = keys[0]
    let h = 1
    for (let i = 1; i < keys.length; i++) {
      let n = root
      let d = 1
      for (;;) {
        d++
        const side = keys[i] < n ? L : R
        if (!side.has(n)) {
          side.set(n, keys[i])
          break
        }
        n = side.get(n)
      }
      if (d > h) h = d
    }
    return h
  }
  const trials = 16
  const rnd = SIZES.map((n) => {
    let t = 0
    for (let k = 0; k < trials; k++) {
      const r = lcg(n * 31 + k)
      const keys = Array.from({ length: n }, (_, i) => i)
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1))
        ;[keys[i], keys[j]] = [keys[j], keys[i]]
      }
      t += height(keys)
    }
    return t / trials
  })
  return {
    random: rnd,
    sorted: SIZES.map((n) => n),
    ideal: SIZES.map((n) => Math.ceil(Math.log2(n + 1))),
  }
}
