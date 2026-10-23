import { rand } from './util'

export const find = (parent, x) => {
  while (parent[x] !== x) x = parent[x]
  return x
}

// Random union(a, b) calls on n elements. At least one is redundant (already connected) when possible.
export function genOps(n = 8, k = 6) {
  let ops = []
  for (let t = 0; t < 40; t++) {
    ops = Array.from({ length: k }, () => {
      const a = rand(0, n - 1)
      let b = rand(0, n - 1)
      if (b === a) b = (b + 1) % n
      return [a, b]
    })
    if (ufRun(n, ops).some((s) => !s.merged)) break
  }
  return ops
}

// Plain union without path compression: the root of a is attached under the root of b.
export function ufRun(n, ops) {
  const parent = Array.from({ length: n }, (_, i) => i)
  let comps = n
  return ops.map(([a, b]) => {
    const ra = find(parent, a)
    const rb = find(parent, b)
    const merged = ra !== rb
    if (merged) {
      parent[ra] = rb
      comps--
    }
    return {
      a, b, ra, rb, merged, comps, parent: parent.slice(),
      why: merged ? `find(${a}) = ${ra} and find(${b}) = ${rb} are different roots, so the groups merge: ${comps} left.` : `find(${a}) and find(${b}) are both ${ra}, so they are already in one group: still ${comps}.`,
    }
  })
}

// Find-mode puzzle: the final forest, plus a query node with the path to its root.
export function findPuzzle(n = 8, k = 6) {
  const ops = genOps(n, k)
  const steps = ufRun(n, ops)
  const parent = steps[steps.length - 1].parent
  const queries = Array.from({ length: 4 }, () => {
    const x = rand(0, n - 1)
    const path = [x]
    while (parent[path[path.length - 1]] !== path[path.length - 1]) path.push(parent[path[path.length - 1]])
    return { x, root: path[path.length - 1], path }
  })
  return { ops, parent, queries }
}
